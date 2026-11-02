import os from "node:os";
import path from "node:path";
import { gitUpdate } from "#shared/install.mjs";
import { runShell } from "#shared/shell.mjs";

const termUtilsPath = path.join(os.homedir(), "Code/term-utils");

await gitUpdate("https://github.com/sollybunny/term-utils", termUtilsPath);

await runShell(`cd -- "$termUtilsPath" && make`, { termUtilsPath });
