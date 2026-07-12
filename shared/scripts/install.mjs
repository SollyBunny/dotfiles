import fs from "node:fs/promises";
import { rootshell, runShell, runShellRoot } from "./shell.mjs";

export async function commandExists(command) {
	try  {
		await runShell(`command -v "${command}" >/dev/null 2>&1`);
		return true;
	} catch (e) {
		if (e.code === 1)
			return false;
		throw e;
	}
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

let _pacmanUpdateRepoDone = false;
async function pacmanUpdateRepo() {
	if (_pacmanUpdateRepoDone)
		return;
	await runShellRoot("pacman -Sy");
	_pacmanUpdateRepoDone = true;
}

export async function pacmanInstall(...packages) {
	const pacmanInstalledPkgs = await getPacmanInstalledPkgs();
	packages = packages.filter(v => !pacmanInstalledPkgs.has(v))
	if (!packages.length)
		return;
	console.log("Installing", ...packages);
	await pacmanUpdateRepo();
	await runShellRoot(`pacman -S --noconfirm --needed --asexplicit -- ${packages.join(" ")}`);
	await runShellRoot(`pacman -D --asexplicit -- ${packages.join(" ")}`);
}

export async function yayInstall(...packages) {
	console.log("Installing with yay", ...packages);
	await pacmanUpdateRepo();
	await rootshell.init();
	await runShell(`yay -S --needed --asexplicit --sudo sudo -- ${packages.join(" ")}`, rootshell.ipcEnv);
	await runShellRoot(`pacman -D --asexplicit -- ${packages.join(" ")}`);
}
