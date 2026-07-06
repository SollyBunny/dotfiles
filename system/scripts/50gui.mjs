import { pacmanInstall, runShellRoot, yayInstall } from "#shared/shell.mjs";

await pacmanInstall("xorg-xwayland", "cage");

await pacmanInstall("greetd");
await runShellRoot("systemctl enable greetd");

await pacmanInstall("kitty", "pavucontrol", "zed");

await yayInstall("mangowm", "noctalia-git", "noctalia-greeter-git");
