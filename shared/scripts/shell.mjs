import { spawn } from "node:child_process";
import readline from "node:readline/promises";
import fs from "node:fs/promises";
import RootShell from "./rootshell/rootshell.mjs";

export const rootshell = new RootShell();

/**
 * @param {string} question
 * @param {string[]} choices
 * @returns {Promise<string>}
 */
export async function askChoice(question, choices) {
	const rl = readline.createInterface({
		input: process.stdin,
		output: process.stdout,
	});
	while (true) {
		const res = (await rl.question(`${question} (${choices.join("/")}): `)).trim();
		if (choices.includes(res)) {
			rl.close(); // Fix terminal state
			return res;
		}
		console.log(`Invalid choice. Expected one of: ${choices.join(", ")}`);
	}
}

export async function askConfirm(question) {
	return await askChoice(question, ["y", "n"]) === "y";
}

export function runShell(command, env = undefined) {
	return new Promise((resolve, reject) => {
		const child = spawn("/bin/bash", ["-c", command], {
			stdio: "inherit", env
		});
		child.on("error", reject);
		child.on("close", (code, signal) => resolve({ code, signal }));
	});
}

export async function runShellRoot(command) {
	return await rootshell.run(command);
}

export async function commandExists(command) {
	return (await runShell(`command -v "${command}" >/dev/null 2>&1`)).code === 0;
}

let _pacmanInstalledPkgs;
async function getPacmanInstalledPkgs() {
	if (_pacmanInstalledPkgs === undefined) {
		_pacmanInstalledPkgs = new Set();
		const filename = `/run/user/${process.getuid()}/pkglist`;
		try {
			await runShell(`pacman -Qeq > ${filename}`);
			(await fs.readFile(filename, "utf-8"))
				.split("\n")
				.filter(v => v)
				.forEach(v => _pacmanInstalledPkgs.add(v));
		} finally {
			await fs.rm(filename);
		}
	}
	return _pacmanInstalledPkgs;
}

export async function pacmanInstall(...packages) {
	const pacmanInstalledPkgs = await getPacmanInstalledPkgs();
	packages = packages.filter(v => !pacmanInstalledPkgs.has(v))
	if (!packages.length)
		return;
	console.log("Installing", ...packages);
	await runShellRoot(`pacman -S --noconfirm --needed --asexplicit -- ${packages.join(" ")}`);
	await runShellRoot(`pacman -D --asexplicit -- ${packages.join(" ")}`);
}

export async function yayInstall(...packages) {
	console.log("Installing with yay", ...packages);
	await rootshell.init();
	await runShell(`yay -S --needed --asexplicit --sudo sudo -- ${packages.join(" ")}`, rootshell.ipcEnv);
	await runShellRoot(`pacman -D --asexplicit -- ${packages.join(" ")}`);
}
