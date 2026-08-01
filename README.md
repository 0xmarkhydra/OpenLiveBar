# OpenLiveBar

Open-source, platform-agnostic interactive bar engine for livestream creators.
Viewers become virtual guests and trigger in-game actions through chat,
reactions, gifts, follows, shares, and subscriptions.

> OpenLiveBar is not affiliated with TikTok, YouTube, Facebook, X, or their parent companies.

## Why platform-agnostic?

The game never consumes provider payloads directly. Every integration implements
the `PlatformAdapter` contract and converts native events into the versioned
`LiveEvent` protocol. The same game rules therefore work across platforms.

```text
TikTok  ─┐
YouTube ─┼─> Platform adapters ─> LiveEvent protocol ─> Rules ─> Game/OBS
Facebook─┤
X       ─┘
```

## Current status

This repository contains the initial foundation:

- Versioned cross-platform live-event protocol
- Public adapter SDK and registry
- Capability discovery per platform
- Working mock adapter and event simulator
- Placeholders for TikTok, YouTube, Facebook, and X
- Minimal health API

Platform placeholders intentionally do not pretend unsupported APIs exist.
Availability differs by platform, account type, region, and API approval.

## Quick start

```bash
npm install
npm run check
npm run dev:server
```

Try the simulator:

```bash
curl http://localhost:8787/health
curl http://localhost:8787/simulate/join
curl http://localhost:8787/simulate/chat
curl http://localhost:8787/simulate/gift
```

## Add a platform

1. Implement `PlatformAdapter` from `@openlivebar/platform-sdk`.
2. Keep API credentials inside the adapter/server environment.
3. Normalize native payloads to `LiveEvent`.
4. Declare only capabilities the integration actually supports.
5. Add contract tests using recorded, anonymized fixtures.

See [docs/architecture.md](docs/architecture.md) and [CONTRIBUTING.md](CONTRIBUTING.md).

## Roadmap

- Phase 1: protocol, simulator, TikTok adapter, realtime gateway
- Phase 2: 2D bar game, rules engine, OBS overlay, admin dashboard
- Phase 3: YouTube adapter and durable sessions/leaderboards
- Phase 4: Facebook and X adapters where supported by official APIs
- Phase 5: plugin marketplace and multi-room hosting

## License

MIT
