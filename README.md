# OpenLiveBar

An open-source, API-controlled virtual bar for livestream creators.

OpenLiveBar renders a vertical 9:16 nightclub that can be used as an OBS Browser
Source. Any third-party service can call the HTTP API to add guests, focus a
camera, send gifts, promote VIPs, display messages, or run stage effects.

The MVP deliberately does **not** connect to social networks. TikTok, YouTube,
Facebook, X, custom bots, and future providers all sit outside the game and call
the same provider-neutral API.

> OpenLiveBar is not affiliated with TikTok, YouTube, Facebook, X, or their parent companies.

## Features

- Responsive vertical 9:16 virtual bar
- Animated guests with display names and optional avatars
- Dance floor, tables, DJ stage, lights and VIP lounge
- Camera spotlight, fireworks, confetti and smoke effects
- Provider-neutral HTTP event API
- Cursor polling: no WebSocket or SSE
- Idempotent event IDs for safe third-party retries
- Optional Bearer API key for writes
- In-memory event history capped per room

## Start

```bash
npm install
npm run build
npm test
npm start --workspace @openlivebar/server
```

Open the room:

```text
http://localhost:8787/bar/demo
```

Send a guest into the bar:

```bash
curl -X POST http://localhost:8787/api/v1/rooms/demo/events \
  -H 'content-type: application/json' \
  -d '{"type":"guest.joined","user":{"id":"u1","name":"Mr. MMON"}}'
```

Send a Rose:

```bash
curl -X POST http://localhost:8787/api/v1/rooms/demo/events \
  -H 'content-type: application/json' \
  -d '{"type":"gift.received","user":{"id":"u1","name":"Mr. MMON"},"data":{"giftName":"Rose","count":1}}'
```

Read the complete [HTTP API documentation](docs/API.md).

## Configuration

| Variable | Default | Purpose |
|---|---|---|
| `PORT` | `8787` | HTTP server port |
| `OPENLIVEBAR_API_KEY` | unset | Optional Bearer key for write APIs |

## Architecture

```text
Third-party event reader ──POST HTTP──> OpenLiveBar API
                                            │
OBS Browser Source <────HTTP cursor polling─┘
```

Future social adapters can live in separate packages. They must call the public
HTTP API instead of being imported into the visual bar.

## License

MIT
