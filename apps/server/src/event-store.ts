import { randomUUID } from "node:crypto";

export const BAR_EVENT_TYPES = [
  "guest.joined",
  "guest.left",
  "guest.dance",
  "guest.promoted",
  "camera.focus",
  "effect.fireworks",
  "effect.confetti",
  "effect.smoke",
  "room.message",
  "room.reset",
  "gift.received",
  "chat.message",
  "viewer.joined",
] as const;

export type BarEventType = (typeof BAR_EVENT_TYPES)[number];

export interface BarGuest {
  id: string;
  name: string;
  username?: string;
  avatarUrl?: string;
}

export interface BarEventInput {
  id?: string;
  type: BarEventType;
  user?: BarGuest;
  data?: Record<string, unknown>;
  createdAt?: string;
}

export interface BarEvent extends Omit<BarEventInput, "id" | "createdAt"> {
  id: string;
  roomId: string;
  cursor: number;
  createdAt: string;
}

interface RoomState {
  cursor: number;
  events: BarEvent[];
  eventIds: Set<string>;
}

export class EventStore {
  readonly #rooms = new Map<string, RoomState>();

  constructor(private readonly maxEventsPerRoom = 500) {}

  publish(roomId: string, input: BarEventInput): { event: BarEvent; duplicate: boolean } {
    const room = this.#room(roomId);
    const eventId = input.id?.trim() || randomUUID();
    const previous = room.events.find((event) => event.id === eventId);
    if (previous) return { event: previous, duplicate: true };

    const event: BarEvent = {
      ...input,
      id: eventId,
      roomId,
      cursor: ++room.cursor,
      createdAt: input.createdAt ?? new Date().toISOString(),
    };
    room.events.push(event);
    room.eventIds.add(event.id);

    while (room.events.length > this.maxEventsPerRoom) {
      const removed = room.events.shift();
      if (removed) room.eventIds.delete(removed.id);
    }
    return { event, duplicate: false };
  }

  read(roomId: string, after = 0, limit = 100): { cursor: number; events: BarEvent[] } {
    const room = this.#room(roomId);
    const safeLimit = Math.min(Math.max(limit, 1), 100);
    const events = room.events.filter((event) => event.cursor > after).slice(0, safeLimit);
    return { cursor: events.at(-1)?.cursor ?? Math.max(after, room.cursor), events };
  }

  state(roomId: string): { roomId: string; cursor: number; retainedEvents: number } {
    const room = this.#room(roomId);
    return { roomId, cursor: room.cursor, retainedEvents: room.events.length };
  }

  reset(roomId: string): BarEvent {
    const room = this.#room(roomId);
    room.events = [];
    room.eventIds.clear();
    return this.publish(roomId, { type: "room.reset" }).event;
  }

  #room(roomId: string): RoomState {
    let room = this.#rooms.get(roomId);
    if (!room) {
      room = { cursor: 0, events: [], eventIds: new Set() };
      this.#rooms.set(roomId, room);
    }
    return room;
  }
}

export function isBarEventType(value: unknown): value is BarEventType {
  return typeof value === "string" && (BAR_EVENT_TYPES as readonly string[]).includes(value);
}
