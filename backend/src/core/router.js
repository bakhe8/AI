import { getAdapter } from "../adapters/registry.js";

export async function routeMessage(model, messages) {
    const adapter = getAdapter(model);
    return adapter.send(messages);
}