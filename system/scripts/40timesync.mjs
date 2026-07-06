import { runShellRoot } from "#shared/shell.mjs";

await runShellRoot("timedatectl set-ntp true");
await runShellRoot("systemctl enable --now systemd-timesyncd");
