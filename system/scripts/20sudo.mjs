import { commandExists, yayInstall } from "#shared/shared.mjs";

if (!commandExists("sudo"))
    yayInstall("doas-sudo-shim");
