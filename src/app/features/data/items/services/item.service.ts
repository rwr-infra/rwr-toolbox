import { Injectable, signal, computed, inject, OnDestroy } from '@angular/core';
import { invoke, convertFileSrc, Channel } from '@tauri-apps/api/core';
import { TranslocoService } from '@jsverse/transloco';
import {
    GenericItem,
    ItemScanResult,
    getItemSlot,
    isCarryItem,
} from '../../../../shared/models/items.models';
import { ColumnVisibility } from '../../../../shared/models/column.models';
import { SortState } from '../../../../shared/models/sort.models';

import { yieldToMain } from '../../../../core/utils/performance.utils';

/**
 * Item filters for advanced search
 */
export interface ItemFilters {
    itemType?: 'carry_item' | 'visual_item';
    encumbrance?: { min?: number; max?: number };
    price?: { min?: number; max?: number };
    canRespawnWith?: boolean;
    inStock?: boolean;
}

/**
 * Manages item data state and communicates with Rust backend via Tauri commands.
 * Uses Angular v20 Signals pattern for reactive state management.
 * Iteration 3: Zero-Blockage Architecture using Web Workers and Tauri Channels.
 */
@Injectable({ providedIn: 'root' })
export class ItemService implements OnDestroy {
    private transloco = inject(TranslocoService);
    private worker: Worker | null = null;
    private currentRequestId: string | null = null;

    // Private writable signals
    private items = signal<GenericItem[]>([]);
    private loading = signal<boolean>(false);
    private error = signal<string | null>(null);
    private searchTerm = signal<string>('');
    private filters = signal<ItemFilters>({});
    private _visibleColumns = signal<ColumnVisibility[]>(
        this.getDefaultColumns(),
    );
    private sortState = signal<SortState>({ columnKey: null, direction: null });

    // Buffering for Signal updates
    private itemBuffer: GenericItem[] = [];
    private lastFlushTime = 0;
    private readonly FLUSH_THRESHOLD = 100;
    private readonly FLUSH_INTERVAL = 16; // ms

    constructor() {
        this.initializeWorker();
    }

    ngOnDestroy() {
        this.terminateWorker();
    }

    private initializeWorker() {
        if (typeof Worker !== 'undefined') {
            this.worker = new Worker(
                new URL(
                    '../../../../core/workers/data-processor.worker',
                    import.meta.url,
                ),
            );
            this.worker.onmessage = ({ data }) => {
                const { type, payload, requestId } = data;
                if (requestId !== this.currentRequestId) return;

                if (type === 'DATA_CHUNK') {
                    this.handleDataChunk(payload);
                }
            };

            this.worker.onerror = (e) => {
                console.error('[ItemService] Worker error, falling back:', e);
                this.terminateWorker();
            };

            this.worker.onmessageerror = (e) => {
                console.error(
                    '[ItemService] Worker message error, falling back:',
                    e,
                );
                this.terminateWorker();
            };
        } else {
            console.warn('Web Workers are not supported in this environment.');
        }
    }

    private terminateWorker() {
        if (this.worker) {
            this.worker.terminate();
            this.worker = null;
        }
    }

    private handleDataChunk(chunk: GenericItem[]) {
        this.itemBuffer.push(...chunk);
        const now = Date.now();

        if (
            this.itemBuffer.length >= this.FLUSH_THRESHOLD ||
            now - this.lastFlushTime >= this.FLUSH_INTERVAL
        ) {
            this.flushBuffer();
        }
    }

    private flushBuffer() {
        if (this.itemBuffer.length === 0) return;

        const chunk = [...this.itemBuffer];
        this.itemBuffer = [];
        this.lastFlushTime = Date.now();

        // De-dupe by key (mods can override base game entries).
        this.items.update((current) => {
            const map = new Map<string, GenericItem>();
            for (const i of current) {
                map.set(i.key || i.id, i);
            }
            for (const i of chunk) {
                map.set(i.key || i.id, i);
            }
            return Array.from(map.values());
        });
    }

    // Private signals for processing
    private filteredItemsSig = computed(() => {
        const items = this.items();
        const term = this.searchTerm();
        const filters = this.filters();

        return items.filter(
            (i) =>
                this.matchesSearch(i, term) && this.matchesFilters(i, filters),
        );
    });

    // Public computed signals
    readonly filteredItems = computed(() => {
        const filtered = this.filteredItemsSig();
        const sort = this.sortState();

        if (sort.columnKey && sort.direction) {
            return this.sortItems(filtered, sort.columnKey, sort.direction);
        }

        return filtered;
    });

    readonly itemsSig = this.items.asReadonly();
    readonly loadingSig = this.loading.asReadonly();
    readonly errorSig = this.error.asReadonly();
    readonly visibleColumnsSig = this._visibleColumns.asReadonly();
    readonly sortStateSig = this.sortState.asReadonly();

    /** Scan items from game directory */
    async scanItems(
        gamePath: string,
        directory?: string,
        append: boolean = false,
        manageLoading: boolean = true,
    ): Promise<GenericItem[]> {
        if (this.loading() && !append) {
            return [];
        }

        if (!append && manageLoading) {
            this.loading.set(true);
            this.error.set(null);
            this.items.set([]);
            this.itemBuffer = [];
        }

        this.currentRequestId = crypto.randomUUID();
        const onEvent = new Channel<any>();
        const collectedItems: GenericItem[] = [];

        const debugScan = localStorage.getItem('rwr.debug.scan') === '1';
        if (debugScan) {
            console.log('[ItemService] scanItems start', {
                gamePath,
                directory,
                append,
                requestId: this.currentRequestId,
            });
        }

        return new Promise<GenericItem[]>((resolve, reject) => {
            let settled = false;

            const finish = () => {
                if (settled) return;
                settled = true;
                this.flushBuffer();
                if (manageLoading) {
                    this.loading.set(false);
                }
                resolve(collectedItems);
            };

            const fail = (e: unknown) => {
                if (settled) return;
                settled = true;
                if (manageLoading) {
                    this.loading.set(false);
                }
                reject(e);
            };

            const normalizeMessage = (
                raw: any,
            ): { event: string; data?: any } | null => {
                if (!raw) return null;

                // Common Tauri shapes (depends on API version): payload/message/data wrappers.
                if (typeof raw === 'object') {
                    if (typeof raw.event === 'string') return raw;
                    if (raw.payload && typeof raw.payload.event === 'string')
                        return raw.payload;
                    if (raw.message && typeof raw.message.event === 'string')
                        return raw.message;
                    if (raw.data && typeof raw.data.event === 'string')
                        return raw.data;
                }

                // Some event systems pass [eventType, data]
                if (Array.isArray(raw) && typeof raw[0] === 'string') {
                    return { event: raw[0], data: raw[1] };
                }

                return null;
            };

            onEvent.onmessage = (raw) => {
                const msg = normalizeMessage(raw);
                if (!msg) {
                    if (debugScan) {
                        console.log(
                            '[ItemService] channel event (unrecognized)',
                            raw,
                        );
                    }
                    return;
                }

                const { event: eventType, data } = msg;
                if (debugScan) {
                    console.log('[ItemService] channel event', {
                        eventType,
                        dataLen: Array.isArray(data) ? data.length : undefined,
                    });
                }

                if (eventType === 'chunk') {
                    collectedItems.push(...data);
                    if (this.worker) {
                        try {
                            this.worker.postMessage({
                                type: 'PROCESS_ITEMS',
                                payload: data,
                                requestId: this.currentRequestId,
                            });
                        } catch (e) {
                            console.error(
                                '[ItemService] Worker postMessage failed, falling back:',
                                e,
                            );
                            this.terminateWorker();
                            this.handleDataChunk(data);
                        }
                    } else {
                        this.handleDataChunk(data);
                    }
                } else if (eventType === 'error') {
                    this.error.set(data);
                } else if (eventType === 'finished') {
                    finish();
                }
            };

            invoke<ItemScanResult>('scan_items_collect', {
                gamePath,
                game_path: gamePath,
                directory: directory || null,
            })
                .then(async (result) => {
                    const CHUNK_SIZE = 200;
                    for (let i = 0; i < result.items.length; i += CHUNK_SIZE) {
                        const chunk = result.items.slice(i, i + CHUNK_SIZE);
                        collectedItems.push(...chunk);

                        if (this.worker) {
                            try {
                                this.worker.postMessage({
                                    type: 'PROCESS_ITEMS',
                                    payload: chunk,
                                    requestId: this.currentRequestId,
                                });
                            } catch (e) {
                                this.terminateWorker();
                                this.handleDataChunk(chunk);
                            }
                        } else {
                            this.handleDataChunk(chunk);
                        }

                        await yieldToMain();
                    }

                    finish();
                })
                .catch((e) => {
                    const errorMsg = this.transloco.translate(
                        'items.scanError',
                        {
                            error: String(e),
                        },
                    );
                    this.error.set(errorMsg);
                    fail(e);
                });
        });
    }

    /**
     * Batch scan multiple directories
     */
    async batchScanItems(paths: string[]): Promise<GenericItem[]> {
        if (paths.length === 0) return [];

        this.loading.set(true);
        this.error.set(null);
        this.items.set([]);
        this.itemBuffer = [];

        const allItems: GenericItem[] = [];
        for (const path of paths) {
            try {
                const items = await this.scanItems(path, path, true, false);
                allItems.push(...items);
            } catch (e) {
                console.error(`Batch scan failed for ${path}:`, e);
            }
        }

        this.flushBuffer();
        this.loading.set(false);
        return allItems;
    }

    /** Clear items */
    clearItems(): void {
        this.items.set([]);
    }

    /** Refresh items using stored game path */
    async refreshItems(gamePath: string, directory?: string): Promise<void> {
        await this.scanItems(gamePath, directory);
    }

    /** Update search term */
    setSearchTerm(term: string): void {
        this.searchTerm.set(term);
    }

    /** Update filters */
    setFilters(filters: ItemFilters): void {
        this.filters.set(filters);
    }

    /** Clear all filters */
    clearFilters(): void {
        this.searchTerm.set('');
        this.filters.set({});
    }

    /** Set column visibility */
    setColumnVisibility(columns: ColumnVisibility[]): void {
        this._visibleColumns.set(columns);
        try {
            localStorage.setItem(
                'items.column.visibility',
                JSON.stringify(columns),
            );
        } catch {
            /* ignore */
        }
    }

    /** Get current column visibility */
    getColumnVisibility(): ColumnVisibility[] {
        return this._visibleColumns();
    }

    /** Set sort state */
    setSortState(state: SortState): void {
        this.sortState.set(state);
    }

    /** Get current sort state */
    getSortState(): SortState {
        return this.sortState();
    }

    /** Get item details by key */
    getItemDetails(itemKey: string): GenericItem | undefined {
        return this.items().find((i) => i.key === itemKey);
    }

    /**
     * Get icon URL for an item using Tauri's convertFileSrc
     */
    async getIconUrl(item: GenericItem): Promise<string> {
        if (item.itemType !== 'carry_item' || !item.hudIcon) return '';
        try {
            const iconPath = await invoke<string>('get_item_texture_path', {
                itemFilePath: item.sourceFile,
                iconFilename: item.hudIcon,
            });
            return convertFileSrc(iconPath);
        } catch {
            return '';
        }
    }

    private matchesSearch(item: GenericItem, term: string): boolean {
        if (!term) return true;
        const lowerTerm = term.toLowerCase();
        return (
            item.name.toLowerCase().includes(lowerTerm) ||
            item.key?.toLowerCase().includes(lowerTerm) ||
            item.itemType.toLowerCase().includes(lowerTerm) ||
            item.packageName.toLowerCase().includes(lowerTerm)
        );
    }

    private matchesFilters(item: GenericItem, filters: ItemFilters): boolean {
        if (filters.itemType && item.itemType !== filters.itemType)
            return false;
        if (filters.encumbrance) {
            const enc = item.encumbrance ?? 0;
            if (
                filters.encumbrance.min !== undefined &&
                enc < filters.encumbrance.min
            )
                return false;
            if (
                filters.encumbrance.max !== undefined &&
                enc > filters.encumbrance.max
            )
                return false;
        }
        if (filters.price) {
            const price = item.price ?? 0;
            if (filters.price.min !== undefined && price < filters.price.min)
                return false;
            if (filters.price.max !== undefined && price > filters.price.max)
                return false;
        }
        if (
            filters.canRespawnWith !== undefined &&
            item.canRespawnWith !== filters.canRespawnWith
        )
            return false;
        if (filters.inStock !== undefined && item.inStock !== filters.inStock)
            return false;
        return true;
    }

    private sortItems(
        items: GenericItem[],
        columnKey: string,
        direction: 'asc' | 'desc',
    ): GenericItem[] {
        const indexed = items.map((i, idx) => ({
            item: i,
            originalIndex: idx,
        }));
        indexed.sort((a, b) => {
            const comparison = this.compareValues(
                a.item[columnKey as keyof GenericItem],
                b.item[columnKey as keyof GenericItem],
            );
            const result = direction === 'asc' ? comparison : -comparison;
            return result !== 0 ? result : a.originalIndex - b.originalIndex;
        });
        return indexed.map((indexedItem) => indexedItem.item);
    }

    private compareValues(a: unknown, b: unknown): number {
        if (a == null && b == null) return 0;
        if (a == null) return 1;
        if (b == null) return -1;
        if (typeof a === 'number' && typeof b === 'number') return a - b;
        return String(a).localeCompare(String(b));
    }

    private getDefaultColumns(): ColumnVisibility[] {
        try {
            const stored = localStorage.getItem('items.column.visibility');
            if (stored) return JSON.parse(stored);
        } catch {
            /* ignore */
        }
        return [
            { columnId: 'key', visible: true, order: 0 },
            { columnId: 'name', visible: true, order: 1 },
            { columnId: 'itemType', visible: true, order: 2 },
            { columnId: 'slot', visible: false, order: 3 },
            { columnId: 'encumbrance', visible: true, order: 4 },
            { columnId: 'price', visible: true, order: 5 },
            { columnId: 'filePath', visible: true, order: 6 },
        ];
    }
}
