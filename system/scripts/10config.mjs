import { getBackupPath, getThisDir, lstatSafe } from "#shared/fs.mjs";
import { runShellRoot } from "#shared/shell.mjs";
import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";

// Run after modifying ../conf/

// These files install with 440 instead of 644
const RESTRICTED_FILES = ["sudoers-rs"];

const __dir = getThisDir(import.meta.url);

const configRoot = path.join(__dir, "../config");

const files = (await fs.readdir(configRoot, {
	recursive: true, withFileTypes: true
}))
	.filter(v => v.isFile())
	.filter(v => v.name !== "doas.conf")
	.map(v => path.join(v.parentPath, v.name));

for (const file of files) {
	let mode = RESTRICTED_FILES.indexOf(path.parse(file).base) === -1 ? 0o644 : 0o440;
	if (((await lstatSafe(file))?.mode & 0o111) !== 0) // If source file executable
		mode |= 0o111 // Make destination executable

	const fileDestination = path.join(path.sep, path.relative(configRoot, file));
	const backupSuffix = `.${crypto.randomBytes(8).toString("hex")}.bak`;
	await runShellRoot(
		`install -C -D -p -v --backup --suffix="${backupSuffix}" --mode=${mode.toString(8)} --group=root --owner=root -- "$file" "$fileDestination"`,
		{ file, fileDestination }
	);
	const installBackup = `${fileDestination}${backupSuffix}`;
	if (await lstatSafe(installBackup)) {
		const backupPath = await getBackupPath(fileDestination);
		await runShellRoot(
			`mv -- "$installBackup" "$backupPath" && chown ${process.getuid()}:${process.getgid()} -- "$backupPath"`,
			{ installBackup, backupPath }
		);
	}
}
