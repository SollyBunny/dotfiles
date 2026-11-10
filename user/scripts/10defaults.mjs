import { runShell } from "#shared/shell.mjs"

await runShell(`xdg-settings set default-web-browser librewolf.desktop`);
await runShell(`gsettings set org.gnome.desktop.default-applications.terminal exec "$HOME/.local/bin/term"`);
