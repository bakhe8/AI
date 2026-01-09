import { EventEmitter } from "events";

// Singleton event emitter for adapter replies/notifications
const emitter = new EventEmitter();

export function createAdapterEventEmitter() {
    return emitter;
}

export function getAdapterEventEmitter() {
    return emitter;
}
