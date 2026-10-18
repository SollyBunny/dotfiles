import { pacmanInstall, serviceEnable } from "#shared/install.mjs";
import { runShellRoot } from "#shared/shell.mjs";

await pacmanInstall("iw", "iwd");
await serviceEnable("iwd");

await runShellRoot("ln -sf /run/systemd/resolve/stub-resolv.conf /etc/resolv.conf");
await serviceEnable("systemd-resolved", "systemd-networkd");
