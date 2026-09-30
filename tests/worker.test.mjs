import assert from "node:assert/strict";
import test from "node:test";
import worker from "../cloudflare/worker.mjs";

const APP_ORIGIN = "https://kastanje-app-demo.gustavonline.workers.dev";

function assetFixture(files = {}) {
  const requests = [];
  return {
    requests,
    binding: {
      async fetch(request) {
        requests.push(request);
        const path = new URL(request.url).pathname;
        const file = files[path];
        if (!file) return new Response("Not found", { status: 404 });
        return new Response(request.method === "HEAD" ? null : file.body, {
          headers: { "Content-Type": file.type },
        });
      },
    },
  };
}

function environment(binding, appOrigin = APP_ORIGIN) {
  return { APP_ORIGIN: appOrigin, ASSETS: binding };
}

function request(path, method = "GET", host = "kastanje.example") {
  return new Request(`https://${host}${path}`, { method });
}

async function fetchWorker(path, options = {}) {
  const { method = "GET", host } = options;
  const appOrigin = Object.hasOwn(options, "appOrigin")
    ? options.appOrigin
    : APP_ORIGIN;
  const assets = assetFixture({
    "/index.html": { body: "<main>Kastanje landing</main>", type: "text/html" },
    "/assets/site.css": { body: "body { color: green }", type: "text/css" },
  });
  const env = Object.hasOwn(options, "appOrigin")
    ? { APP_ORIGIN: appOrigin, ASSETS: assets.binding }
    : environment(assets.binding);
  const response = await worker.fetch(
    request(path, method, host),
    env,
  );
  return { response, assets };
}

function assertSecurityHeaders(response) {
  const csp = response.headers.get("content-security-policy");
  assert.ok(csp);
  assert.match(csp, /connect-src 'none'/);
  assert.match(csp, /form-action 'none'/);
  assert.match(csp, /frame-src 'none'/);
  assert.match(csp, /style-src 'self' 'unsafe-inline'/);
  assert.equal(response.headers.get("x-content-type-options"), "nosniff");
  assert.equal(response.headers.get("x-frame-options"), "DENY");
  assert.equal(response.headers.get("referrer-policy"), "no-referrer");
}

test("root and manifest serve the built index through the asset binding", async () => {
  for (const path of ["/", "/manifest"]) {
    const { response, assets } = await fetchWorker(path);
    assert.equal(response.status, 200);
    assert.match(await response.text(), /Kastanje landing/);
    assert.equal(new URL(assets.requests[0].url).pathname, "/index.html");
    assertSecurityHeaders(response);
  }
});

test("HEAD serves headers without a response body", async () => {
  const { response, assets } = await fetchWorker("/", { method: "HEAD" });
  assert.equal(response.status, 200);
  assert.equal(response.body, null);
  assert.equal(assets.requests[0].method, "HEAD");
  assertSecurityHeaders(response);
});

test("known assets pass through and unknown paths stay 404", async () => {
  const fixture = assetFixture({
    "/index.html": { body: "index", type: "text/html" },
    "/assets/site.css": { body: "body {}", type: "text/css" },
  });
  const known = await worker.fetch(
    request("/assets/site.css"),
    environment(fixture.binding),
  );
  assert.equal(known.status, 200);
  assert.equal(await known.text(), "body {}");
  assertSecurityHeaders(known);

  const unknown = await worker.fetch(
    request("/not-a-page"),
    environment(fixture.binding),
  );
  assert.equal(unknown.status, 404);
  assert.equal(new URL(fixture.requests.at(-1).url).pathname, "/not-a-page");
});

test("app redirects stay on the configured origin and preserve path and query", async () => {
  const { response, assets } = await fetchWorker(
    "/app/compare?theme=dark&model=one",
    { host: "untrusted.example" },
  );
  assert.equal(response.status, 302);
  const location = new URL(response.headers.get("location"));
  assert.equal(location.origin, APP_ORIGIN);
  assert.equal(location.pathname, "/app/compare");
  assert.equal(location.searchParams.get("theme"), "dark");
  assert.equal(location.searchParams.get("model"), "one");
  assert.equal(assets.requests.length, 0);
  assertSecurityHeaders(response);
});

test("app root, onboarding and both editor connect routes redirect", async () => {
  for (const path of [
    "/app?theme=light",
    "/onboarding?theme=dark",
    "/connect/vscode?theme=dark&return=%2Fapp%2Fprojects",
    "/connect/codex?theme=light",
  ]) {
    const { response, assets } = await fetchWorker(path);
    assert.equal(response.status, 302, path);
    const location = new URL(response.headers.get("location"));
    assert.equal(location.origin, APP_ORIGIN);
    assert.equal(location.pathname, path.split("?")[0]);
    assert.equal(location.search, new URL(`https://example.test${path}`).search);
    assert.equal(assets.requests.length, 0);
    assertSecurityHeaders(response);
  }
});

test("API, inference, versioned and MCP paths are denied without reaching assets", async () => {
  for (const path of [
    "/api",
    "/api/health",
    "/v1/inference",
    "/inference",
    "/mcp",
    "/app/api/v1/models",
    "/%61pi/models",
  ]) {
    const { response, assets } = await fetchWorker(path);
    assert.equal(response.status, 404, path);
    assert.equal(assets.requests.length, 0, path);
    assertSecurityHeaders(response);
  }
});

test("only GET and HEAD are accepted", async () => {
  const assets = assetFixture();
  const response = await worker.fetch(
    request("/app", "POST"),
    environment(assets.binding),
  );
  assert.equal(response.status, 405);
  assert.equal(response.headers.get("allow"), "GET, HEAD");
  assert.equal(assets.requests.length, 0);
  assertSecurityHeaders(response);
});

test("invalid APP_ORIGIN values fail visibly before serving or redirecting", async () => {
  for (const appOrigin of [
    undefined,
    "http://app.example",
    "https://user:pass@app.example",
    "https://app.example/app",
    "https://app.example?theme=dark",
    "https://app.example#section",
  ]) {
    const { response, assets } = await fetchWorker("/", { appOrigin });
    assert.equal(response.status, 500, String(appOrigin));
    assert.match(await response.text(), /APP_ORIGIN/);
    assert.equal(assets.requests.length, 0);
    assertSecurityHeaders(response);
  }
});
