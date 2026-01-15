import { Component, inject, computed, signal, OnInit } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { ItemService, ItemFilters } from './services/item.service';
import { SettingsService } from '../../../core/services/settings.service';
import { GenericItem, getItemSlot } from '../../../shared/models/items.models';
import { ITEM_COLUMNS } from './item-columns';

/**
 * Items table component with search, filters, column visibility, and sorting
 * Feature: 002-table-enhancements
 * Uses Angular v20 Signals pattern
 * Mirrors WeaponsComponent structure for consistency
 */
@Component({
    selector: 'app-items',
    imports: [TranslocoPipe],
    templateUrl: './items.component.html',
    styleUrl: './items.component.scss',
})
export class ItemsComponent implements OnInit {
    private itemService = inject(ItemService);
    private settingsService = inject(SettingsService);

    // Readonly signals from service
    readonly items = this.itemService.filteredItems;
    readonly loading = this.itemService.loadingSig;
    readonly error = this.itemService.errorSig;
    readonly visibleColumns = this.itemService.visibleColumnsSig;
    readonly sortState = this.itemService.sortStateSig;

    // UI state signals
    readonly searchTerm = signal<string>('');
    readonly selectedItemType = signal<string | undefined>(undefined);
    readonly showAdvancedSearch = signal<boolean>(false);
    readonly filters = signal<ItemFilters>({});
    readonly selectedItem = signal<GenericItem | null>(null);
    readonly showItemDetails = signal<boolean>(false);

    // Table columns
    readonly columns = ITEM_COLUMNS;

    // Computed signals
    readonly itemCount = computed(() => this.items().length);
    readonly hasError = computed(() => this.error() !== null);
    readonly availableItemTypes = computed(() => {
        const types = new Set<string>();
        this.itemService.itemsSig().forEach((i) => {
            types.add(i.itemType);
        });
        return Array.from(types).sort();
    });

    constructor() {
        // Load column visibility from localStorage on init
        this.itemService.setColumnVisibility(
            this.itemService.getColumnVisibility(),
        );
    }

    ngOnInit(): void {
        // Load items on component init
        this.loadItems();
    }

    /** Load items from game directory */
    async loadItems(): Promise<void> {
        const gamePath = this.settingsService.getGamePath();
        if (!gamePath) {
            this.itemService['error'].set('items.errors.noGamePath');
            return;
        }
        await this.itemService.scanItems(gamePath);
    }

    /** Handle search input */
    onSearch(term: string): void {
        this.searchTerm.set(term);
        this.itemService.setSearchTerm(term);
    }

    /** Handle itemType filter change */
    onItemTypeFilter(itemType: string): void {
        this.selectedItemType.set(itemType || undefined);
        this.updateFilters();
    }

    /** Update filters with current itemType selection */
    private updateFilters(): void {
        const currentFilters = this.filters();
        const updated: ItemFilters = {
            ...currentFilters,
            itemType: (this.selectedItemType() || undefined) as
                | 'carry_item'
                | 'visual_item'
                | undefined,
        };
        this.filters.set(updated);
        this.itemService.setFilters(updated);
    }

    /** Toggle advanced search panel */
    toggleAdvancedSearch(): void {
        this.showAdvancedSearch.update((v) => !v);
    }

    /** Handle filters change */
    onFiltersChange(filters: ItemFilters): void {
        this.filters.set(filters);
        this.itemService.setFilters(filters);
    }

    /** Handle range filter input change */
    onRangeFilter(
        field: 'encumbrance' | 'price',
        type: 'min' | 'max',
        value: string,
    ): void {
        const numValue = value ? parseFloat(value) : undefined;
        const current = this.filters();
        const range = current[field] as
            | { min?: number; max?: number }
            | undefined;

        if (!range) {
            this.filters.update((f) => ({
                ...f,
                [field]: type === 'min' ? { min: numValue } : { max: numValue },
            }));
        } else {
            this.filters.update((f) => ({
                ...f,
                [field]: {
                    ...range,
                    [type]: numValue,
                },
            }));
        }

        this.itemService.setFilters(this.filters());
    }

    /** Handle exact filter checkbox change */
    onExactFilter(
        field: 'canRespawnWith' | 'inStock',
        value: boolean | undefined,
    ): void {
        this.filters.update((f) => ({
            ...f,
            [field]: value,
        }));
        this.itemService.setFilters(this.filters());
    }

    /** Clear all filters */
    onClearFilters(): void {
        this.searchTerm.set('');
        this.selectedItemType.set(undefined);
        this.filters.set({});
        this.itemService.clearFilters();
    }

    /** Toggle column visibility */
    onColumnToggle(columnId: string): void {
        const current = this.visibleColumns();
        const updated = current.map((col) =>
            col.columnId === columnId ? { ...col, visible: !col.visible } : col,
        );
        this.itemService.setColumnVisibility(updated);
    }

    /** Handle column header click - cycle through sort states */
    onColumnClick(columnKey: string): void {
        const current = this.sortState();
        let newDirection: 'asc' | 'desc' | null;

        if (current.columnKey === columnKey) {
            if (current.direction === 'asc') {
                newDirection = 'desc';
            } else if (current.direction === 'desc') {
                newDirection = null;
            } else {
                newDirection = 'asc';
            }
        } else {
            newDirection = 'asc';
        }

        this.itemService.setSortState({
            columnKey: newDirection ? columnKey : null,
            direction: newDirection,
        });
    }

    /** Get sort direction for a column */
    getColumnSortDirection(columnKey: string): 'asc' | 'desc' | null {
        const current = this.sortState();
        return current.columnKey === columnKey ? current.direction : null;
    }

    /** Check if a column is visible */
    isColumnVisible(columnKey: string): boolean {
        const col = this.visibleColumns().find((c) => c.columnId === columnKey);
        return col ? col.visible : true;
    }

    /** Check if column toggle should be disabled */
    isColumnDisabled(columnKey: string): boolean {
        const col = this.columns.find((c) => c.key === columnKey);
        if (col?.alwaysVisible) return true;
        const visibleCount = this.visibleColumns().filter(
            (c) => c.visible,
        ).length;
        const isCurrentlyVisible = this.isColumnVisible(columnKey);
        return visibleCount <= 1 && isCurrentlyVisible;
    }

    /** Get visible columns for display */
    getVisibleColumns() {
        const visibilityMap = new Map(
            this.visibleColumns().map((c) => [c.columnId, c.visible]),
        );
        return this.columns.filter(
            (col) => visibilityMap.get(col.key) !== false,
        );
    }

    /** Refresh items from game directory */
    async onRefresh(): Promise<void> {
        const gamePath = this.settingsService.getGamePath();
        if (!gamePath) {
            this.itemService['error'].set('items.errors.noGamePath');
            return;
        }
        await this.itemService.refreshItems(gamePath);
    }

    /** Get column value safely for display */
    getColumnValue(item: GenericItem, field: string): unknown {
        // Handle special cases for type-specific fields
        if (field === 'slot') {
            return getItemSlot(item) ?? '';
        }
        // Use type assertion for common fields
        if (
            field === 'key' ||
            field === 'name' ||
            field === 'itemType' ||
            field === 'filePath' ||
            field === 'packageName' ||
            field === 'encumbrance' ||
            field === 'price' ||
            field === 'canRespawnWith' ||
            field === 'inStock'
        ) {
            return item[field as keyof GenericItem];
        }
        return '';
    }

    /** Get slot value for display (null-safe for VisualItem) */
    getItemSlotValue(): string | undefined {
        const item = this.selectedItem();
        return item ? getItemSlot(item) : undefined;
    }

    /** Handle item row click - show details */
    onRowClick(item: GenericItem): void {
        this.selectedItem.set(item);
        this.showItemDetails.set(true);
    }

    /** Close item details modal */
    closeItemDetails(): void {
        this.showItemDetails.set(false);
        setTimeout(() => {
            if (!this.showItemDetails()) {
                this.selectedItem.set(null);
            }
        }, 300);
    }

    /** Open item file in default editor */
    async onOpenInEditor(item: GenericItem): Promise<void> {
        // Will be implemented with Tauri command
        console.log('Open in editor:', item.sourceFile);
    }

    /** Copy file path to clipboard */
    async onCopyPath(item: GenericItem): Promise<void> {
        try {
            await navigator.clipboard.writeText(item.sourceFile);
            console.log('Copied path:', item.sourceFile);
        } catch (error) {
            console.error('Failed to copy path:', error);
        }
    }
}
