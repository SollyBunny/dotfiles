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
