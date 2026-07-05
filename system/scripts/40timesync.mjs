import { runShellRoot } from "#shared/shared.mjs";

await runShellRoot("timedatectl set-ntp true");
await runShellRoot("systemctl enable --now systemd-timesyncd");
