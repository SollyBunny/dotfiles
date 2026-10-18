import { serviceEnable } from "#shared/install.mjs";
import { runShellRoot } from "#shared/shell.mjs";

await runShellRoot("timedatectl set-ntp true");
await serviceEnable("systemd-timesyncd");
