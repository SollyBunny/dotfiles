import { pacmanInstall } from "#shared/shared.mjs";

await pacmanInstall(
    "mpv", "htop", "fastfetch",
    "curl", "wget", "ssh",
    "nodejs", "npm",
    "zip", "unrar", "tar",
    "base-devel", "clang", "llvm", "just", "jemalloc",
    "less", "which", "tree", "jq",
);
