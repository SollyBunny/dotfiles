import { pacmanInstall, runShellRoot } from "#shared/shared.mjs";

await pacmanInstall("iw", "iwd");
await runShellRoot("systemctl enable --now iwd");

await runShellRoot("ln -sf /run/systemd/resolve/stub-resolv.conf /etc/resolv.conf");
await runShellRoot("systemctl enable --now systemd-resolved");
await runShellRoot("systemctl enable --now systemd-networkd");
