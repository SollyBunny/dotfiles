import { spawn } from "node:child_process";
import { Socket } from "node:net";
import path from "node:path";
import net from "node:net";
import fs from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { randomUUID } from "node:crypto";
import { getActiveResourcesInfo } from "node:process";

const __dir = path.dirname(fileURLToPath(import.meta.url));

async function socketPid(socket) {
    const ffi = await import("node:ffi");
    const lib = new ffi.DynamicLibrary(null);
    // https://www.man7.org/linux/man-pages/man2/getsockopt.2.html
    const getsockopt = lib.getFunction("getsockopt", {
        return: ffi.types.INT_32,
        arguments: [ffi.types.INT_32, ffi.types.INT_32, ffi.types.INT_32, ffi.types.POINTER, ffi.types.POINTER],
    });
    // https://www.man7.org/linux/man-pages/man3/perror.3.html
    const perror = lib.getFunction("perror", {
        return: ffi.types.VOID,
        arguments: [ffi.types.POINTER],
    });
    var SOL_SOCKET = 1;
    var SO_PEERCRED = 17;
    var SO_PASSCRED = 16;
    const out = new Uint32Array(4).fill(0);
    const byteLengthBuffer = new Uint32Array(1).fill(out.byteLength);
    if (getsockopt(socket._handle.fd, SOL_SOCKET, SO_PEERCRED, ffi.getRawPointer(out), ffi.getRawPointer(byteLengthBuffer)) !== 0) {
        perror("getsockopt");
        throw new Error("getsockopt failed");
    }
    return out[0];
}

async function getPpid(pid) {
    const stat = await fs.readFile(`/proc/${pid}/stat`, "utf8");
    const fields = stat.split(" ");
    return parseInt(fields[3]); // PPID is the 4th field
}

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
     * @type {net.Server}
     */
    #socketServer;
    /**
     * @type {net.Socket}
     */
    #socket;
    #readyPromise;
    #readyPromiseResolve;
    async init() {
        this.#inited = true;
        this.#readyPromise = new Promise(resolve => this.#readyPromiseResolve = resolve);

        const socketPath = `/run/user/${process.getuid()}/rootshell-${process.pid}.sock`;
        const cleanup = async () => {
            if (this.#child && !this.#child.killed)
                this.#child.kill("SIGKILL");
            if (this.#socketServer)
                this.#socketServer.close();
            if (await fs.stat(socketPath, { throwIfNoEntry: false }))
                fs.unlink(socketPath);
        };
        process.on("exit", cleanup);
        process.on("SIGINT", cleanup);
        process.on("SIGTERM", cleanup);

        const toUnref = [];

        this.#socketServer = net.createServer(async socket => {
            const pid = await socketPid(socket);
            const ppid = await getPpid(pid);
            if (this.#socket || (
                pid !== this.#child.pid && ppid !== this.#child.pid
            )) {
                console.log(pid, ppid);
                socket.destroy();
                return;
            }
            this.#socket = socket;
            let message = "";
            socket.on("data", data => {
                const newlineIndex = data.indexOf("\n");
                if (newlineIndex === -1) {
                    message += data;
                } else {
                    message += data.slice(0, newlineIndex);
                    this.onMessage(message);
                    message = data.slice(newlineIndex + 1);
                }
            }).unref();
        });
        toUnref.push(this.#socketServer.listen(socketPath));
        toUnref.push(this.#socketServer);
        process.stdout.unref();
        process.stderr.unref();

        process.stdout.write("Root ");
        this.#child = spawn(
            "/bin/su", ["-c", `${process.execPath} ${path.join(__dir, "daemon.mjs")} ${socketPath}`],
            { stdio: "inherit", detached: true }
        );
        this.#child.on("exit", (code, signal) => {
            console.log(`Rootshell died with code ${code} signal ${signal}`);
            process.exit(1);
        }).unref();

        await this.#readyPromise;
        this.#readyPromise = undefined;
        this.#readyPromiseResolve = undefined;

        toUnref.forEach(v => v.unref());
    }
    onMessage(message) {
        if (message === "ready") {
            this.#readyPromiseResolve?.();
            return;
        }
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
