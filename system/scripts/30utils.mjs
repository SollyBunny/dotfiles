import { pacmanInstall } from "#shared/install.mjs";

await pacmanInstall(
	"lynx", "mpv", "micro", "nano", "fastfetch", "numbat",
	"imagemagick", "ffmpeg", "exiftool",
	"usbutils", "usb_modeswitch", "smartmontools", "nvme-cli",
	"htop", "cpupower",
	"curl", "wget", "openssh", "git-credential-oauth",
	"nodejs", "npm", "jdk-openjdk",
	"zip", "unzip", "unrar", "tar",
	"base-devel", "clang", "llvm", "jemalloc", "pkgconf",
	"just", "meson", "ninja", "cmake",
	"less", "which", "tree", "jq", "patch",
	"bash-completion", "man-db",
);
