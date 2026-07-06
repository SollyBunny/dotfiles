import { pacmanInstall, runShellRoot, yayInstall } from "#shared/shell.mjs";

await pacmanInstall("kitty", "pavucontrol", "zed");

await pacmanInstall("cage", "greetd");

await runShellRoot("systemctl enable greetd");

await yayInstall("mangowm", "noctalia-git", "noctalia-greeter-git");
