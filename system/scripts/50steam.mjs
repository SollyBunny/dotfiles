import { pacmanInstall, yayInstall } from "#shared/shell.mjs";

await pacmanInstall("steam");
await yayInstall("millennium-bin");
