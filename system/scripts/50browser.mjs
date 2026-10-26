import { getThisDir, safeWrite } from "#shared/fs.mjs";
import { pacmanInstall } from "#shared/install.mjs";
import fs from "node:fs/promises";
import path from "node:path";

await pacmanInstall("librewolf");
await pacmanInstall("torbrowser-launcher");
