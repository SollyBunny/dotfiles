import { pacmanInstall, yayInstall } from "#shared/install.mjs";
import { runShellRoot } from "#shared/shell.mjs";

await pacmanInstall("kitty", "pavucontrol", "zed", "qbittorrent", "gimp");
await pacmanInstall("mpv", "mpv-mpris");
await pacmanInstall("libreoffice-fresh");
await pacmanInstall("keepassxc");

await yayInstall("rustdesk-bin");
await runShellRoot("systemctl enable --now rustdesk")
