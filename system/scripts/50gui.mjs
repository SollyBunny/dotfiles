import { askConfirm, runShellRoot } from "#shared/shell.mjs";
import { pacmanInstall, yayInstall } from "#shared/install.mjs";

await pacmanInstall("xorg-xwayland", "xorg-xeyes");
await pacmanInstall("wlr-randr", "wl-clipboard", "wtype", "wev");

await pacmanInstall("cage", "ddcutil");

await pacmanInstall("greetd");
await runShellRoot("systemctl enable greetd");

await pacmanInstall("kitty", "pavucontrol", "zed", "gimp");
await pacmanInstall("libreoffice-fresh");

if (await askConfirm("Install mangowm, noctalia and noctalia-greeter (requires compile)?"))
	await yayInstall("mangowm", "noctalia-git", "noctalia-greeter-git");

// Required by noctalia templates
await pacmanInstall("adw-gtk-theme", "nwg-look");
await yayInstall("python-pywalfox");

// Required by noctalia greeter
await pacmanInstall("accountsservice");
await runShellRoot("systemctl enable --now accounts-daemon");
