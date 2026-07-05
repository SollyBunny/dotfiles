#!/bin/env node

import { getThisDir } from "#shared/shared.mjs";
import fs from "node:fs";
import path from "node:path";

const __dir = getThisDir(import.meta.url);

const scriptRoot = path.join(__dir, "scripts");
const scripts = fs.readdirSync(scriptRoot)
    .filter(v => v.endsWith(".mjs")).toSorted();
for (const script of scripts)
    await import(path.join(scriptRoot, script));
