import { pacmanInstall } from "#shared/shared.mjs";

pacmanInstall(
    "mpv",
    "zip", "unrar", "tar",
    "base-devel", "clang", "llvm", "just", "jemalloc",
    "less", "which", "tree", "htop", "jq",
);
