import { pacmanInstall } from "#shared/shared.mjs";

await pacmanInstall(
	"wireplumber",
	"pipewire", "pipewire-pulse", "pipewire-jack",
	"lib32-pipewire", "lib32-pipewire-jack"
);