import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { createServer } from "node:net";
import { setTimeout as pause } from "node:timers/promises";

// Exercise the real asset binding: a plain mock misses Cloudflare's HTML redirects.
const listener = createServer();
await new Promise(resolve => listener.listen(0, "127.0.0.1", resolve));
const port = listener.address().port;
await new Promise(resolve => listener.close(resolve));
const origin = `http://127.0.0.1:${port}`;
const child = spawn(process.execPath, ["node_modules/wrangler/bin/wrangler.js", "dev",
  "--config", "cloudflare/wrangler.jsonc", "--local", "--ip", "127.0.0.1", "--port", String(port)],
  { cwd: new URL("..", import.meta.url), env: { ...process.env, WRANGLER_SEND_METRICS: "false" }, stdio: ["ignore", "pipe", "pipe"] });
let output = "";
for (const stream of [child.stdout, child.stderr]) stream.on("data", data => { output = (output + data).slice(-8000); });
let exited = false;
const closed = new Promise(resolve => child.on("close", () => { exited = true; resolve(); }));
try {
  let ready = false;
  const deadline = Date.now() + 40_000;
  while (Date.now() < deadline && !exited) {
    try { await fetch(origin, { redirect: "manual", signal: AbortSignal.timeout(1000) }); ready = true; break; }
    catch { await pause(150); }
  }
  assert.ok(ready, "Local Worker failed to start: " + output);
  for (const route of ["/", "/manifest", "/mark.svg"]) {
    const response = await fetch(origin + route, { redirect: "manual" });
    assert.equal(response.status, 200, route + " must serve an asset without redirecting");
    assert.equal(response.headers.get("x-content-type-options"), "nosniff");
    if (route !== "/mark.svg") assert.match(await response.text(), /id="root"/);
  }
  assert.equal((await fetch(origin + "/manifest", { method: "HEAD" })).status, 200);
  const app = await fetch(origin + "/app?theme=dark", { redirect: "manual" });
  assert.equal(app.status, 302);
  assert.equal(app.headers.get("location"), "https://kastanje-app-demo.gustavonline.workers.dev/app?theme=dark");
  for (const route of ["/unknown", "/api/bootstrap", "/v1/models", "/mcp"])
    assert.equal((await fetch(origin + route, { redirect: "manual" })).status, 404, route);
  assert.equal((await fetch(origin, { method: "POST" })).status, 405);
  console.log("Real local Cloudflare Worker: root, manifest, assets, HEAD, bounded app redirect, 404 and write denial passed.");
} finally {
  child.kill("SIGTERM");
  const stopped = await Promise.race([closed.then(() => true), pause(3000).then(() => false)]);
  if (!stopped) { child.kill("SIGKILL"); await closed; }
}
