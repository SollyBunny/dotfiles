import { spawn } from "node:child_process";
import { Socket } from "node:net";
import path from "node:path";
import net from "node:net";
import fs from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { randomUUID } from "node:crypto";
import { getActiveResourcesInfo } from "node:process";

const __dir = path.dirname(fileURLToPath(import.meta.url));

export default class RootShell {
	#inited = false;
	/**
	 * @type {Map<string, { resolve: () => {}, reject: () => {} }>}
	 */
	#waiting = new Map();
	/**
	 * @type {ChildProcessByStdio}
	 */
	#child;
	/**
	 * @type {net.Socket}
	 */
	#socket;
	constructor() {
		this.IPC_SOCKET_PATH = `/run/user/${process.getuid()}/rootshell-${process.pid}.sock`;
		this.IPC_SOCKET_PASSWORD = randomUUID();
		this.ipcEnv = structuredClone(process.env);
		this.ipcEnv["IPC_SOCKET_PATH"] = this.IPC_SOCKET_PATH;
		this.ipcEnv["IPC_SOCKET_PASSWORD"] = this.IPC_SOCKET_PASSWORD;
		this.ipcEnv["PATH"] = path.join(__dir, "bin") + ":" + this.ipcEnv["PATH"];
	}
	async init() {
		if (this.#inited)
			return;
		this.#inited = true;

		const cleanup = async () => {
			if (this.#child && !this.#child.killed)
				this.#child.kill("SIGKILL");
			if (this.#socket)
				this.#socket.destroy();
		};
		process.on("exit", cleanup);
		process.on("SIGINT", cleanup);
		process.on("SIGTERM", cleanup);

		process.stdout.write("Root ");
		this.#child = spawn(
			"/bin/su", ["-c", `${process.execPath} ${path.join(__dir, "daemon.mjs")}`],
			{
				stdio: "inherit",
				detached: true,
				env: this.ipcEnv
			}
		);
		this.#child.on("exit", (code, signal) => {
			console.log(`Rootshell died with code ${code} signal ${signal}`);
			process.exit(1);
		}).unref();

		const toUnref = [];
		let readyPromiseResolve;
		const readyPromise = new Promise(resolve => { readyPromiseResolve = resolve; });

		// 30s timeout
		for (let i = 0; i < 300; ++i) {
			if (await fs.stat(this.IPC_SOCKET_PATH, { throwIfNoEntry: false }))
				break;
			await new Promise(resolve => setTimeout(resolve, 100));
		}
		await new Promise(resolve => setTimeout(resolve, 100));

		this.#socket = net.createConnection(this.IPC_SOCKET_PATH);

		let messagePartial = "";
		toUnref.push(this.#socket.on("data", data => {
			messagePartial += data;
			const messages = messagePartial.split("\n");
			messagePartial = messages.pop();
			for (const message of messages)
				this.onMessage(message);
		}));

		this.#socket.once("connect", () => {
			this.#socket.write(this.IPC_SOCKET_PASSWORD + "\n");
			readyPromiseResolve();
		});
		toUnref.push(this.#socket.on("close", hadError => {
			throw new Error(hadError ? "Socket closed with error" : "Socket closed");
		}));
		toUnref.push(this.#socket.on("error", error => {
			throw error;
		}));

		await readyPromise;
		process.stdout.unref();
		process.stderr.unref();
		toUnref.forEach(v => v.unref());
	}
	onMessage(message) {
		message = JSON.parse(message);
		const waiting = this.#waiting.get(message.id);
		if (!waiting) return;
		if ("resolve" in message)
			waiting.resolve(message.resolve);
		else
			waiting.reject(message.reject);
	}
	async run(command) {
		if (!this.#inited)
			await this.init();
		const id = String(Math.random()).slice(2) + String(performance.now()).replace(".", "");
		const keepAlive = setInterval(() => {}, 1e9);
		const out = await new Promise((resolve, reject) => {
			this.#waiting.set(id, { resolve, reject });
			this.#socket.write(JSON.stringify({ id, command }) + "\n");
		});
		clearInterval(keepAlive);
		return out;
	}
}
