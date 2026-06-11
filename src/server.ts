import "./lib/error-capture";

import { consumeLastCapturedError } from "./lib/error-capture";
import { renderErrorPage } from "./lib/error-page";

type ServerEntry = {
  fetch: (request: Request, env: unknown, ctx: unknown) => Promise<Response> | Response;
};

let serverEntryPromise: Promise<ServerEntry> | undefined;

async function getServerEntry(): Promise<ServerEntry> {
  if (!serverEntryPromise) {
    serverEntryPromise = import("@tanstack/react-start/server-entry").then(
      (m) => ((m as { default?: ServerEntry }).default ?? (m as unknown as ServerEntry)),
    );
  }
  return serverEntryPromise;
}

function brandedErrorResponse(): Response {
  return new Response(renderErrorPage(), {
    status: 500,
    headers: {
      "content-type": "text/html; charset=utf-8",
      ...SECURITY_HEADERS,
    },
  });
}

// ── Security headers added to every HTML response ──────────────────────────
// API/JSON routes should not be cached; assets are immutable (handled by Vercel).
const SECURITY_HEADERS: Record<string, string> = {
  // Prevent MIME sniffing
  "x-content-type-options": "nosniff",
  // Block framing (clickjacking)
  "x-frame-options": "DENY",
  // Enable XSS filter in old browsers
  "x-xss-protection": "1; mode=block",
  // Strict transport security — 1 year, include subdomains
  "strict-transport-security": "max-age=31536000; includeSubDomains; preload",
  // Referrer — only send origin, never full path
  "referrer-policy": "strict-origin-when-cross-origin",
  // Permissions policy — deny all browser features we don't use
  "permissions-policy": "camera=(), microphone=(), geolocation=(), payment=(), usb=(), bluetooth=()",
  // Content Security Policy
  // - default-src 'self'
  // - scripts: self + Vite/TanStack bundles from same origin + Google Fonts
  // - styles: self + inline (Tailwind inlines critical CSS) + Google Fonts
  // - connect: self + Supabase (wss for realtime)
  // - img: self + data: (avatars)
  // - fonts: Google Fonts CDN
  // - frame-ancestors: none (belt + x-frame-options)
  "content-security-policy": [
    "default-src 'self'",
    // Scripts: own bundles + Google AdSense (loaded only when admin enables ads)
    // + AssistLoop widget. 'unsafe-inline' is required for the framework's
    // hydration bootstrap; we constrain everything else tightly below.
    "script-src 'self' 'unsafe-inline' https://pagead2.googlesyndication.com https://*.googlesyndication.com https://*.google.com https://*.googleadservices.com https://assistloop.ai",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    // Images: own + data/blob avatars + signed Supabase storage + ad creatives
    "img-src 'self' data: blob: https://*.supabase.co https://*.googlesyndication.com https://*.google.com https://*.gstatic.com",
    // Network: own API + Supabase (REST/storage/realtime) + AssistLoop + ad calls
    "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://assistloop.ai https://pagead2.googlesyndication.com https://*.google.com",
    // Ad iframes need a frame allowance; we still forbid being framed ourselves
    "frame-src https://googleads.g.doubleclick.net https://*.google.com https://*.googlesyndication.com",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "object-src 'none'",
    "upgrade-insecure-requests",
  ].join("; "),
};

function applySecurityHeaders(response: Response): Response {
  const ct = response.headers.get("content-type") ?? "";
  // Only inject security headers on HTML pages and API responses.
  // Static assets like JS/CSS are served directly by Vercel with their own headers.
  if (!ct.includes("text/html") && !ct.includes("application/json")) {
    return response;
  }

  const next = new Response(response.body, response);
  for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
    // Don't override CSP if already set (e.g. by a specific route)
    if (!next.headers.has(key)) {
      next.headers.set(key, value);
    }
  }
  // Never cache HTML pages — always fresh
  if (ct.includes("text/html")) {
    next.headers.set("cache-control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  }
  return next;
}

function isCatastrophicSsrErrorBody(body: string, responseStatus: number): boolean {
  let payload: unknown;
  try { payload = JSON.parse(body); } catch { return false; }
  if (!payload || Array.isArray(payload) || typeof payload !== "object") return false;
  const fields = payload as Record<string, unknown>;
  const expectedKeys = new Set(["message", "status", "unhandled"]);
  if (!Object.keys(fields).every((key) => expectedKeys.has(key))) return false;
  return (
    fields.unhandled === true &&
    fields.message === "HTTPError" &&
    (fields.status === undefined || fields.status === responseStatus)
  );
}

async function normalizeCatastrophicSsrResponse(response: Response): Promise<Response> {
  if (response.status < 500) return response;
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) return response;
  const body = await response.clone().text();
  if (!isCatastrophicSsrErrorBody(body, response.status)) return response;
  console.error(consumeLastCapturedError() ?? new Error(`h3 swallowed SSR error: ${body}`));
  return brandedErrorResponse();
}

export default {
  async fetch(request: Request, env: unknown, ctx: unknown) {
    try {
      const handler  = await getServerEntry();
      const response = await handler.fetch(request, env, ctx);
      const normalized = await normalizeCatastrophicSsrResponse(response);
      return applySecurityHeaders(normalized);
    } catch (error) {
      console.error(error);
      return brandedErrorResponse();
    }
  },
};
