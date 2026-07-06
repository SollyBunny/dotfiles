import { pacmanInstall } from "#shared/shell.mjs";

await pacmanInstall(
	"wireplumber",
	"pipewire", "pipewire-pulse", "pipewire-jack",
	"lib32-pipewire", "lib32-pipewire-jack"
);
