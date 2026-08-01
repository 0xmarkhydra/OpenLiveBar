import { createServer } from "node:http";
import { AdapterRegistry } from "@openlivebar/platform-sdk";
import { MockAdapter } from "./adapters/mock.js";
import { plannedAdapters } from "./adapters/placeholders.js";

const registry = new AdapterRegistry();
const mock = new MockAdapter();
registry.register(mock);
for (const adapter of plannedAdapters) registry.register(adapter);

await mock.connect({ channelId: process.env.CHANNEL_ID ?? "demo-room" });
mock.onEvent((event) => console.log(JSON.stringify(event)));

const server = createServer(async (request, response) => {
  response.setHeader("content-type", "application/json; charset=utf-8");
  if (request.url === "/health") {
    response.end(JSON.stringify({ ok: true, platforms: registry.list().map(({ id, displayName, capabilities }) => ({ id, displayName, capabilities: [...capabilities] })) }));
    return;
  }
  if (request.url?.startsWith("/simulate/")) {
    const type = request.url.split("/")[2] as "join" | "chat" | "gift";
    if (!["join", "chat", "gift"].includes(type)) { response.statusCode = 400; response.end(JSON.stringify({ error: "Unknown simulation" })); return; }
    await mock.simulate(type);
    response.end(JSON.stringify({ accepted: true }));
    return;
  }
  response.statusCode = 404;
  response.end(JSON.stringify({ error: "Not found" }));
});

const port = Number(process.env.PORT ?? 8787);
server.listen(port, () => console.log(`OpenLiveBar server listening on http://localhost:${port}`));
