# Research: UI Layout, Performance, and Non-Blocking Loading

**Feature**: 001-ui-layout-optimization
**Date**: 2026-01-22
**Status**: Resolved (Iteration 3)

---

## 1. Skeleton Loaders for Asynchronous Icons

[... unchanged from Iteration 2 ...]

---

## 2. Main-Thread Yielding vs. Web Workers (Iteration 3)

### Problem

`yieldToMain` (Iteration 2) successfully reduced long-task duration, but heavy data processing (mapping thousands of objects, string manipulation, and recursive calculations) still occurs on the main thread. This causes micro-stutters that interrupt CSS animations and delay route transitions when the CPU is under load.

### Decision

Move all **Data Transformation** logic (parsing Tauri results into local models, applying filters, sorting) to a dedicated **Web Worker**.

### Rationale

- **True Parallelism**: Web Workers run on separate OS threads. The main thread remains dedicated to 60fps UI rendering and event handling.
- **Angular Support**: Angular has native support for Web Workers via `new Worker(new URL('./app.worker', import.meta.url))`.

---

## 3. Tauri V2 Channels for Data Streaming

### Problem

Passing a massive JSON array (e.g., 2000 weapons) over the IPC bridge creates a "blocking burst" during serialization (Rust) and deserialization (TS).

### Decision

Use **Tauri V2 Channels** to stream data from Rust to the Web Worker.

### Rationale

- **Reduced Memory Pressure**: Data arrives in small chunks, avoiding huge temporary allocations.
- **Progressive Hydration**: The UI can start rendering the first 50 items while the remaining 1950 are still being processed in the background.

---

## 4. Batching Signal Updates

### Problem

Updating a Signal for every single item streamed from a Channel would trigger thousands of change detection cycles, freezing the UI.

### Decision

Implement a **Buffer & Flush** strategy. The Web Worker processes items and sends batches (e.g., 100 items or every 16ms) to the main thread.

---

## Implementation Pattern (Iteration 3)

1.  **Rust**: Use `tauri::ipc::Channel` to send chunks of scanned items.
2.  **Worker**: Listens to the Channel, maps data to models, and `postMessage` batches back to the service.
3.  **Service**: Receives batches and updates the Signal once per batch.
4.  **Abort**: Service sends a `TERMINATE` message to the Worker/Rust when the component is destroyed.
