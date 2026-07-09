import { pacmanInstall, runShellRoot, yayInstall } from "#shared/shell.mjs";

await pacmanInstall("xorg-xwayland", "xorg-xeyes");

await pacmanInstall("cage", "ddcutil");

await pacmanInstall("greetd");
await runShellRoot("systemctl enable greetd");

await pacmanInstall("kitty", "pavucontrol", "zed");

await yayInstall("mangowm", "noctalia-git", "noctalia-greeter-git");

// Required by noctalia templates
await pacmanInstall("adw-gtk-theme", "nwg-look");
await yayInstall("python-pywalfox");
