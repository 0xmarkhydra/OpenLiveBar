# Contributing

OpenLiveBar welcomes platform adapters, game rules, tests, documentation, and
original visual assets.

Before opening a pull request:

1. Keep provider-specific code inside its adapter.
2. Never commit access tokens, cookies, session IDs, or personal viewer data.
3. Add tests for normalizing provider events.
4. Document whether an integration uses an official or unofficial API.
5. Confirm assets and dependencies permit open-source redistribution.
6. Run `npm run check` and `npm test`.

Please open an issue before introducing a breaking protocol change.
