import { runShell } from "#shared/shell.mjs";

const timeoutHours = 6;

runShell("git config --global --unset-all credential.helper");
runShell(`git config --global --add credential.helper "cache --timeout ${timeoutHours * 60 * 60}"`);
runShell("git config --global --add credential.helper oauth");
