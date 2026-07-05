import { getThisDir, moveToBackup, runShell } from "#shared/shared.mjs";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

const __dir = getThisDir(import.meta.url);

const configRoot = path.join(__dir, "../config");

/**
 * Returns a list of absolute paths in ../config
 * These paths are to be linked from ../config/* to ~/*
 * Paths included are
 * 1. .local/bin
 * 2. Files in ../config/
 * 3. Folders in ../config/* containing a file named __link
 */
async function getPathsToLink() {
    const out = [];

    out.push(path.join(configRoot, ".local/bin"));
    
    const dirents = await fs.readdir(configRoot, {
        recursive: true,
        withFileTypes: true,
    });
    for (const dirent of dirents) {
        if (dirent.parentPath === configRoot && dirent.isFile())
            out.push(path.join(dirent.parentPath, dirent.name));
        else if (dirent.name === "__link")
            out.push(dirent.parentPath);
    }

    return out;
}

const pathsToLink = await getPathsToLink();

for (const target of pathsToLink) {
    const linkPath = path.join(os.homedir(), path.relative(configRoot, target));
    const targetRel = path.relative(path.dirname(linkPath), target);
    await moveToBackup(linkPath);
    await fs.mkdir(path.dirname(linkPath), { recursive: true });
    await fs.symlink(targetRel, linkPath);
}
