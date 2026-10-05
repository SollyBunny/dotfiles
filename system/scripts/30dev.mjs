import { pacmanInstall } from "#shared/install.mjs";

// C/CPP
await pacmanInstall(
	"base-devel", "clang", "llvm", "jemalloc", "pkgconf",
	"just", "meson", "ninja", "cmake", "mold",
);

// Everything else
await pacmanInstall(
	"nodejs", "npm",
	"jdk-openjdk",
);
