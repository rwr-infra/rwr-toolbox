import { Injectable, signal, computed, inject } from '@angular/core';
import { invoke, convertFileSrc } from '@tauri-apps/api/core';
import { TranslocoService } from '@jsverse/transloco';
import {
    GenericItem,
    ItemScanResult,
} from '../../../../shared/models/items.models';
import { ColumnVisibility } from '../../../../shared/models/column.models';
import { SortState } from '../../../../shared/models/sort.models';

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
 * Mirrors the structure of WeaponService for consistency.
 */
@Injectable({ providedIn: 'root' })
export class ItemService {
    private transloco = inject(TranslocoService);

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

    // Public computed signals
    readonly filteredItems = computed(() => {
        const items = this.items();
        const term = this.searchTerm();
        const filters = this.filters();
        const sort = this.sortState();

        let filtered = items.filter(
            (i) =>
                this.matchesSearch(i, term) && this.matchesFilters(i, filters),
        );

        // Apply sorting if active
        if (sort.columnKey && sort.direction) {
            filtered = this.sortItems(filtered, sort.columnKey, sort.direction);
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
    ): Promise<GenericItem[]> {
        // Prevent duplicate scans if not appending
        if (this.loading() && !append) {
            return [];
        }

        if (!append) {
            this.loading.set(true);
            this.error.set(null);
        }

        try {
            const result = await invoke<ItemScanResult>('scan_items', {
                gamePath,
                directory: directory || null,
            });

            // Tag items with source directory for multi-directory support and generate unique IDs
            const itemsWithSource = result.items.map((i) => ({
                ...i,
                sourceDirectory: directory || gamePath,
                _id: crypto.randomUUID(),
                modifiers: i.modifiers?.map((m) => ({
                    ...m,
                    _id: crypto.randomUUID(),
                })),
            }));

            if (append) {
                this.items.set([...this.items(), ...itemsWithSource]);
            } else {
                this.items.set(itemsWithSource);
            }

            // Report errors if any
            if (result.errors.length > 0) {
                const errorMsg = this.transloco.translate('items.scanError', {
                    error: `${result.errors.length} files failed`,
                });
                this.error.set(errorMsg);
            }

            return itemsWithSource;
        } catch (e) {
            const errorMsg = this.transloco.translate('items.scanError', {
                error: String(e),
            });
            this.error.set(errorMsg);
            return [];
        } finally {
            if (!append) {
                this.loading.set(false);
            }
        }
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
        // Persist to localStorage
        try {
            localStorage.setItem(
                'items.column.visibility',
                JSON.stringify(columns),
            );
        } catch {
            // Ignore localStorage errors
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
     * @param item Item with hudIcon property
     * @returns Icon URL for use in <img> src attribute, or empty string if no icon
     */
    async getIconUrl(item: GenericItem): Promise<string> {
        // Only CarryItem has hudIcon
        if (item.itemType !== 'carry_item' || !item.hudIcon) {
            return '';
        }

        try {
            const iconPath = await invoke<string>('get_item_texture_path', {
                itemFilePath: item.sourceFile,
                iconFilename: item.hudIcon,
            });
            return convertFileSrc(iconPath);
        } catch {
            // Icon not found - silently return empty string
            return '';
        }
    }

    /** Check if item matches search term */
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

    /** Check if item matches filters */
    private matchesFilters(item: GenericItem, filters: ItemFilters): boolean {
        // Item type filter
        if (filters.itemType && item.itemType !== filters.itemType) {
            return false;
        }

        // Range filters
        if (filters.encumbrance) {
            const enc = item.encumbrance ?? 0;
            if (
                filters.encumbrance.min !== undefined &&
                enc < filters.encumbrance.min
            ) {
                return false;
            }
            if (
                filters.encumbrance.max !== undefined &&
                enc > filters.encumbrance.max
            ) {
                return false;
            }
        }

        if (filters.price) {
            const price = item.price ?? 0;
            if (filters.price.min !== undefined && price < filters.price.min) {
                return false;
            }
            if (filters.price.max !== undefined && price > filters.price.max) {
                return false;
            }
        }

        // Exact match filters
        if (
            filters.canRespawnWith !== undefined &&
            item.canRespawnWith !== filters.canRespawnWith
        ) {
            return false;
        }

        if (filters.inStock !== undefined && item.inStock !== filters.inStock) {
            return false;
        }

        return true;
    }

    /** Sort items by column with stable sort */
    private sortItems(
        items: GenericItem[],
        columnKey: string,
        direction: 'asc' | 'desc',
    ): GenericItem[] {
        // Create a copy with original indices for stable sort
        const indexed = items.map((i, idx) => ({
            item: i,
            originalIndex: idx,
        }));

        indexed.sort((a, b) => {
            const comparison = this.compareValues(
                a.item[columnKey as keyof GenericItem],
                b.item[columnKey as keyof GenericItem],
            );
            // Apply direction
            const result = direction === 'asc' ? comparison : -comparison;
            // Use original index as tiebreaker for stable sort
            return result !== 0 ? result : a.originalIndex - b.originalIndex;
        });

        return indexed.map((indexedItem) => indexedItem.item);
    }

    /** Compare two values for sorting with null-safe comparison */
    private compareValues(a: unknown, b: unknown): number {
        // Handle null/undefined
        if (a == null && b == null) return 0;
        if (a == null) return 1; // Nulls last
        if (b == null) return -1; // Nulls last

        // Number comparison
        if (typeof a === 'number' && typeof b === 'number') {
            return a - b;
        }

        // String comparison
        const aStr = String(a);
        const bStr = String(b);
        return aStr.localeCompare(bStr);
    }

    /** Get default column visibility */
    private getDefaultColumns(): ColumnVisibility[] {
        // Try to load from localStorage
        try {
            const stored = localStorage.getItem('items.column.visibility');
            if (stored) {
                return JSON.parse(stored) as ColumnVisibility[];
            }
        } catch {
            // Use defaults
        }

        // Default columns
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
