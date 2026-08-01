# OpenLiveBar HTTP API

The API controls a room without knowing where events came from. A TikTok tool,
YouTube bot, custom dashboard, Stream Deck, or shell script can all send the
same requests.

## Open a room

Open `http://localhost:8787/bar/demo` as a browser or OBS Browser Source.

If `OPENLIVEBAR_API_KEY` is configured, include this header on every write:

```http
Authorization: Bearer YOUR_KEY
```

## Create an event

```http
POST /api/v1/rooms/{roomId}/events
Content-Type: application/json
```

Every event may include an `id`. Reusing the same ID is safe: OpenLiveBar will
recognize a retry and will not play the event twice.

### Add a guest

```bash
curl -X POST http://localhost:8787/api/v1/rooms/demo/events \
  -H 'content-type: application/json' \
  -d '{"id":"join-001","type":"guest.joined","user":{"id":"u1","name":"Phan Tuấn","avatarUrl":"https://example.com/avatar.jpg"}}'
```

### Make a guest dance

```bash
curl -X POST http://localhost:8787/api/v1/rooms/demo/events \
  -H 'content-type: application/json' \
  -d '{"type":"guest.dance","user":{"id":"u1","name":"Phan Tuấn"}}'
```

### Focus the camera

```bash
curl -X POST http://localhost:8787/api/v1/rooms/demo/events \
  -H 'content-type: application/json' \
  -d '{"type":"camera.focus","user":{"id":"u1","name":"Phan Tuấn"}}'
```

### Send a gift

```bash
curl -X POST http://localhost:8787/api/v1/rooms/demo/events \
  -H 'content-type: application/json' \
  -d '{"type":"gift.received","user":{"id":"u1","name":"Phan Tuấn"},"data":{"giftId":"rose","giftName":"Rose","count":1}}'
```

Built-in gift-name rules:

| Gift contains | Bar action |
|---|---|
| `rose`, `camera` | Focus guest |
| `fire`, `universe` | Fireworks and focus |
| `vip`, `crown`, `rosa` | Move guest to VIP |
| `smoke`, `perfume` | Smoke effect |
| anything else | Dance and confetti |

### Direct effects

Use `effect.fireworks`, `effect.confetti`, or `effect.smoke` as the event type.

### Promote to VIP

```bash
curl -X POST http://localhost:8787/api/v1/rooms/demo/events \
  -H 'content-type: application/json' \
  -d '{"type":"guest.promoted","user":{"id":"u1","name":"Phan Tuấn"}}'
```

### Display a message

```json
{"type":"room.message","data":{"message":"Happy birthday!"}}
```

## Read events

The bar uses ordinary HTTP polling. No WebSocket or SSE is required.

```http
GET /api/v1/rooms/demo/events?after=42&limit=100
```

The response contains ordered events and a numeric cursor. Pass the latest
cursor as `after` on the next request.

## Reset a room

```bash
curl -X POST http://localhost:8787/api/v1/rooms/demo/reset
```
