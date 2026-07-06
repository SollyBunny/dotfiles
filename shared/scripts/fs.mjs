import { fileURLToPath } from "node:url";
import path from "node:path";
import fs from "node:fs/promises";
import { runShellRoot } from "./shell.mjs";

export function getThisDir(importMetaUrl) {
	const __filename = fileURLToPath(importMetaUrl);
	return path.dirname(__filename);
}

const __dir = getThisDir(import.meta.url);

/**
 * @param {Parameters<fs.lstat>} args
 * @returns {Promise<undefined | PromiseSettledResult<ReturnType<fs.lstat>>>}
 */
export async function lstatSafe(...args) {
	try {
		return await fs.lstat(...args);
	} catch (e) {
		if (e.code === "ENOENT")
			return undefined;
		throw e;
	}
}

/**
 * @param file {Parameters<fs.stat>[0]}
 * @return {Promise<boolean>}
 */
export async function exists(file) {
	try {
		await fs.stat(file);
		return true;
	} catch (e) {
		if (e.code === "ENOENT")
			return false;
		throw e;
	}
}

export async function filesEqual(a, b) {
	const aContents = await fs.readFile(a);
	const bContents = await fs.readFile(b);
	return aContents.equals(bContents);
}

export async function moveToBackup(file) {
	const stat = await lstatSafe(file, { throwIfNoEntry: false });
	if (!stat) return;
	if (stat.isSymbolicLink()) {
		console.log("Removed symbolic link", file);
		try {
			await fs.unlink(file);
		} catch (e) {
			if (e.code === "EACCES")
				await runShellRoot(`unlink -- ${file}`);
			else
				throw e;
		}
		return;
	}
	console.log("Backing up", file);
	const backupPath = path.join(__dir, "../../backup");
	await fs.mkdir(backupPath, { recursive: true });
	let fileName = path.resolve(file).replaceAll(path.sep, ".");
	let fileExt;
	const filePath = () => path.join(backupPath, [fileName, fileExt].filter(v => v).join("."));
	while (await fs.stat(filePath(), { throwIfNoEntry: false }))
		fileExt = (fileExt ?? 0) + 1;
	await fs.cp(file, filePath(), {
		dereference: true,
		errorOnExist: true,
		recursive: true,
		mode: fs.constants.COPYFILE_FICLONE_FORCE,
	});
	try {
		await fs.rm(file, {
			force: true,
			recursive: true,
		});
	} catch (e) {
		if (e.code === "EACCES")
			await runShellRoot(`rm -rf -- ${file}`);
		else
			throw e;
	}
}
