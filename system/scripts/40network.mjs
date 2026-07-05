import { pacmanInstall, runShell } from "#shared/shared.mjs";

pacmanInstall("iw", "iwd");
runShell("sudo systemctl enable --now iw");

runShell("sudo ln -sf /run/systemd/resolve/stub-resolv.conf /etc/resolv.conf");
runShell("sudo systemctl enable --now systemd-resolved");
runShell("sudo systemctl enable --now systemd-networkd");
