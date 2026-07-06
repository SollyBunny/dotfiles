import { commandExists, pacmanInstall, runShell, runShellRoot } from "#shared/shared.mjs";
import fs from "node:fs/promises";

if (!await commandExists("yay")) {
	await pacmanInstall("git", "fakeroot", "debugedit");
	await fs.rm("/tmp/yay-bin/", { recursive: true, force: true });
	await runShell("cd /tmp/ && git clone --depth 1 https://aur.archlinux.org/yay-bin.git");
	await runShell("cd /tmp/yay-bin/ && makepkg");
	await runShellRoot("pacman -U --noconfirm -- /tmp/yay-bin/yay-bin-*-x86_64.pkg.tar.zst");
	await fs.rm("/tmp/yay-bin/", { recursive: true, force: true });
}
