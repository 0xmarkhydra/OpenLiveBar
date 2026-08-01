import type { LiveEvent, PlatformId } from "@openlivebar/protocol";

export type PlatformCapability = "chat" | "reaction" | "gift" | "follow" | "share" | "subscription";

export interface PlatformConnection {
  channelId: string;
  credentials?: Record<string, string>;
  options?: Record<string, unknown>;
}

export interface PlatformAdapter {
  readonly id: PlatformId;
  readonly displayName: string;
  readonly capabilities: ReadonlySet<PlatformCapability>;
  connect(config: PlatformConnection): Promise<void>;
  disconnect(): Promise<void>;
  onEvent(handler: (event: LiveEvent) => void | Promise<void>): () => void;
  health(): Promise<{ connected: boolean; message?: string }>;
}

export class AdapterRegistry {
  readonly #adapters = new Map<PlatformId, PlatformAdapter>();

  register(adapter: PlatformAdapter): this {
    if (this.#adapters.has(adapter.id)) throw new Error(`Adapter already registered: ${adapter.id}`);
    this.#adapters.set(adapter.id, adapter);
    return this;
  }

  get(id: PlatformId): PlatformAdapter {
    const adapter = this.#adapters.get(id);
    if (!adapter) throw new Error(`Unknown platform adapter: ${id}`);
    return adapter;
  }

  list(): PlatformAdapter[] {
    return [...this.#adapters.values()];
  }
}

export abstract class BasePlatformAdapter implements PlatformAdapter {
  abstract readonly id: PlatformId;
  abstract readonly displayName: string;
  abstract readonly capabilities: ReadonlySet<PlatformCapability>;
  protected connected = false;
  readonly #handlers = new Set<(event: LiveEvent) => void | Promise<void>>();

  abstract connect(config: PlatformConnection): Promise<void>;
  abstract disconnect(): Promise<void>;

  onEvent(handler: (event: LiveEvent) => void | Promise<void>): () => void {
    this.#handlers.add(handler);
    return () => this.#handlers.delete(handler);
  }

  async health(): Promise<{ connected: boolean }> {
    return { connected: this.connected };
  }

  protected async emit(event: LiveEvent): Promise<void> {
    await Promise.all([...this.#handlers].map((handler) => handler(event)));
  }
}
