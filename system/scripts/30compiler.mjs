import { pacmanInstall } from "#shared/install.mjs";

await pacmanInstall(
	"base-devel", "clang", "llvm", "jemalloc", "pkgconf",
	"just", "meson", "ninja", "cmake", "mold",
);
