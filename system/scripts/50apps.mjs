import { pacmanInstall, yayInstall } from "#shared/shell.mjs";

await pacmanInstall("kitty", "pavucontrol", "zed", "qbittorrent");

await yayInstall("rustdesk-bin");
