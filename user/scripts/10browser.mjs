import { exists, getThisDir, moveToBackup } from "#shared/fs.mjs";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

// Rerun this every time you make a new profile

const __dir = getThisDir(import.meta.url);
const TOR_PATH = ".local/share/torbrowser/tbb/x86_64/tor-browser";

// Install userChrome to profiles

const candidateProfiles = [];
{
	const profileDir = path.join(os.homedir(), ".config/librewolf/librewolf");
	if (await exists(profileDir)) {
		for (const profile of await fs.readdir(profileDir))
			candidateProfiles.push(path.join(profileDir, profile));
	}
}
{
	const profileDir = path.join(os.homedir(), TOR_PATH, "Browser/TorBrowser/Data/Browser");
	if (await exists(profileDir)) {
		for (const profile of await fs.readdir(profileDir))
			candidateProfiles.push(path.join(profileDir, profile));
	}
}

const dataRoot = path.join(__dir, "../data/librewolf");
for (const profile of candidateProfiles) {
	const stat = await fs.stat(path.join(profile, "prefs.js"), { throwIfNoEntry: false });
	if (!stat) continue;
	console.log(`Installing for profile ${profile}`);
	for (const file of await fs.readdir(dataRoot)) {
		const target = path.join(dataRoot, file);
		const linkPath = path.join(profile, file);
		const targetRel = path.relative(path.dirname(linkPath), target);
		await moveToBackup(linkPath);
		await fs.symlink(targetRel, linkPath);
	}
}

// Install tor stuff

{
	const link = path.join(os.homedir(), TOR_PATH, "/distribution/policies.json");

	if (await exists(path.dirname(link))) {
		const target = path.resolve(__dir, "../data/tor/policies.json");
		const relativeTarget = path.relative(path.dirname(link), target);

		await moveToBackup(link);
		await fs.symlink(relativeTarget, link);
	}
}

{
	const link = path.join(os.homedir(), TOR_PATH, "/.cache/wal");

	if (await exists(path.dirname(link))) {
		const target = path.resolve(__dir, "../data/tor/wal");
		const relativeTarget = path.relative(path.dirname(link), target);

		await moveToBackup(link);
		await fs.symlink(relativeTarget, link);
	}
}
