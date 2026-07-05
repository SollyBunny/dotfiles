import { spawn, spawnSync } from "node:child_process";
import path from "node:path";
import fs from "node:fs/promises";
import { fileURLToPath } from "node:url";
import readline from "node:readline/promises";
import RootShell from "./rootshell/rootshell.mjs";

export function getThisDir(importMetaUrl) {
    const __filename = fileURLToPath(importMetaUrl);
    return path.dirname(__filename);
}

const __dir = getThisDir(import.meta.url);

export async function moveToBackup(file) {
    const stat = await fs.lstat(file, { throwIfNoEntry: false });
    if (!stat) return;
    if (stat.isSymbolicLink()) {
        console.log("Removed symbolic link", file);
        await fs.unlink(file);
        return;
    }
    console.log("Backing up", file);
    const backupPath = path.join(__dir, "../../backup");
    await fs.mkdir(backupPath, { recursive: true });
    let fileName = path.resolve(file).replaceAll(path.sep, ".");
    let fileExt;
    const filePath = () => path.join(backupPath, [fileName, fileExt].filter(v => v).join());
    while (await fs.exists(filePath()))
        fileExt = (fileExt ?? 0) + 1;
    await fs.cp(file, filePath(), {
        dereference: true,
        errorOnExist: true,
        mode: fs.constants.COPYFILE_FICLONE_FORCE,
    });
}

export async function filesEqual(a, b) {
    const aContents = await fs.readFile(a);
    const bContents = await fs.readFile(b);
    return aContents.equals(bContents);
}

/**
 * @param {string} question 
 * @param {string[]} choices
 * @returns {Promise<string>}
 */
export async function ask(question, choices) {
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

export function runShell(command) {
    return new Promise((resolve, reject) => {
        const child = spawn("/bin/bash", ["-c", command], {
            stdio: "inherit"
        });
        child.on("error", reject);
        child.on("close", (code, signal) => resolve({ code, signal }));
    });
}

const rootshell = new RootShell();
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
    return await runShell(`yay -S --needed -- ${packages.join(" ")}`);
}
