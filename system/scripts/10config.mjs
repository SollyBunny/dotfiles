import { runShell, getThisDir, moveToBackup, runShellRoot, filesEqual, lstatSafe } from "#shared/shared.mjs";
import fs from "node:fs/promises";
import path from "node:path";

// Run after modifying ../conf/

const __dir = getThisDir(import.meta.url);

const configRoot = path.join(__dir, "../config");

const files = (await fs.readdir(configRoot, {
    recursive: true, withFileTypes: true
}))
    .filter(v => v.isFile())
    .filter(v => v.name !== "doas.conf")
    .map(v => path.join(v.parentPath, v.name));

for (const file of files) {
    const fileInstall = path.join(path.sep, path.relative(configRoot, file));
    const fileInstallStat = await lstatSafe(fileInstall);
    if (fileInstallStat && fileInstallStat.isFile() && await filesEqual(file, fileInstall)) {
        if (fileInstallStat.gid !== 0 || fileInstallStat.uid !== 0)
            await runShellRoot(`chown root:root ${fileInstall}`)
        if (fileInstallStat.mode !== 0o644)
            await runShellRoot(`chmod 644 ${fileInstall}`)
        continue;
    }
    await moveToBackup(fileInstall);
    await runShellRoot(`install -D -p -v --mode=644 --group=root --owner=root ${file} ${fileInstall}`)
}
