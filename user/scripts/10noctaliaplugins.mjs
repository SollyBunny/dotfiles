import { exists, runShell } from "#shared/shared.mjs";
import os from "node:os";
import path from "node:path";
import fs from "node:fs/promises";

const LOCAL_PLUGINS_URL = "https://github.com/sollybunny/noctalia-plugins";

const localPluginsPath = path.join(os.homedir(), ".config/noctalia/local-plugins");

if (await exists(path.join(localPluginsPath, ".git"))) {
	await runShell(`cd ${localPluginsPath} && git pull`);
} else {
	await fs.mkdir(localPluginsPath, { recursive: true });
	await runShell(`git clone --depth 1 ${LOCAL_PLUGINS_URL} ${localPluginsPath}`);
}
