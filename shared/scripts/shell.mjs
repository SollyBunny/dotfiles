import { spawn } from "node:child_process";
import readline from "node:readline/promises";
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

export async function pacmanInstall(...packages) {
	console.log("Installing", ...packages);
	return await runShellRoot(`pacman -S --noconfirm --needed -- ${packages.join(" ")}`);
}

export async function yayInstall(...packages) {
	console.log("Installing with yay", ...packages);
	await rootshell.init();
	return await runShell(`yay -S --needed --sudo sudo -- ${packages.join(" ")}`, rootshell.ipcEnv);
}
