export const LIVE_EVENT_VERSION = 1 as const;

export type PlatformId = "tiktok" | "youtube" | "facebook" | "x" | "mock" | (string & {});

export interface LiveUser {
  platformUserId: string;
  displayName: string;
  username?: string;
  avatarUrl?: string;
  badges?: string[];
}

interface EventBase {
  version: typeof LIVE_EVENT_VERSION;
  id: string;
  platform: PlatformId;
  channelId: string;
  occurredAt: string;
  user?: LiveUser;
  raw?: unknown;
}

export type LiveEvent =
  | (EventBase & { type: "stream.started" | "stream.ended" })
  | (EventBase & { type: "viewer.joined" | "viewer.followed" | "viewer.shared" })
  | (EventBase & { type: "chat.message"; data: { text: string } })
  | (EventBase & { type: "reaction.received"; data: { kind: string; count: number } })
  | (EventBase & {
      type: "gift.received";
      data: { giftId: string; name: string; count: number; value?: number; currency?: string; streakId?: string; streakEnded?: boolean };
    })
  | (EventBase & { type: "subscription.created"; data?: { tier?: string } })
  | (EventBase & { type: "custom"; data: { name: string; payload?: unknown } });

export type LiveEventInput = LiveEvent extends infer Event
  ? Event extends LiveEvent ? Omit<Event, "version"> : never
  : never;

export function createEvent<T extends LiveEventInput>(event: T): T & { version: typeof LIVE_EVENT_VERSION } {
  return { version: LIVE_EVENT_VERSION, ...event };
}
