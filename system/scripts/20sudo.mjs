import { commandExists, yayInstall } from "#shared/shell.mjs";

if (!await commandExists("sudo"))
	await yayInstall("doas-sudo-shim");
