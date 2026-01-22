/**
 * Yields execution back to the main thread to allow UI updates and event processing.
 * Useful for breaking up long-running tasks that might otherwise block the UI.
 *
 * @returns A promise that resolves in the next micro-task/event loop cycle.
 */
export async function yieldToMain(): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, 0));
}
