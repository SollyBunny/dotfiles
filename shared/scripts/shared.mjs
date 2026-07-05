import { spawnSync } from "node:child_process";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";

export function getThisDir(importMetaUrl) {
    const __filename = fileURLToPath(importMetaUrl);
    return path.dirname(__filename);
}

const __dir = getThisDir(import.meta.url);

export function moveToBackup(file) {
    const stat = fs.lstatSync(file, { throwIfNoEntry: false });
    if (!stat) return;
    if (stat.isSymbolicLink()) {
        console.log("Removed symbolic link", file);
        fs.unlinkSync(file);
        return;
    }
    console.log("Backing up", file);
    const backupPath = path.join(__dir, "../../backup");
    fs.mkdirSync(backupPath, { recursive: true });
    let fileName = path.resolve(file).replaceAll(path.sep, ".");
    let fileExt;
    const filePath = () => path.join(backupPath, [fileName, fileExt].filter(v => v).join());
    while (fs.existsSync(filePath()))
        fileExt = (fileExt ?? 0) + 1;
    fs.renameSync(file, filePath());
}

/**
 * @param {string} question 
 * @param {string[]} choices
 * @returns {string}
 */
export function ask(question, choices) {
    while (true) {
        console.log(`${question} (${choices.join("/")})`);
        const res = getFromStdin().trim();
        if (choices.includes(res))
            return res;
        console.log(`Invalid choice. Expected one of: ${choices.join(", ")}`);
    }
}

export function runShell(command) {
    return spawnSync("/bin/bash", ["-c", command], {
        stdio: "inherit",
    });
}

export function commandExists(command) {
    return runShell(`command -v "${command}" >/dev/null 2>&1`).status === 0;
}

export function pacmanInstall(...packages) {
    console.log("Installing", ...packages);
    return runShell(`doas pacman -S --noconfirm -- ${packages.join(" ")}`);
}

export function yayInstall(...packages) {
    console.log("Installing with yay", ...packages);
    return runShell(`yay -S -- ${packages.join(" ")}`);
}
