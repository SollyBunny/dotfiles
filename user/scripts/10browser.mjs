import { getThisDir, moveToBackup } from "#shared/fs.mjs";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

// Rerun this every time you make a new profile

const __dir = getThisDir(import.meta.url);

const dataRoot = path.join(__dir, "../data/librewolf");
const profileRoot = path.join(os.homedir(), ".config/librewolf/librewolf");

for (let profile of await fs.readdir(profileRoot)) {
	profile = path.join(profileRoot, profile);
	const stat = await fs.stat(path.join(profile, "prefs.js"), { throwIfNoEntry: false });
	if (stat) {
		console.log(`Installing for profile ${profile}`);
		for (const file of await fs.readdir(dataRoot)) {
			const target = path.join(dataRoot, file);
			const linkPath = path.join(profile, file);
			const targetRel = path.relative(path.dirname(linkPath), target);
			await moveToBackup(linkPath);
			await fs.symlink(targetRel, linkPath);
		}
	}
}
