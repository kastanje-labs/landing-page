const CONTENT_SECURITY_POLICY = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "frame-ancestors 'none'",
  "frame-src 'none'",
  "form-action 'none'",
  "connect-src 'none'",
  "img-src 'self' data:",
  "font-src 'self'",
  "style-src 'self' 'unsafe-inline'",
  "script-src 'self'",
  "media-src 'self'",
  "manifest-src 'self'",
];

const SECURITY_HEADERS = {
  "Content-Security-Policy": CONTENT_SECURITY_POLICY.join("; "),
  "Referrer-Policy": "no-referrer",
  "Strict-Transport-Security": "max-age=31536000",
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=(), payment=()",
};

const API_ROUTE_SEGMENTS = new Set(["api", "inference", "mcp"]);

function configuredAppOrigin(value) {
  if (typeof value !== "string" || value.trim() !== value || /[\s?#]/.test(value))
    return null;

  // A configured origin may have the conventional trailing slash, but no path.
  if (!/^https:\/\/[^/?#\\]+\/?$/i.test(value)) return null;

  try {
    const url = new URL(value);
    if (
      url.protocol !== "https:" ||
      !url.hostname ||
      url.username ||
      url.password ||
      url.pathname !== "/" ||
      url.search ||
      url.hash
    )
      return null;
    return url.origin;
  } catch {
    return null;
  }
}

function isPlatformRoute(pathname) {
  let decodedPath;
  try {
    decodedPath = decodeURIComponent(pathname);
  } catch {
    return false;
  }

  return decodedPath
    .split("/")
    .some((segment) => API_ROUTE_SEGMENTS.has(segment.toLowerCase()) || /^v\d+$/i.test(segment));
}

function redirectRoute(pathname) {
  if (pathname === "/app" || pathname.startsWith("/app/")) return true;
  return ["/onboarding", "/connect/vscode", "/connect/codex"].includes(pathname);
}

function withSecurityHeaders(response, { head = false } = {}) {
  const headers = new Headers(response.headers);
  for (const [name, value] of Object.entries(SECURITY_HEADERS))
    headers.set(name, value);
  return new Response(head ? null : response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

function textResponse(body, status, extraHeaders = {}) {
  return withSecurityHeaders(
    new Response(body, {
      status,
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-store",
        ...extraHeaders,
      },
    }),
  );
}

export default {
  async fetch(request, env) {
    if (request.method !== "GET" && request.method !== "HEAD")
      return textResponse("Method not allowed", 405, { Allow: "GET, HEAD" });

    const appOrigin = configuredAppOrigin(env?.APP_ORIGIN);
    if (!appOrigin)
      return textResponse(
        "Worker configuration error: APP_ORIGIN must be a full HTTPS origin without credentials, query, fragment, or path.",
        500,
      );

    const requestUrl = new URL(request.url);
    if (isPlatformRoute(requestUrl.pathname)) return textResponse("Not found", 404);

    if (redirectRoute(requestUrl.pathname)) {
      const destination = new URL(appOrigin);
      destination.pathname = requestUrl.pathname;
      destination.search = requestUrl.search;
      return withSecurityHeaders(
        new Response(null, {
          status: 302,
          headers: {
            Location: destination.toString(),
            "Cache-Control": "no-store",
          },
        }),
        { head: true },
      );
    }

    if (!env?.ASSETS || typeof env.ASSETS.fetch !== "function")
      return textResponse("Static asset binding unavailable", 500);

    const assetUrl = new URL(requestUrl);
    if (assetUrl.pathname === "/" || assetUrl.pathname === "/manifest")
      assetUrl.pathname = "/index.html";

    try {
      const assetRequest = new Request(assetUrl, request);
      const assetResponse = await env.ASSETS.fetch(assetRequest);
      return withSecurityHeaders(assetResponse, { head: request.method === "HEAD" });
    } catch {
      return textResponse("Static asset request failed", 502);
    }
  },
};
