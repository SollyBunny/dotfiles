import { pacmanInstall, yayInstall } from "#shared/install.mjs";

await pacmanInstall("kitty", "pavucontrol", "zed", "qbittorrent", "zed", "gimp");
await pacmanInstall("mpv", "mpv-mpris", "yt-dlp");
await pacmanInstall("libreoffice-fresh");

await yayInstall("rustdesk-bin");
