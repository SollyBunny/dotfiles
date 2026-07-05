import { commandExists, getThisDir, pacmanInstall, runShell } from "#shared/shared.mjs";
import path from "node:path";

if (!commandExists("doas")) {
    const __dir = getThisDir(import.meta.url);
    const installConfigCmd = `install -D -C -p -v --backup=simple --mode=644 --group=root --owner=root ${path.join(__dir, "config/etc/doas.conf")} /etc/doas.conf`
    runShell(`echo -n "Root " && su -c "${installConfigCmd} && pacman -Sy opendoas"`);
}
