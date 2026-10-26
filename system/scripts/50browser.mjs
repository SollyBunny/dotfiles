import { getTempPath, safeWrite } from "#shared/fs.mjs";
import { pacmanInstall } from "#shared/install.mjs";
import { runShell } from "#shared/shell.mjs";
import fs from "node:fs/promises";

await pacmanInstall("librewolf");
await pacmanInstall("torbrowser-launcher");

// Run config merge
const policiesTempPath = getTempPath(".json");
await runShell("/etc/librewolf/policies/merge.sh", {
	DST: policiesTempPath,
});
await safeWrite(
	"/etc/librewolf/policies/policies.json",
	await fs.readFile(policiesTempPath, "utf-8"),
);
