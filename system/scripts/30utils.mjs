import { pacmanInstall } from "#shared/shell.mjs";

await pacmanInstall(
	"lynx", "mpv", "micro", "nano", "fastfetch", "numbat",
	"imagemagick", "ffmpeg",
	"htop", "cpupower",
	"curl", "wget", "openssh", "git-credential-oauth",
	"nodejs", "npm",
	"zip", "unzip", "unrar", "tar",
	"base-devel", "clang", "llvm", "jemalloc", "pkgconf",
	"just", "meson", "ninja", "cmake",
	"less", "which", "tree", "jq", "patch",
	"bash-completion", "man-db",
);
