import { commandExists, pacmanInstall, runShellRoot } from "#shared/shell.mjs";
import fs from "node:fs/promises";

if (await commandExists("doas"))
	console.warn("doas command exists");

if (!commandExists("sudo-rs"))
	await pacmanInstall("sudo-rs");

// https://wiki.archlinux.org/title/Sudo#Using_sudo-rs_without_the_sudo_package
for (const executable of ["sudo", "su", "visudo", "sudoedit"]) {
	const sudorsPath = `/usr/bin/${executable}-rs`;
	const sudoPath = `/usr/local/bin/${executable}`;
	if (await fs.stat(sudoPath, { throwIfNoEntry: false }) === undefined)
		await runShellRoot(`ln -s ${sudorsPath} ${sudoPath}`);
}
