import { createReadStream, existsSync } from "node:fs";
import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { extname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { BAR_EVENT_TYPES, EventStore, isBarEventType, type BarEventInput } from "./event-store.js";

const store = new EventStore();
const apiKey = process.env.OPENLIVEBAR_API_KEY?.trim();
const barRoot = fileURLToPath(new URL("../../bar/", import.meta.url));
const roomPattern = /^[a-zA-Z0-9_-]{1,64}$/;

const mimeTypes: Record<string, string> = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
};

function json(response: ServerResponse, status: number, body: unknown): void {
  response.writeHead(status, {
    "content-type": "application/json; charset=utf-8",
    "access-control-allow-origin": "*",
    "cache-control": "no-store",
  });
  response.end(JSON.stringify(body));
}

function authorized(request: IncomingMessage): boolean {
  if (!apiKey) return true;
  return request.headers.authorization === `Bearer ${apiKey}`;
}

async function body(request: IncomingMessage): Promise<unknown> {
  const chunks: Buffer[] = [];
  let size = 0;
  for await (const chunk of request) {
    const buffer = Buffer.from(chunk);
    size += buffer.length;
    if (size > 64 * 1024) throw new Error("Request body exceeds 64 KB");
    chunks.push(buffer);
  }
  return JSON.parse(Buffer.concat(chunks).toString("utf8") || "{}");
}

function validateEvent(value: unknown): BarEventInput {
  if (!value || typeof value !== "object") throw new Error("Body must be an object");
  const input = value as Record<string, unknown>;
  if (!isBarEventType(input.type)) {
    throw new Error(`type must be one of: ${BAR_EVENT_TYPES.join(", ")}`);
  }
  if (input.user !== undefined) {
    if (!input.user || typeof input.user !== "object") throw new Error("user must be an object");
    const user = input.user as Record<string, unknown>;
    if (typeof user.id !== "string" || !user.id.trim()) throw new Error("user.id is required");
    if (typeof user.name !== "string" || !user.name.trim()) throw new Error("user.name is required");
  }
  return input as unknown as BarEventInput;
}

function serve(response: ServerResponse, relativePath: string): void {
  const target = resolve(barRoot, relativePath);
  if (!target.startsWith(resolve(barRoot)) || !existsSync(target)) {
    json(response, 404, { error: "Not found" });
    return;
  }
  response.writeHead(200, {
    "content-type": mimeTypes[extname(target)] ?? "application/octet-stream",
    "cache-control": relativePath === "index.html" ? "no-store" : "public, max-age=300",
  });
  createReadStream(target).pipe(response);
}

const server = createServer(async (request, response) => {
  const url = new URL(request.url ?? "/", `http://${request.headers.host ?? "localhost"}`);
  if (request.method === "OPTIONS") {
    response.writeHead(204, {
      "access-control-allow-origin": "*",
      "access-control-allow-methods": "GET,POST,OPTIONS",
      "access-control-allow-headers": "authorization,content-type",
    });
    response.end();
    return;
  }

  if (url.pathname === "/") {
    response.writeHead(302, { location: "/bar/demo" });
    response.end();
    return;
  }
  if (url.pathname.startsWith("/bar/")) return serve(response, "index.html");
  if (url.pathname.startsWith("/bar-assets/")) return serve(response, url.pathname.slice("/bar-assets/".length));
  if (url.pathname === "/health") return json(response, 200, { ok: true, transport: "HTTP polling" });

  const match = url.pathname.match(/^\/api\/v1\/rooms\/([^/]+)(?:\/(events|state|reset))?$/);
  if (!match || !roomPattern.test(match[1])) return json(response, 404, { error: "Not found" });
  const [, roomId, resource = "state"] = match;

  try {
    if (request.method === "GET" && resource === "events") {
      const after = Math.max(Number(url.searchParams.get("after") ?? 0) || 0, 0);
      const limit = Number(url.searchParams.get("limit") ?? 100) || 100;
      return json(response, 200, store.read(roomId, after, limit));
    }
    if (request.method === "GET" && resource === "state") return json(response, 200, store.state(roomId));
    if (request.method === "POST" && resource === "events") {
      if (!authorized(request)) return json(response, 401, { error: "Invalid API key" });
      const result = store.publish(roomId, validateEvent(await body(request)));
      return json(response, result.duplicate ? 200 : 201, result);
    }
    if (request.method === "POST" && resource === "reset") {
      if (!authorized(request)) return json(response, 401, { error: "Invalid API key" });
      return json(response, 201, { event: store.reset(roomId) });
    }
    return json(response, 405, { error: "Method not allowed" });
  } catch (error) {
    return json(response, 400, { error: error instanceof Error ? error.message : "Invalid request" });
  }
});

const port = Number(process.env.PORT ?? 8787);
server.listen(port, "0.0.0.0", () => {
  console.log(`OpenLiveBar: http://localhost:${port}/bar/demo`);
  console.log(`Event API: POST http://localhost:${port}/api/v1/rooms/demo/events`);
});
