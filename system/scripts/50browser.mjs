import { commandExists, yayInstall } from "#shared/shared.mjs";

if (!await commandExists("librewolf"))
    await yayInstall("librewolf-bin");
