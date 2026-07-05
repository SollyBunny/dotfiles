// Used when programs need sudo

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

const id = "oneshot";
const command = process.argv
    .slice(2)
    .map(arg => `'${arg.replaceAll("'", `'\"'\"'`)}'`)
    .join(" ");

console.log(IPC_SOCKET_PASSWORD, IPC_SOCKET_PATH)
// 30s timeout
for (let i = 0; i < 300; ++i) {
    if (await fs.stat(this.IPC_SOCKET_PATH, { throwIfNoEntry: false }))
        break;
    await new Promise(resolve => setTimeout(resolve, 100));
    console.log(i)
}

console.log(IPC_SOCKET_PASSWORD, IPC_SOCKET_PATH)

const socket = net.createConnection(this.IPC_SOCKET_PATH);

socket.once("connect", () => {
    socket.write(this.IPC_SOCKET_PASSWORD + "\n");
    socket.write(JSON.stringify({ id, command }) + "\n");
});

socket.on("error", error => {
    throw error;
}).unref();

socket.once("close", () => {
    process.exit(0)
});


