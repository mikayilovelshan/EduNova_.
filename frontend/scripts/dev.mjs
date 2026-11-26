// Starts `next dev` with Node trusting the OS certificate store, so the server-side BFF can call the
// API over https://localhost:7123 with the ASP.NET Core dev certificate (`dotnet dev-certs https --trust`).
// NODE_USE_SYSTEM_CA must be a real environment variable: next dev forwards it to its server process,
// but values from .env files are loaded too late for it to take effect.
import { spawn } from "node:child_process";
import { createRequire } from "node:module";

const nextBin = createRequire(import.meta.url).resolve("next/dist/bin/next");

const child = spawn(process.execPath, [nextBin, "dev", ...process.argv.slice(2)], {
  stdio: "inherit",
  env: { ...process.env, NODE_USE_SYSTEM_CA: process.env.NODE_USE_SYSTEM_CA ?? "1" },
});

for (const signal of ["SIGINT", "SIGTERM"]) process.on(signal, () => child.kill(signal));
child.on("exit", (code, signal) => process.exit(code ?? (signal ? 1 : 0)));
