import { pacmanInstall } from "#shared/shared.mjs";

await pacmanInstall(
    "mpv", "htop", "fastfetch", "micro",
    "curl", "wget", "openssh",
    "nodejs", "npm",
    "zip", "unrar", "tar",
    "base-devel", "clang", "llvm", "jemalloc", "pkgconf",
    "just", "meson", "ninja",
    "less", "which", "tree", "jq",
    "git-credential-oauth",
);
