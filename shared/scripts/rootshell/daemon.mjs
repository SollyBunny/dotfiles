import { spawn } from "node:child_process";
import fs from "node:fs/promises";
import net from "node:net";

const spawnPpid = process.ppid;
setInterval(() => {
	if (process.ppid !== spawnPpid || process.ppid === 1)
		process.exit(2);
}, 100);

if (process.getuid() !== 0) {
	console.error("Rootshell daemon not root");
	process.exit(3);
}

const requiredEnv = ["IPC_SOCKET_PATH", "IPC_SOCKET_PASSWORD", "IPC_SOCKET_UID", "IPC_SOCKET_GID"];
for (const key of requiredEnv) {
	if (!process.env[key]) {
		console.error(`Missing env ${key}`);
		process.exit(1);
	}
}

const IPC_SOCKET_PATH = process.env["IPC_SOCKET_PATH"];
const IPC_SOCKET_PASSWORD = process.env["IPC_SOCKET_PASSWORD"];
const IPC_SOCKET_UID = Number(process.env["IPC_SOCKET_UID"]);
const IPC_SOCKET_GID = Number(process.env["IPC_SOCKET_GID"]);

for (const key of requiredEnv)
	delete process.env[key];

function populateEnv(env) {
	if (!env)
		return undefined;
	const out = structuredClone(process.env);
	for (const key in env)
		out[key] = env[key];
	return out;
}

function runShell(command, env) {
	env = populateEnv(env);
	return new Promise((resolve, reject) => {
		let child;
		if (Array.isArray(command)) {
			child = spawn(command[0], command.slice(1), {
				stdio: "inherit", env
			});
		} else {
			child = spawn("/bin/bash", ["-c", command], {
				stdio: "inherit", env
			});
		}
		child.on("error", reject);
		child.on("close", (code, signal) => resolve({ code, signal }));
	});
}

async function onMessage({ message, write, destroy }) {
	message = JSON.parse(message);
	try {
		const out = await runShell(message.command, message.env);
		write(JSON.stringify({ id: message.id, resolve: out }));
	} catch (e) {
		write(JSON.stringify({ id: message.id, reject: e }));
	}
	if (message.id === "oneshot")
		destroy();
}

const server = net.createServer(socket => {
	function write(message) {
		socket.write(message);
		socket.write("\n");
	}
	function destroy() {
		socket.destroy();
	}

	let ready = false;
	function onMessageInternal(message) {
		if (!ready) {
			if (message === IPC_SOCKET_PASSWORD)
				ready = true;
			else
				socket.destroy();
			return;
		}
		onMessage({ message, write, destroy });
	}

	let messagePartial = "";
	socket.on("data", data => {
		messagePartial += data;
		const messages = messagePartial.split("\n");
		messagePartial = messages.pop();
		for (const message of messages)
			onMessageInternal(message);
	});
});

server.listen(IPC_SOCKET_PATH, async () => {
	await fs.chown(IPC_SOCKET_PATH, IPC_SOCKET_UID, IPC_SOCKET_GID);
	await fs.chmod(IPC_SOCKET_PATH, 0o600);
});

function cleanup() {
	server.close();
	fs.unlink(IPC_SOCKET_PATH);
}
process.on("exit", cleanup);
process.on("SIGINT", cleanup);
process.on("SIGTERM", cleanup);
