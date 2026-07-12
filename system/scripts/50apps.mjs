import { pacmanInstall, yayInstall } from "#shared/install.mjs";

await pacmanInstall("kitty", "pavucontrol", "zed", "qbittorrent");

await yayInstall("rustdesk-bin");
