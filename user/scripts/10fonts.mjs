import { runShell } from "#shared/shell.mjs";

const font = "JetBrainsMono Nerd Font 11";

await runShell(`gsettings set org.gnome.desktop.interface font-name "$font"`, { font });
await runShell(`gsettings set org.gnome.desktop.interface monospace-font-name "$font"`, { font });
await runShell(`gsettings set org.gnome.desktop.interface document-font-name "$font"`, { font });
