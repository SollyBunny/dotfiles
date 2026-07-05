import { commandExists, pacmanInstall, runShell } from "#shared/shared.mjs";
import { rmSync } from "node:fs";

if (!commandExists("yay")) {
    pacmanInstall("git", "fakeroot", "debugedit");
    runShell("cd /tmp/ && git clone --depth 1 https://aur.archlinux.org/yay-bin.git");
    runShell("cd /tmp/yay-bin/ && makepkg");
    runShell("doas pacman -U --noconfirm -- /tmp/yay-bin/yay-bin-*-x86_64.pkg.tar.zst");
    rmSync("/tmp/yay-bin/", { recursive: true, force: true });
}
