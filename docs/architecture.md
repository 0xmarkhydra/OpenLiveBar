# Architecture

## Boundary rule

Provider SDKs and raw payloads may only exist in `adapters`. The protocol,
rules engine, game, admin application, and persistence layers must never import
TikTok-, Google-, Meta-, or X-specific SDKs.

## Event flow

1. A provider adapter receives a webhook, WebSocket event, or polling result.
2. It validates, deduplicates, and converts that payload to `LiveEvent`.
3. The gateway publishes the normalized event to the room event bus.
4. The rules engine converts the event to deterministic game commands.
5. The overlay renders those commands and can rebuild state after reconnecting.

## Compatibility

- `LiveEvent.version` protects consumers from breaking schema changes.
- Unknown platforms are supported through the open `PlatformId` type.
- Capability discovery prevents the UI from promising unavailable features.
- Provider identifiers are scoped by `(platform, platformUserId)`.
- Raw payloads are optional and must not be persisted by default.

## Planned packages

| Package | Responsibility |
|---|---|
| `protocol` | Stable event contracts |
| `platform-sdk` | Adapter interface and registry |
| `rules-engine` | Events to deterministic game commands |
| `realtime` | Room event bus and overlay delivery |
| `game` | Phaser rendering and animation |
| `admin` | Connections, mappings, moderation and simulator |

## Security

- Provider secrets stay server-side.
- Overlay URLs use room-scoped, read-only tokens.
- Webhook adapters verify signatures and timestamps.
- Event IDs are deduplicated before rewards or scores are applied.
- Logs redact credentials and minimize viewer data.
