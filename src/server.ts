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
      (m) => (m.default ?? m) as ServerEntry,
    );
  }
  return serverEntryPromise;
}

// h3 swallows in-handler throws into a normal 500 Response with body
// {"unhandled":true,"message":"HTTPError"} — try/catch alone never fires for those.
async function normalizeCatastrophicSsrResponse(response: Response): Promise<Response> {
  if (response.status < 500) return response;
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) return response;

  const body = await response.clone().text();
  if (!body.includes('"unhandled":true') || !body.includes('"message":"HTTPError"')) {
    return response;
  }

  console.error(consumeLastCapturedError() ?? new Error(`h3 swallowed SSR error: ${body}`));
  return new Response(renderErrorPage(), {
    status: 500,
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}

function corsHeaders(request: Request) {
  const origin = request.headers.get("origin") ?? "";
  const allowed =
    origin === "https://localhost" ||
    origin === "http://localhost" ||
    origin === "capacitor://localhost" ||
    origin === "https://sonexa.local" ||
    origin.endsWith(".vercel.app");

  const headers = new Headers();
  if (allowed) headers.set("access-control-allow-origin", origin);
  headers.set("vary", "origin");
  headers.set("access-control-allow-methods", "GET,POST,OPTIONS");
  headers.set(
    "access-control-allow-headers",
    "authorization,content-type,x-sonexa-api-key,x-tsr-serverfn,x-tsr-serverFn,accept",
  );
  return headers;
}

function apiCorsHeaders() {
  return {
    "access-control-allow-origin": "*",
    "access-control-allow-methods": "GET,OPTIONS",
    "access-control-allow-headers": "authorization,content-type,x-sonexa-api-key,accept",
    "content-type": "application/json; charset=utf-8",
  };
}

function apiJson(body: unknown, init: ResponseInit = {}) {
  return new Response(JSON.stringify(body), {
    ...init,
    headers: { ...apiCorsHeaders(), ...(init.headers ?? {}) },
  });
}

function readApiKey(request: Request) {
  const headerKey = request.headers.get("x-sonexa-api-key")?.trim();
  if (headerKey) return headerKey;
  const authorization = request.headers.get("authorization") ?? "";
  const match = authorization.match(/^Bearer\s+(.+)$/i);
  return match?.[1]?.trim() ?? "";
}

async function handleCatalogApi(request: Request) {
  const key = readApiKey(request);
  if (!key) {
    return apiJson(
      {
        ok: false,
        error: "Missing API key",
        format: {
          header: "x-sonexa-api-key: sx_your_key",
          authorization: "Authorization: Bearer sx_your_key",
        },
      },
      { status: 401 },
    );
  }

  const [{ hashSonexaApiKey }, { listFirestoreDocs }, { listSongs }] = await Promise.all([
    import("./lib/api/api-keys.functions"),
    import("./integrations/firebase/firestore-rest"),
    import("./lib/api/catalog.functions"),
  ]);
  const keyHash = await hashSonexaApiKey(key);
  const apiKeys = await listFirestoreDocs<{
    key_hash?: string;
    active?: boolean;
    key_prefix?: string;
    name?: string;
  }>("sonexa_api_keys").catch(() => []);
  const valid = apiKeys.some((row) => row.active === true && row.key_hash === keyHash);
  if (!valid) return apiJson({ ok: false, error: "Invalid or revoked API key" }, { status: 401 });

  const catalog = await listSongs();
  const songs = (catalog.songs ?? []).map((song: any) => ({
    id: song.id,
    title: song.title,
    artist: song.artists?.name ?? song.artist ?? "Unknown",
    album: song.albums?.title ?? null,
    thumbnail: song.cover_url ?? "",
    coverUrl: song.cover_url ?? "",
    audioUrl: song.audio_url ?? "",
    genre: song.genre ?? null,
    mood: song.mood ?? null,
    playCount: song.play_count ?? 0,
    source: String(song.id ?? "").startsWith("firebase_") ? "firebase" : "supabase",
  }));

  return apiJson({
    ok: true,
    count: songs.length,
    songs,
    format: {
      endpoint: "/api/sonexa/catalog",
      header: "x-sonexa-api-key: sx_your_key",
    },
  });
}

async function handleDailySyncApi(request: Request) {
  const cronHeader = request.headers.get("x-vercel-cron");
  const secret = new URL(request.url).searchParams.get("secret") ?? request.headers.get("x-sonexa-cron-secret");
  const expectedSecret = process.env.DAILY_SYNC_SECRET?.trim() ?? "";

  if (cronHeader !== "1" && (!expectedSecret || secret !== expectedSecret)) {
    return apiJson({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  if (request.method !== "GET") {
    return apiJson({ ok: false, error: "Method not allowed" }, { status: 405 });
  }

  const { runDailyYouTubeSync } = await import("./lib/daily-sync.server");
  const result = await runDailyYouTubeSync();
  return apiJson({
    ok: true,
    ...result,
  });
}

async function handleScheduledDownloadApi(request: Request) {
  const cronHeader = request.headers.get("x-vercel-cron");
  const secret = new URL(request.url).searchParams.get("secret") ?? request.headers.get("x-sonexa-cron-secret");
  const expectedSecret = process.env.DAILY_SYNC_SECRET?.trim() ?? "";

  if (cronHeader !== "1" && (!expectedSecret || secret !== expectedSecret)) {
    return apiJson({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  if (request.method !== "GET") {
    return apiJson({ ok: false, error: "Method not allowed" }, { status: 405 });
  }

  const { executeScheduledDownload } = await import("./lib/api/scheduler.functions");
  const result = await executeScheduledDownload();
  return apiJson({
    ok: true,
    ...result,
  });
}

function withCors(request: Request, response: Response) {
  const headers = new Headers(response.headers);
  corsHeaders(request).forEach((value, key) => headers.set(key, value));
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

export default {
  async fetch(request: Request, env: unknown, ctx: unknown) {
    try {
      const url = new URL(request.url);
      if (url.pathname === "/api/sonexa/catalog") {
        if (request.method === "OPTIONS") {
          return new Response(null, { status: 204, headers: apiCorsHeaders() });
        }
        if (request.method !== "GET") {
          return apiJson({ ok: false, error: "Method not allowed" }, { status: 405 });
        }
        return handleCatalogApi(request);
      }

      if (url.pathname === "/api/sonexa/daily-sync") {
        if (request.method === "OPTIONS") {
          return new Response(null, { status: 204, headers: apiCorsHeaders() });
        }
        return handleDailySyncApi(request);
      }

      if (url.pathname === "/api/sonexa/scheduled-download") {
        if (request.method === "OPTIONS") {
          return new Response(null, { status: 204, headers: apiCorsHeaders() });
        }
        return handleScheduledDownloadApi(request);
      }

      if (request.method === "OPTIONS") {
        return new Response(null, { status: 204, headers: corsHeaders(request) });
      }
      const handler = await getServerEntry();
      const response = await handler.fetch(request, env, ctx);
      return withCors(request, await normalizeCatastrophicSsrResponse(response));
    } catch (error) {
      console.error(error);
      return withCors(
        request,
        new Response(renderErrorPage(), {
          status: 500,
          headers: { "content-type": "text/html; charset=utf-8" },
        }),
      );
    }
  },
};
