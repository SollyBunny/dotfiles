import { runShell } from "#shared/shared.mjs";

runShell("sudo timedatectl set-ntp true");
runShell("sudo systemctl enable --now systemd-timesyncd");
