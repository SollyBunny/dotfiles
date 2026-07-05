import { spawn } from "node:child_process";
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

const socketPath = process.argv[2];
if (!socketPath) {
    console.error("Rootshell not given a socketPath");
    process.exit(4);
}

function runShell(command) {
    return new Promise((resolve, reject) => {
        const child = spawn("/bin/bash", ["-c", command], {
            stdio: "inherit"
        });
        child.on("error", reject);
        child.on("close", (code, signal) => resolve({ code, signal }));
    });
}

const socket = net.connect(socketPath);

async function onMessage(message) {
    message = JSON.parse(message);
    try {
        const out = await runShell(message.command);
        socket.write(JSON.stringify({ id: message.id, resolve: out }) + "\n");
    } catch (e) {
        socket.write(JSON.stringify({ id: message.id, reject: e }) + "\n");
    }
}

socket.on("connect", () => {
    socket.write("ready\n");
});

let message = "";
socket.on("data", data => {
    const newlineIndex = data.indexOf("\n");
    if (newlineIndex === -1) {
        message += data;
    } else {
        message += data.slice(0, newlineIndex);
        onMessage(message);
        message = data.slice(newlineIndex + 1);
    }
});

socket.on("error", error => {
    throw error;
});
