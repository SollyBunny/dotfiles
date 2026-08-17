import { runShellRoot } from "#shared/shell.mjs";
import { getConfig, setConfig } from "#shared/config.mjs";
import { fileHash } from "#shared/fs.mjs";

const localeGenHashNew = await fileHash("/etc/locale.gen");
const localeGenHashOld = await getConfig("locale.gen hash");
if (localeGenHashNew !== localeGenHashOld) {
	await runShellRoot("locale-gen");
	await setConfig("locale.gen hash", localeGenHashNew);
}
