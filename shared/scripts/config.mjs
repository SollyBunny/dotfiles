import fs from "node:fs/promises";
import path from "node:path";
import { exists, getThisDir, safeWrite } from "./fs.mjs";

const CONFIG_FILE = path.join(getThisDir(import.meta.url), "../../config.json");

async function readConfig() {
	return await exists(CONFIG_FILE) ? JSON.parse(await fs.readFile(CONFIG_FILE)) : {};
}

async function writeConfig(config) {
	await safeWrite(CONFIG_FILE, JSON.stringify(config, null, "\t"));
}

export async function setConfig(key, value) {
	const config = await readConfig();
	config[key] = value;
	await writeConfig(config);
}

export async function getConfig(key) {
	const config = await readConfig();
	return config[key];
}

export async function getConfigOr(key, or) {
	const config = await readConfig();
	if (!config[key]) {
		config[key] = await or();
		await writeConfig(config);
	}
	return config[key];
}
