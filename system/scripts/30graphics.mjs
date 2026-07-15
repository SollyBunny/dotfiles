import { askChoice, runShellRoot } from "#shared/shell.mjs";
import { pacmanInstall } from "#shared/install.mjs";

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

const rcFile =
`export LIBVA_DRIVER_NAME=${LIBVA_DRIVER_NAME}
export VDPAU_DRIVER=${VDPAU_DRIVER}`;

await runShellRoot(`echo "${rcFile}" | tee /etc/profile.d/graphicsenv.sh`);
