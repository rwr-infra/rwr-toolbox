import { Component, inject, computed, signal, OnInit } from '@angular/core';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { LucideAngularModule } from 'lucide-angular';
import { ItemService, ItemFilters } from './services/item.service';
import { DirectoryService } from '../../settings/services/directory.service';
import { GenericItem, getItemSlot } from '../../../shared/models/items.models';
import { ITEM_COLUMNS } from './item-columns';
import { ScrollingModeService } from '../../shared/services/scrolling-mode.service';
import type { PaginationState } from '../../../shared/models/common.models';

/**
 * Items table component with search, filters, column visibility, and sorting
 * Feature: 002-table-enhancements
 * Uses Angular v20 Signals pattern
 * Mirrors WeaponsComponent structure for consistency
 */
@Component({
    selector: 'app-items',
    imports: [TranslocoPipe, LucideAngularModule],
    templateUrl: './items.component.html',
    styleUrl: './items.component.scss',
})
export class ItemsComponent implements OnInit {
    private itemService = inject(ItemService);
    private directoryService = inject(DirectoryService);
    private transloco = inject(TranslocoService);
    private scrollingModeService = inject(ScrollingModeService);

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

    // T071: Pagination state signal (100 items per page)
    readonly pagination = signal<
        Pick<PaginationState, 'currentPage' | 'pageSize'>
    >({
        currentPage: 1,
        pageSize: 100,
    });

    // Table columns
    readonly columns = ITEM_COLUMNS;

    // Page size options
    readonly pageSizeOptions = [25, 50, 100, 200];

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

    readonly isTableOnlyMode = computed(() =>
        this.scrollingModeService.isTableOnlyMode(),
    );

    // T072: Pagination computed signals
    readonly totalItems = computed(() => this.items().length);
    readonly totalPages = computed(
        () => Math.ceil(this.totalItems() / this.pagination().pageSize) || 1,
    );

    // T073: Paginated items signal (only render current page)
    readonly paginatedItems = computed(() => {
        const filtered = this.items();
        const { currentPage, pageSize } = this.pagination();
        const start = (currentPage - 1) * pageSize;
        const end = start + pageSize;
        return filtered.slice(start, end);
    });

    constructor() {
        // Load column visibility from localStorage on init
        this.itemService.setColumnVisibility(
            this.itemService.getColumnVisibility(),
        );

        // Load page size from localStorage
        const savedPageSize = localStorage.getItem('items-page-size');
        if (savedPageSize) {
            const parsedSize = parseInt(savedPageSize, 10);
            if (
                !isNaN(parsedSize) &&
                this.pageSizeOptions.includes(parsedSize)
            ) {
                this.pagination.set({
                    currentPage: 1,
                    pageSize: parsedSize,
                });
            }
        }
    }

    toggleScrollingMode(): void {
        const newMode = this.isTableOnlyMode() ? 'full-page' : 'table-only';
        this.scrollingModeService.setMode(newMode);
    }

    ngOnInit(): void {
        // Load items on component init
        this.loadItems();
    }

    /** Load items from game directory */
    async loadItems(): Promise<void> {
        // T027: Get first valid scan directory from DirectoryService
        const directories = this.directoryService.directoriesSig();
        const firstValidDirectory = directories.find(
            (d) => d.status === 'valid',
        );

        if (!firstValidDirectory) {
            const errorMsg = this.transloco.translate(
                'items.errors.noGamePath',
            );
            this.itemService['error'].set(errorMsg);
            return;
        }

        await this.itemService.scanItems(
            firstValidDirectory.path,
            firstValidDirectory.path,
        );
    }

    /** Handle search input */
    onSearch(term: string): void {
        this.searchTerm.set(term);
        this.itemService.setSearchTerm(term);
        // T077: Reset pagination to page 1 on search
        this.pagination.update((p) => ({ ...p, currentPage: 1 }));
    }

    /** Handle itemType filter change */
    onItemTypeFilter(itemType: string): void {
        this.selectedItemType.set(itemType || undefined);
        // T077: Reset pagination to page 1 on filter change
        this.pagination.update((p) => ({ ...p, currentPage: 1 }));
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
        // T077: Reset pagination to page 1 on filter change
        this.pagination.update((p) => ({ ...p, currentPage: 1 }));
    }

    /** Toggle advanced search panel */
    toggleAdvancedSearch(): void {
        this.showAdvancedSearch.update((v) => !v);
    }

    /** Handle filters change */
    onFiltersChange(filters: ItemFilters): void {
        this.filters.set(filters);
        this.itemService.setFilters(filters);
        // T077: Reset pagination to page 1 on filter change
        this.pagination.update((p) => ({ ...p, currentPage: 1 }));
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
        // T078: Reset pagination to page 1 on sort change
        this.pagination.update((p) => ({ ...p, currentPage: 1 }));
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
        // T027: Get first valid scan directory from DirectoryService
        const directories = this.directoryService.directoriesSig();
        const firstValidDirectory = directories.find(
            (d) => d.status === 'valid',
        );

        if (!firstValidDirectory) {
            const errorMsg = this.transloco.translate(
                'items.errors.noGamePath',
            );
            this.itemService['error'].set(errorMsg);
            return;
        }

        await this.itemService.refreshItems(
            firstValidDirectory.path,
            firstValidDirectory.path,
        );
    }

    /** Handle page size dropdown change */
    onPageSizeChange(event: Event): void {
        const value = (event.target as HTMLSelectElement).value;
        const newSize = parseInt(value, 10);
        this.pagination.update((p) => ({
            ...p,
            pageSize: newSize,
            currentPage: 1, // Reset to page 1
        }));
        localStorage.setItem('items-page-size', String(newSize));
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
            field === 'sourceDirectory' ||
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
    }

    /** Copy file path to clipboard */
    async onCopyPath(item: GenericItem): Promise<void> {
        try {
            await navigator.clipboard.writeText(item.sourceFile);
        } catch (error) {
            console.error('Failed to copy path:', error);
        }
    }

    /** T079: Handle page changes */
    onPageChange(page: number): void {
        this.pagination.update((p) => ({ ...p, currentPage: page }));
    }

    /** T079: Get page numbers for pagination */
    getPageNumbers(): number[] {
        const totalPages = this.totalPages();
        const currentPage = this.pagination().currentPage;
        const pages: number[] = [];

        if (totalPages <= 7) {
            for (let i = 1; i <= totalPages; i++) {
                pages.push(i);
            }
        } else {
            // Always show first page
            pages.push(1);

            if (currentPage > 3) {
                pages.push(-1); // Ellipsis
            }

            const start = this.max(2, currentPage - 1);
            const end = this.min(totalPages - 1, currentPage + 1);

            for (let i = start; i <= end; i++) {
                pages.push(i);
            }

            if (currentPage < totalPages - 2) {
                pages.push(-1); // Ellipsis
            }

            // Always show last page
            if (totalPages > 1) {
                pages.push(totalPages);
            }
        }

        return pages;
    }

    /** T079: Get display range for pagination stats */
    getDisplayRange(): { start: number; end: number } {
        const { currentPage, pageSize } = this.pagination();
        const totalItems = this.totalItems();
        const start = (currentPage - 1) * pageSize + 1;
        const end = this.min(currentPage * pageSize, totalItems);
        return { start, end };
    }

    private min(a: number, b: number): number {
        return a < b ? a : b;
    }

    private max(a: number, b: number): number {
        return a > b ? a : b;
    }
}
