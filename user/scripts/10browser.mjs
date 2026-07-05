import { getThisDir, runShell } from "#shared/shared.mjs";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

// Rerun this every time you make a new profile

const __dir = getThisDir(import.meta.url);

const configRoot = path.join(__dir, "librewolf");
const profileRoot = path.join(os.homedir(), ".config/librewolf/librewolf");

const profiles = fs.readFileSync(path.join(profileRoot, "profiles.ini"), "utf-8")
    .split("\n")
    .filter(v => v.startsWith("Path="))
    .map(v => v.slice(v.indexOf("=") + 1))
    .map(v => path.join(profileRoot, v));

for (const profile of profiles) {
    console.log(`Installing for profile ${profile}`);
    fs.rmSync(path.join(profile, "chrome"));
    fs.rmSync(path.join(profile, "user.js"));
    fs.symlinkSync(path.join(configRoot, "chrome"), path.join(profile, "chrome"));
    fs.symlinkSync(path.join(configRoot, "user.js"), path.join(profile, "user.js"));
}
