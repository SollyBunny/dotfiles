import { pacmanInstall, runShellRoot, yayInstall } from "#shared/shared.mjs";

await pacmanInstall("cage", "greetd");

await runShellRoot("systemctl enable greetd");

await yayInstall("mangowm-bin", "noctalia-git", "noctalia-greeter-git");
