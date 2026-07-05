import { getThisDir, moveToBackup, runShell } from "#shared/shared.mjs";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

// Rerun this every time you make a new profile

const __dir = getThisDir(import.meta.url);

const configRoot = path.join(__dir, "librewolf");
const profileRoot = path.join(os.homedir(), ".config/librewolf/librewolf");

const profiles = (await fs.readFile(path.join(profileRoot, "profiles.ini"), "utf-8"))
    .split("\n")
    .filter(v => v.startsWith("Path="))
    .map(v => v.slice(v.indexOf("=") + 1))
    .map(v => path.join(profileRoot, v));

for (const profile of profiles) {
    console.log(`Installing for profile ${profile}`);
    for (const file of await fs.readdir(configRoot)) {
        const target = path.join(configRoot, file);
        const linkPath = path.join(profile, file);
        const targetRel = path.relative(path.dirname(linkPath), target);
        await moveToBackup(linkPath);
        await fs.symlink(targetRel, linkPath);
    }
}
