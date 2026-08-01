import assert from "node:assert/strict";
import test from "node:test";
import { EventStore } from "./event-store.js";

test("publishes and reads events using a cursor", () => {
  const store = new EventStore();
  const first = store.publish("bar", { type: "guest.joined", user: { id: "1", name: "MMON" } });
  store.publish("bar", { type: "guest.dance", user: { id: "1", name: "MMON" } });

  assert.equal(first.event.cursor, 1);
  assert.deepEqual(store.read("bar", 1).events.map((event) => event.type), ["guest.dance"]);
});

test("deduplicates retried third-party events", () => {
  const store = new EventStore();
  store.publish("bar", { id: "provider-42", type: "effect.fireworks" });
  const retry = store.publish("bar", { id: "provider-42", type: "effect.fireworks" });

  assert.equal(retry.duplicate, true);
  assert.equal(store.state("bar").retainedEvents, 1);
});
