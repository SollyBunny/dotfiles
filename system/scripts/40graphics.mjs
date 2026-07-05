import { ask, pacmanInstall, runShell } from "#shared/shared.mjs";

const graphics = ask("What graphics backend to use?", ["intel", "nvidia", "amd"]);

// https://wiki.archlinux.org/title/Hardware_video_acceleration

pacmanInstall("mesa", "lib32-mesa");

let LIBVA_DRIVER_NAME, VDPAU_DRIVER;

if (graphics === "intel") {
    pacmanInstall(
        "vulkan-intel", "lib32-vulkan-intel",
        "libva-intel-driver", "libvdpau-va-gl",
    );
    LIBVA_DRIVER_NAME = "i965";
    VDPAU_DRIVER = "va_gl";
} else if (graphics === "nvidia") {
    pacmanInstall(
        "nvidia-utils", "lib32-nvidia-utils"
    );
    LIBVA_DRIVER_NAME = "nvidia";
    VDPAU_DRIVER = "nvidia";
} else if (graphics === "amd") {
    pacmanInstall(
        "vulkan-radeon", "lib32-vulkan-radeon",
    );
    LIBVA_DRIVER_NAME = "amdgpu";
    VDPAU_DRIVER = "va_gl";
}

pacmanInstall("vulkan-tools", "vdpauinfo", "libva-utils");

