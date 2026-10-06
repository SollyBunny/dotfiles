import { getThisDir, safeWrite } from "#shared/fs.mjs";
import { pacmanInstall } from "#shared/install.mjs";
import fs from "node:fs/promises";
import path from "node:path";

await pacmanInstall("librewolf");
const policies = await fs.readFile(path.join(getThisDir(import.meta.url), "../data/librewolf/policies.json"), "utf-8");
await safeWrite("/usr/lib/librewolf/distribution/policies.json", policies);

await pacmanInstall("torbrowser-launcher");
