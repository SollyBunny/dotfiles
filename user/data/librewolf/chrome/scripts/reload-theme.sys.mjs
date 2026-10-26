// Reloads userChrome.css (and imported stylesheets) in every open
// browser window when a top-level CSS file changes on disk.

import { Subprocess } from "resource://gre/modules/Subprocess.sys.mjs";
import { clearTimeout, setTimeout } from "resource://gre/modules/Timer.sys.mjs";

const CHROME_DIR = Services.dirsvc.get("UChrm", Ci.nsIFile).path;
const IGNORED_FILES = new Set(["userContent.css"]);
const RELOAD_DEBOUNCE_MS = 150;

const pending = new Set();
let monitor = null;
let reloadTimer = null;
let reloading = false;
let shuttingDown = false;
let failed = false;

function isCss(path) {
	return path.endsWith(".css") && !IGNORED_FILES.has(PathUtils.filename(path));
}

function showError(message) {
	if (failed) return;
	failed = true;
	console.error(`[userChrome reload] ${message}`);

	try {
		Services.prompt.alert(null, "userChrome reload", message);
	} catch (e) {
		Cu.reportError(e);
	}
}

function stopMonitor() {
	const current = monitor;
	monitor = null;

	if (current) {
		current.exited = true;
		current.process.kill();
	}
}

function fail(message) {
	stopMonitor();
	showError(message);
}

function collectSheets(sheet, sheets, seen) {
	if (!sheet || seen.has(sheet)) return;

	seen.add(sheet);
	sheets.push(sheet);

	let rules;
	try {
		rules = sheet.cssRules;
	} catch {
		return;
	}

	if (!rules) return;

	for (const rule of rules) {
		if (rule.styleSheet) {
			collectSheets(rule.styleSheet, sheets, seen);
		}
	}
}

function sheetPath(sheet) {
	if (!sheet.href) return null;

	try {
		return Services.io.newURI(sheet.href).QueryInterface(Ci.nsIFileURL).file.path;
	} catch {
		return null;
	}
}

function forceChromeRepaint(browserWindow) {
	const doc = browserWindow.document;
	const root = doc.documentElement;

	// Flush style/layout work.
	void root.getBoundingClientRect();
	browserWindow.windowUtils.updateLayerTree();

	// Toggle a temporary paint-affecting property across frames.
	root.style.setProperty("outline", "1px solid transparent", "important");

	void root.getBoundingClientRect();
	browserWindow.windowUtils.updateLayerTree();

	browserWindow.requestAnimationFrame(() => {
		if (browserWindow.closed) return;

		try {
			root.style.removeProperty("outline");

			void root.getBoundingClientRect();
			browserWindow.windowUtils.updateLayerTree();
		} catch (e) {
			console.error("[userChrome reload] Deferred refresh failed:", e);
		}
	});
}

async function reloadUserChrome(changed) {
	let count = 0;
	const windows = [];
	const enumerator = Services.wm.getEnumerator("navigator:browser");

	while (enumerator.hasMoreElements()) {
		windows.push(enumerator.getNext());
	}

	for (const browserWindow of windows) {
		const sheets = [];

		try {
			const seen = new Set();

			for (const sheet of browserWindow.InspectorUtils.getAllStyleSheets(
				browserWindow.document,
				false,
			)) {
				collectSheets(sheet, sheets, seen);
			}
		} catch (e) {
			console.error("[userChrome reload] Could not list stylesheets:", e);
			continue;
		}

		for (const sheet of sheets) {
			const path = sheetPath(sheet);

			if (!path || !changed.has(path)) continue;

			try {
				const content = await IOUtils.readUTF8(path);

				browserWindow.InspectorUtils.parseStyleSheet(sheet, content);

				count++;
			} catch (e) {
				console.error(`[userChrome reload] Could not reload ${path}:`, e);
			}
		}
	}

	if (!count) return;

	for (const browserWindow of windows) {
		try {
			forceChromeRepaint(browserWindow);
		} catch (e) {
			console.error("[userChrome reload] Could not repaint window:", e);
		}
	}

	console.log(`[userChrome reload] Reloaded ${count} stylesheet(s)`);
}

function queueReload(path) {
	if (!isCss(path)) return;

	pending.add(path);

	if (reloadTimer) {
		clearTimeout(reloadTimer);
	}

	reloadTimer = setTimeout(flushReloads, RELOAD_DEBOUNCE_MS);
}

async function flushReloads() {
	reloadTimer = null;

	if (reloading || shuttingDown) return;

	reloading = true;

	try {
		while (pending.size && !shuttingDown) {
			const changed = new Set(pending);
			pending.clear();

			await reloadUserChrome(changed);
		}
	} finally {
		reloading = false;
	}
}

function handleLine(line) {
	const prefix = `${CHROME_DIR}: `;
	if (!line.startsWith(prefix)) return;

	const rest = line.slice(prefix.length);

	// Editors often save by renaming a temporary file over the target.
	const renamed = rest.match(/^(.*): renamed to (.*)$/);

	if (renamed) {
		queueReload(renamed[2]);
		return;
	}

	const match = rest.match(/^(.*): (changed|changes done|created)$/);

	if (match) {
		queueReload(match[1]);
	}
}

async function readMonitor(state) {
	try {
		while (!state.exited) {
			const chunk = await state.process.stdout.readString();
			if (!chunk) break;

			state.buffer += chunk;

			let newline;
			while ((newline = state.buffer.indexOf("\n")) >= 0) {
				const line = state.buffer.slice(0, newline);
				state.buffer = state.buffer.slice(newline + 1);

				if (line) handleLine(line);
			}
		}
	} catch (e) {
		if (!shuttingDown && monitor === state) {
			fail(`Could not read gio monitor output: ${e.message || e}`);
		}
	}
}

async function readMonitorErrors(state) {
	if (!state.process.stderr) return;

	try {
		while (!state.exited) {
			const chunk = await state.process.stderr.readString();
			if (!chunk) break;

			state.stderr = (state.stderr + chunk).slice(-4096);
		}
	} catch {
		// The process has exited; its exit handler reports failures.
	}
}

async function findGio() {
	for (const name of ["gio", "/usr/bin/gio", "/bin/gio"]) {
		try {
			return await Subprocess.pathSearch(name);
		} catch {
			// Try the next location.
		}
	}

	throw new Error("gio was not found (it is part of glib2)");
}

async function startMonitor() {
	const command = await findGio();

	const process = await Subprocess.call({
		command,
		arguments: ["monitor", "-d", CHROME_DIR],
		stderr: "pipe",
	});

	const state = {
		process,
		buffer: "",
		stderr: "",
		exited: false,
	};

	monitor = state;

	readMonitor(state);
	readMonitorErrors(state);

	process.wait().then(({ exitCode }) => {
		if (shuttingDown || monitor !== state) return;

		monitor = null;
		state.exited = true;

		const detail = state.stderr.trim();

		fail(`gio monitor exited with code ${exitCode}` + (detail ? `: ${detail}` : ""));
	});

	console.log(`[userChrome reload] Watching ${CHROME_DIR} with gio`);
}

function shutdown() {
	shuttingDown = true;

	if (reloadTimer) {
		clearTimeout(reloadTimer);
		reloadTimer = null;
	}

	stopMonitor();
}

Services.obs.addObserver(shutdown, "quit-application");

startMonitor().catch((e) => {
	fail(`Could not start gio monitor: ${e.message || e}`);
});
