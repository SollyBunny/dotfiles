import os from "node:os";
import path from "node:path";
import { gitUpdate } from "#shared/install.mjs";

await gitUpdate(
	"https://github.com/sollybunny/noctalia-plugins",
	path.join(os.homedir(), "Code/noctalia-plugins"),
);
