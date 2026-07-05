import { commandExists, getThisDir, pacmanInstall, runShellRoot } from "#shared/shared.mjs";
import path from "node:path";

// Run after modifying ../conf/doas.conf

const __dir = getThisDir(import.meta.url);

await runShellRoot(`install -D -C -p -v --backup=off --mode=644 --group=root --owner=root ${path.join(__dir, "../config/etc/doas.conf")} /etc/doas.conf`);
if (!await commandExists("doas"))
    await pacmanInstall("doas");
