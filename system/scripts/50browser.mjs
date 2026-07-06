import { commandExists, pacmanInstall, yayInstall } from "#shared/shared.mjs";

if (!await commandExists("librewolf"))
	await yayInstall("librewolf-bin");

if (!await commandExists("torbrowser-launcher"))
	await pacmanInstall("torbrowser-launcher");
