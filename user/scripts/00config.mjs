import { getThisDir, moveToBackup } from "#shared/fs.mjs";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

const __dir = getThisDir(import.meta.url);

const configRoot = path.join(__dir, "../config");

/**
 * Returns a list of absolute paths in ../config
 * These paths are to be linked from ../config/* to ~/*
 * Paths included are
 * 1. .local/bin
 * 2. Files in ../config/
 * 3. Folders in ../config/* containing a file named __link
 * 4. Files in ../config/* starting with __link.
 */
async function getPathsToLink() {
	const out = [];

	out.push(path.join(configRoot, ".local/bin"));

	const dirents = await fs.readdir(configRoot, {
		recursive: true,
		withFileTypes: true,
	});
	for (const dirent of dirents) {
		if (dirent.parentPath === configRoot && dirent.isFile())
			out.push(path.join(dirent.parentPath, dirent.name));
		else if (dirent.name === "__link")
			out.push(dirent.parentPath);
		else if (dirent.name.startsWith("__link."))
			out.push(path.join(dirent.parentPath, dirent.name));
	}

	return out;
}

const pathsToLink = await getPathsToLink();

for (const target of pathsToLink) {
	let linkPath = path.join(os.homedir(), path.relative(configRoot, target));
	const targetRel = path.relative(path.dirname(linkPath), target);
	{
		// Remove __link. prefix after figuring out the targetRel
		const linkPathParsed = path.parse(linkPath);
		if (linkPathParsed.name.startsWith("__link."))
			linkPath = path.join(linkPathParsed.dir, linkPathParsed.name.slice("__link.".length) + linkPathParsed.ext);
	}
	await moveToBackup(linkPath);
	await fs.mkdir(path.dirname(linkPath), { recursive: true });
	await fs.symlink(targetRel, linkPath);
}
