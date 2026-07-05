import { getThisDir, runShell } from "#shared/shared.mjs";
import RootShell from "./rootshell.mjs";
import path from "node:path";

const rootshell = new RootShell()
await rootshell.init();

const __dir = getThisDir(import.meta.url);
runShell(`${process.argv[0]} ${path.join(__dir, "sudo.mjs")}`);