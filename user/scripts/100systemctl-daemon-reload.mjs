import { runShell } from "#shared/shell.mjs";

await runShell("systemctl --user daemon-reload");
