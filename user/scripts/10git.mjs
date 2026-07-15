import { runShell } from "#shared/shell.mjs";

const timeoutHours = 6;

await runShell("git config --global --unset-all credential.helper");
await runShell(`git config --global --add credential.helper "cache --timeout ${timeoutHours * 60 * 60}"`);
await runShell("git config --global --add credential.helper oauth");
