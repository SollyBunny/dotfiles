import { commandExists, yayInstall } from "#shared/shared.mjs";

if (!await commandExists("sudo"))
	await yayInstall("doas-sudo-shim");
