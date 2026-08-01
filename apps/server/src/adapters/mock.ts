import { randomUUID } from "node:crypto";
import { createEvent, type LiveEvent } from "@openlivebar/protocol";
import { BasePlatformAdapter, type PlatformCapability, type PlatformConnection } from "@openlivebar/platform-sdk";

export class MockAdapter extends BasePlatformAdapter {
  readonly id = "mock";
  readonly displayName = "Simulator";
  readonly capabilities = new Set<PlatformCapability>(["chat", "reaction", "gift", "follow", "share", "subscription"]);
  #channelId = "demo-room";

  async connect(config: PlatformConnection): Promise<void> {
    this.#channelId = config.channelId;
    this.connected = true;
  }

  async disconnect(): Promise<void> {
    this.connected = false;
  }

  async simulate(type: "join" | "chat" | "gift", text = "Hey"): Promise<void> {
    if (!this.connected) throw new Error("Mock adapter is not connected");
    const base = {
      id: randomUUID(), platform: this.id, channelId: this.#channelId,
      occurredAt: new Date().toISOString(),
      user: { platformUserId: "demo-user", displayName: "Demo Viewer", username: "demo" }
    } as const;
    let event: LiveEvent;
    if (type === "join") event = createEvent({ ...base, type: "viewer.joined" });
    else if (type === "chat") event = createEvent({ ...base, type: "chat.message", data: { text } });
    else event = createEvent({ ...base, type: "gift.received", data: { giftId: "rose", name: "Rose", count: 1 } });
    await this.emit(event);
  }
}
