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

const IPC_SOCKET_PATH = process.env["IPC_SOCKET_PATH"];
if (!IPC_SOCKET_PATH) {
	console.error("Rootshell daemon not given IPC_SOCKET_PATH");
	process.exit(4);
}

const IPC_SOCKET_PASSWORD = process.env["IPC_SOCKET_PASSWORD"];
if (!IPC_SOCKET_PASSWORD) {
	console.error("Rootshell daemon not given IPC_SOCKET_PASSWORD");
	process.exit(5);
}

const runShellEnv = structuredClone(process.env);
delete process.env["IPC_SOCKET_PATH"];
delete process.env["IPC_SOCKET_PASSWORD"];

function runShell(command) {
	return new Promise((resolve, reject) => {
		const child = spawn("/bin/bash", ["-c", command], {
			stdio: "inherit",
			env: runShellEnv,
		});
		child.on("error", reject);
		child.on("close", (code, signal) => resolve({ code, signal }));
	});
}

async function onMessage({ message, write, destroy }) {
	message = JSON.parse(message);
	try {
		const out = await runShell(message.command);
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
	await fs.chmod(IPC_SOCKET_PATH, 0o666);
});

function cleanup() {
	server.close();
	fs.unlink(IPC_SOCKET_PATH);
}
process.on("exit", cleanup);
process.on("SIGINT", cleanup);
process.on("SIGTERM", cleanup);
