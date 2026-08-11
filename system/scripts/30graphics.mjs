import { askChoice, runShellRoot } from "#shared/shell.mjs";
import { pacmanInstall } from "#shared/install.mjs";
import { exists } from "#shared/fs.mjs";
import fs from "node:fs/promises";

const graphics = await askChoice("What graphics backend to use?", ["intel", "nvidia", "amd"]);

// https://wiki.archlinux.org/title/Hardware_video_acceleration

await pacmanInstall("mesa", "lib32-mesa");

let LIBVA_DRIVER_NAME, VDPAU_DRIVER;

if (graphics === "intel") {
	await pacmanInstall(
		"vulkan-intel", "lib32-vulkan-intel",
		"libva-intel-driver", "libvdpau-va-gl",
	);
	LIBVA_DRIVER_NAME = "i965";
	VDPAU_DRIVER = "va_gl";
} else if (graphics === "nvidia") {
	await pacmanInstall(
		"nvidia-utils", "lib32-nvidia-utils"
	);
	LIBVA_DRIVER_NAME = "nvidia";
	VDPAU_DRIVER = "nvidia";
} else if (graphics === "amd") {
	await pacmanInstall(
		"vulkan-radeon", "lib32-vulkan-radeon",
	);
	LIBVA_DRIVER_NAME = "radeonsi";
	VDPAU_DRIVER = "va_gl";
}

await pacmanInstall("vulkan-tools", "vdpauinfo", "libva-utils", "mesa-utils");

const rcFilePath = "/etc/profile.d/graphicsenv.sh";
const rcFileContents = "" +
	`export LIBVA_DRIVER_NAME=${LIBVA_DRIVER_NAME}\n` +
	`export VDPAU_DRIVER=${VDPAU_DRIVER}\n`;

if (!await exists(rcFilePath) || await fs.readFile(rcFilePath, "utf-8") !== rcFileContents)
	await runShellRoot(`echo "${rcFileContents}" | tee /etc/profile.d/graphicsenv.sh`);
