import { runShell, getThisDir } from "#shared/shared.mjs";

const __dir = getThisDir(import.meta.url);
runShell(`cd ${path.join(__dir, "../config")} && find . -type f -exec sudo install -D -C -p -v --backup=simple --mode=644 --group=root --owner=root '{}' '/{}' \;`)
