/// <reference lib="webworker" />

/**
 * Web Worker for heavy data processing (mapping, filtering, sorting)
 * Iteration 3: Zero-Blockage Architecture
 */

let activeRequestIds = new Set<string>();

function makeId(): string {
    // WebKit in Tauri on macOS may not support crypto.randomUUID() in workers.
    const maybeRandomUUID = (globalThis.crypto as any)?.randomUUID;
    if (typeof maybeRandomUUID === 'function') {
        return maybeRandomUUID.call(globalThis.crypto);
    }

    return `${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

addEventListener('message', ({ data }) => {
    const { type, payload, requestId } = data;

    switch (type) {
        case 'PROCESS_WEAPONS':
            activeRequestIds.add(requestId);
            processWeapons(payload, requestId);
            break;
        case 'PROCESS_ITEMS':
            activeRequestIds.add(requestId);
            processItems(payload, requestId);
            break;
        case 'ABORT':
            activeRequestIds.delete(payload);
            break;
        case 'TERMINATE':
            activeRequestIds.clear();
            break;
        default:
            console.warn(`[DataProcessorWorker] Unknown message type: ${type}`);
    }
});

/**
 * Process a chunk of weapons
 */
function processWeapons(weapons: any[], requestId: string) {
    if (!activeRequestIds.has(requestId)) return;

    const processed = weapons.map((w) => ({
        ...w,
        // Ensure numeric values are valid
        magazineSize: Number(w.magazineSize) || 0,
        killProbability: Number(w.killProbability) || 0,
        retriggerTime: Number(w.retriggerTime) || 0,
    }));

    postMessage({
        type: 'DATA_CHUNK',
        payload: processed,
        requestId,
    });
}

/**
 * Process a chunk of items
 */
function processItems(items: any[], requestId: string) {
    if (!activeRequestIds.has(requestId)) return;

    const processed = items.map((i) => ({
        ...i,
        // Add frontend-only IDs for modifiers if not present
        modifiers: i.modifiers?.map((m: any) => ({
            ...m,
            _id: m._id || makeId(),
        })),
    }));

    postMessage({
        type: 'DATA_CHUNK',
        payload: processed,
        requestId,
    });
}
