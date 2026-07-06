import { pacmanInstall } from "#shared/shell.mjs";

await pacmanInstall(
	"mpv", "htop", "fastfetch", "micro", "numbat",
	"curl", "wget", "openssh",
	"nodejs", "npm",
	"zip", "unzip", "unrar", "tar",
	"base-devel", "clang", "llvm", "jemalloc", "pkgconf",
	"just", "meson", "ninja",
	"less", "which", "tree", "jq",
	"git-credential-oauth",
);
