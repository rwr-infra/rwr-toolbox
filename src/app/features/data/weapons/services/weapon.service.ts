import { Injectable, signal, computed, inject, OnDestroy } from '@angular/core';
import { invoke, convertFileSrc, Channel } from '@tauri-apps/api/core';
import { TranslocoService } from '@jsverse/transloco';
import {
    Weapon,
    WeaponScanResult,
    AdvancedFilters,
    ColumnVisibility,
    StanceAccuracy,
} from '../../../../shared/models/weapons.models';
import { SortState } from '../../../../shared/models/sort.models';

import { yieldToMain } from '../../../../core/utils/performance.utils';

/**
 * Manages weapon data state and communicates with Rust backend via Tauri commands.
 * Uses Angular v20 Signals pattern for reactive state management.
 * Iteration 3: Zero-Blockage Architecture using Web Workers and Tauri Channels.
 */
@Injectable({ providedIn: 'root' })
export class WeaponService implements OnDestroy {
    private transloco = inject(TranslocoService);
    private worker: Worker | null = null;
    private currentRequestId: string | null = null;

    // Private writable signals
    private weapons = signal<Weapon[]>([]);
    private loading = signal<boolean>(false);
    private error = signal<string | null>(null);
    private searchTerm = signal<string>('');
    private advancedFilters = signal<AdvancedFilters>({});
    private _visibleColumns = signal<ColumnVisibility[]>(
        this.getDefaultColumns(),
    );
    private sortState = signal<SortState>({ columnKey: null, direction: null });

    // Buffering for Signal updates
    private weaponBuffer: Weapon[] = [];
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
                console.error('[WeaponService] Worker error, falling back:', e);
                this.terminateWorker();
            };

            this.worker.onmessageerror = (e) => {
                console.error(
                    '[WeaponService] Worker message error, falling back:',
                    e,
                );
                this.terminateWorker();
            };
        } else {
            console.warn(
                'Web Workers are not supported in this environment. Falling back to main thread processing.',
            );
        }
    }

    private terminateWorker() {
        if (this.worker) {
            this.worker.terminate();
            this.worker = null;
        }
    }

    private handleDataChunk(chunk: Weapon[]) {
        this.weaponBuffer.push(...chunk);
        const now = Date.now();

        if (
            this.weaponBuffer.length >= this.FLUSH_THRESHOLD ||
            now - this.lastFlushTime >= this.FLUSH_INTERVAL
        ) {
            this.flushBuffer();
        }
    }

    private flushBuffer() {
        if (this.weaponBuffer.length === 0) return;

        const chunk = [...this.weaponBuffer];
        this.weaponBuffer = [];
        this.lastFlushTime = Date.now();
        this.weapons.update((current) => [...current, ...chunk]);
    }

    // Private signals for processing
    private filteredWeaponsSig = computed(() => {
        const weapons = this.weapons();
        const term = this.searchTerm();
        const filters = this.advancedFilters();

        return weapons.filter(
            (w) =>
                this.matchesSearch(w, term) && this.matchesFilters(w, filters),
        );
    });

    // Public computed signals
    readonly filteredWeapons = computed(() => {
        const filtered = this.filteredWeaponsSig();
        const sort = this.sortState();

        // Apply sorting if active
        if (sort.columnKey && sort.direction) {
            return this.sortWeapons(filtered, sort.columnKey, sort.direction);
        }

        return filtered;
    });

    readonly weaponsSig = this.weapons.asReadonly();
    readonly loadingSig = this.loading.asReadonly();
    readonly errorSig = this.error.asReadonly();
    readonly visibleColumnsSig = this._visibleColumns.asReadonly();
    readonly sortStateSig = this.sortState.asReadonly();

    /** Scan weapons from game directory */
    async scanWeapons(
        gamePath: string,
        directory?: string,
        append: boolean = false,
    ): Promise<Weapon[]> {
        // Prevent duplicate scans if not appending
        if (this.loading() && !append) {
            return [];
        }

        if (!append) {
            this.loading.set(true);
            this.error.set(null);
            this.weapons.set([]);
            this.weaponBuffer = [];
        }

        this.currentRequestId = crypto.randomUUID();
        const onEvent = new Channel<any>();
        const collectedWeapons: Weapon[] = [];

        const debugScan = localStorage.getItem('rwr.debug.scan') === '1';
        if (debugScan) {
            console.log('[WeaponService] scanWeapons start', {
                gamePath,
                directory,
                append,
                requestId: this.currentRequestId,
            });
        }

        return new Promise<Weapon[]>((resolve, reject) => {
            let settled = false;

            const finish = () => {
                if (settled) return;
                settled = true;
                this.flushBuffer();
                this.loading.set(false);
                resolve(collectedWeapons);
            };

            const fail = (e: unknown) => {
                if (settled) return;
                settled = true;
                this.loading.set(false);
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
                            '[WeaponService] channel event (unrecognized)',
                            raw,
                        );
                    }
                    return;
                }

                const { event: eventType, data } = msg;
                if (debugScan) {
                    console.log('[WeaponService] channel event', {
                        eventType,
                        dataLen: Array.isArray(data) ? data.length : undefined,
                    });
                }

                if (eventType === 'chunk') {
                    collectedWeapons.push(...data);
                    if (this.worker) {
                        try {
                            this.worker.postMessage({
                                type: 'PROCESS_WEAPONS',
                                payload: data,
                                requestId: this.currentRequestId,
                            });
                        } catch (e) {
                            console.error(
                                '[WeaponService] Worker postMessage failed, falling back:',
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

            invoke<WeaponScanResult>('scan_weapons_collect', {
                gamePath,
                game_path: gamePath,
                directory: directory || null,
            })
                .then(async (result) => {
                    const CHUNK_SIZE = 200;
                    for (
                        let i = 0;
                        i < result.weapons.length;
                        i += CHUNK_SIZE
                    ) {
                        const chunk = result.weapons.slice(i, i + CHUNK_SIZE);
                        collectedWeapons.push(...chunk);

                        if (this.worker) {
                            try {
                                this.worker.postMessage({
                                    type: 'PROCESS_WEAPONS',
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
                        'weapons.scanError',
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
    async batchScanWeapons(paths: string[]): Promise<Weapon[]> {
        if (paths.length === 0) return [];

        this.loading.set(true);
        this.error.set(null);
        this.weapons.set([]);
        this.weaponBuffer = [];

        const allWeapons: Weapon[] = [];
        for (const path of paths) {
            try {
                const weapons = await this.scanWeapons(path, path, true);
                allWeapons.push(...weapons);
            } catch (e) {
                console.error(`Batch scan failed for ${path}:`, e);
            }
        }

        this.loading.set(false);
        return allWeapons;
    }

    /** Clear weapons */
    clearWeapons(): void {
        this.weapons.set([]);
    }

    /** Refresh weapons using stored game path */
    async refreshWeapons(
        gamePath: string,
        directory?: string,
    ): Promise<Weapon[]> {
        return await this.scanWeapons(gamePath, directory);
    }

    /** Update search term */
    setSearchTerm(term: string): void {
        this.searchTerm.set(term);
    }

    /** Update advanced filters */
    setAdvancedFilters(filters: AdvancedFilters): void {
        this.advancedFilters.set(filters);
    }

    /** Clear all filters */
    clearFilters(): void {
        this.searchTerm.set('');
        this.advancedFilters.set({});
    }

    /** Set column visibility */
    setColumnVisibility(columns: ColumnVisibility[]): void {
        this._visibleColumns.set(columns);
        try {
            localStorage.setItem(
                'weapons.column.visibility',
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

    /** Get weapon details by key */
    getWeaponDetails(weaponKey: string): Weapon | undefined {
        return this.weapons().find((w) => w.key === weaponKey);
    }

    /**
     * Get icon URL for a weapon using Tauri's convertFileSrc
     */
    async getIconUrl(weapon: Weapon): Promise<string> {
        if (!weapon.hudIcon) return '';
        try {
            const iconPath = await invoke<string>('get_texture_path', {
                weaponFilePath: weapon.sourceFile,
                iconFilename: weapon.hudIcon,
            });
            return convertFileSrc(iconPath);
        } catch {
            return '';
        }
    }

    private matchesSearch(weapon: Weapon, term: string): boolean {
        if (!term) return true;
        const lowerTerm = term.toLowerCase();
        return (
            weapon.name.toLowerCase().includes(lowerTerm) ||
            (weapon.key?.toLowerCase().includes(lowerTerm) ?? false) ||
            (weapon.tag?.toLowerCase().includes(lowerTerm) ?? false)
        );
    }

    private matchesFilters(weapon: Weapon, filters: AdvancedFilters): boolean {
        if (filters.damage) {
            const dmg = weapon.killProbability;
            if (dmg < filters.damage.min || dmg > filters.damage.max)
                return false;
        }
        if (filters.fireRate) {
            const rate = weapon.retriggerTime;
            if (rate < filters.fireRate.min || rate > filters.fireRate.max)
                return false;
        }
        if (filters.magazineSize) {
            const mag = weapon.magazineSize;
            if (
                mag < filters.magazineSize.min ||
                mag > filters.magazineSize.max
            )
                return false;
        }
        if (filters.encumbrance) {
            const enc = weapon.encumbrance ?? 0;
            if (enc < filters.encumbrance.min || enc > filters.encumbrance.max)
                return false;
        }
        if (filters.price) {
            const price = weapon.price ?? 0;
            if (price < filters.price.min || price > filters.price.max)
                return false;
        }
        if (filters.tag && weapon.tag !== filters.tag) return false;
        if (
            filters.suppressed !== undefined &&
            weapon.suppressed !== filters.suppressed
        )
            return false;
        if (
            filters.canRespawnWith !== undefined &&
            weapon.canRespawnWith !== filters.canRespawnWith
        )
            return false;
        return true;
    }

    private sortWeapons(
        weapons: Weapon[],
        columnKey: string,
        direction: 'asc' | 'desc',
    ): Weapon[] {
        const indexed = weapons.map((w, i) => ({
            weapon: w,
            originalIndex: i,
        }));
        indexed.sort((a, b) => {
            const comparison = this.compareValues(
                a.weapon[columnKey as keyof Weapon],
                b.weapon[columnKey as keyof Weapon],
            );
            const result = direction === 'asc' ? comparison : -comparison;
            return result !== 0 ? result : a.originalIndex - b.originalIndex;
        });
        return indexed.map((item) => item.weapon);
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
            const stored = localStorage.getItem('weapons.column.visibility');
            if (stored) return JSON.parse(stored);
        } catch {
            /* ignore */
        }
        return [
            { columnId: 'key', visible: true, order: 0 },
            { columnId: 'name', visible: true, order: 1 },
            { columnId: 'tag', visible: true, order: 2 },
            { columnId: 'magazineSize', visible: true, order: 3 },
            { columnId: 'killProbability', visible: true, order: 4 },
            { columnId: 'retriggerTime', visible: true, order: 5 },
        ];
    }
}
