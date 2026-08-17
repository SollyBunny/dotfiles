import { filesEqual, getThisDir, lstatSafe, moveToBackup } from "#shared/fs.mjs";
import { runShellRoot } from "#shared/shell.mjs";
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
	const mode = RESTRICTED_FILES.indexOf(path.parse(file).base) === -1 ? 0o644 : 0o440;
	const fileInstall = path.join(path.sep, path.relative(configRoot, file));
	const fileInstallStat = await lstatSafe(fileInstall);
	if (fileInstallStat && fileInstallStat.isFile() && await filesEqual(file, fileInstall)) {
		if (fileInstallStat.gid !== 0 || fileInstallStat.uid !== 0)
			await runShellRoot(`chown -- root:root "$fileInstall"`, { fileInstall });
		if ((fileInstallStat.mode & 0o777) !== mode)
			await runShellRoot(`chmod -- ${mode.toString(8)} "$fileInstall"`, { fileInstall });
		continue;
	}
	await moveToBackup(fileInstall);
	await runShellRoot(`install -D -p -v --mode=${mode.toString(8)} --group=root --owner=root -- "$file" "$fileInstall"`, { file, fileInstall })
}
