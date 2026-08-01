import { BasePlatformAdapter, type PlatformCapability, type PlatformConnection } from "@openlivebar/platform-sdk";
import type { PlatformId } from "@openlivebar/protocol";

/**
 * Declares provider capabilities without leaking provider-specific payloads into
 * the engine. Each real adapter will normalize its API/webhook data to LiveEvent.
 */
export class PlaceholderAdapter extends BasePlatformAdapter {
  constructor(
    readonly id: PlatformId,
    readonly displayName: string,
    readonly capabilities: ReadonlySet<PlatformCapability>,
  ) { super(); }

  async connect(_config: PlatformConnection): Promise<void> {
    throw new Error(`${this.displayName} adapter is planned but not implemented yet`);
  }

  async disconnect(): Promise<void> { this.connected = false; }
}

export const plannedAdapters = [
  new PlaceholderAdapter("tiktok", "TikTok LIVE", new Set(["chat", "reaction", "gift", "follow", "share"])),
  new PlaceholderAdapter("youtube", "YouTube Live", new Set(["chat", "gift", "subscription"])),
  new PlaceholderAdapter("facebook", "Facebook Live", new Set(["chat", "reaction"])),
  new PlaceholderAdapter("x", "X Live", new Set(["chat", "reaction"])),
] as const;
