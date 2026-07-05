import { commandExists, yayInstall } from "#shared/shared.mjs";

if (!commandExists("librewolf"))
    yayInstall("librewolf-bin");
