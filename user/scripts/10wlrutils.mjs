import { runShell } from "#shared/shell.mjs";

await runShell("rustup toolchain install stable --profile minimal");
await runShell("cargo install wlr-chooser");
