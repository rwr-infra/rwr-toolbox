import { Component, inject, computed, signal, effect } from '@angular/core';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { LucideAngularModule } from 'lucide-angular';
import { ItemService, ItemFilters } from './services/item.service';
import { DirectoryService } from '../../settings/services/directory.service';
import {
    GenericItem,
    getItemSlot,
    isCarryItem,
} from '../../../shared/models/items.models';
import { ITEM_COLUMNS } from './item-columns';
import { ScrollingModeService } from '../../shared/services/scrolling-mode.service';
import type { PaginationState } from '../../../shared/models/common.models';
import { animate, style, transition, trigger } from '@angular/animations';

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
    animations: [
        trigger('slideIn', [
            transition(':enter', [
                style({ transform: 'translateX(100%)' }),
                animate(
                    '300ms ease-out',
                    style({ transform: 'translateX(0)' }),
                ),
            ]),
            transition(':leave', [
                animate(
                    '250ms ease-in',
                    style({ transform: 'translateX(100%)' }),
                ),
            ]),
        ]),
    ],
})
export class ItemsComponent {
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

    // NEW: Detail view side panel state
    readonly isDetailPanelOpen = signal<boolean>(false);
    readonly detailPanelPosition = signal<'side' | 'overlay'>('side');

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

    // Feature 007: Icon mapping for item types
    readonly ITEM_ICONS: Record<string, string> = {
        // Medical items
        medkit: 'heart',
        bandage: 'heart',
        first_aid: 'heart',
        health: 'heart',

        // Protection
        armor: 'shield',
        helmet: 'shield',
        vest: 'shield',
        body_armor: 'shield',

        // Food/Consumables
        food: 'coffee',
        ration: 'coffee',
        drink: 'coffee',
        consumable: 'coffee',

        // Ammunition
        ammunition: 'package',
        ammo: 'package',
        magazine: 'package',
        bullet: 'package',

        // Explosives
        grenade: 'sparkles',
        explosive: 'sparkles',
        c4: 'sparkles',
        rocket: 'sparkles',

        // Equipment/Tools
        tool: 'wrench',
        radio: 'radio',
        equipment: 'wrench',
    };

    // Image URL cache: item.key -> image URL
    readonly itemIconUrls = signal<Map<string, string>>(new Map());

    // Bug fix: Track if we've already attempted loading to avoid duplicate load attempts
    private hasAttemptedLoad = signal<boolean>(false);

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
        console.log('filtered paginatedItems', filtered);
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

        // T004: Auto-load images when paginated items change
        effect(() => {
            const items = this.paginatedItems();
            for (const item of items) {
                this.loadItemIcon(item);
            }
        });

        // Bug fix: Auto-load items when valid directories become available after initialization
        effect(() => {
            // Ensure DirectoryService initialization is kicked off (it is idempotent).
            void this.directoryService.ensureInitialized();

            const initialized = this.directoryService.initializedSig();
            const validDirCount =
                this.directoryService.validDirectoryCountSig();
            const scanState = this.directoryService.scanProgressSig().state;
            const hasAttempted = this.hasAttemptedLoad();
            const hasItems = this.items().length > 0;

            // Only trigger load when:
            // 1. Service is initialized
            // 2. Valid directories are available
            // 3. Not currently running a multi-directory scan (avoid races/duplicate scans)
            // 3. Haven't attempted loading yet
            // 4. No items loaded yet
            if (
                initialized &&
                validDirCount > 0 &&
                scanState !== 'scanning' &&
                !hasAttempted &&
                !hasItems
            ) {
                console.log(
                    '[ItemsComponent] Auto-loading items on component mount...',
                );
                this.hasAttemptedLoad.set(true);
                this.loadItems();
            }
        });
    }

    toggleScrollingMode(): void {
        const newMode = this.isTableOnlyMode() ? 'full-page' : 'table-only';
        this.scrollingModeService.setMode(newMode);
    }

    /** Load items from game directory */
    async loadItems(): Promise<void> {
        // Bug fix: Skip loading if items are already loaded
        // Only load on first visit or when directories change
        if (this.items().length > 0) {
            console.log('[ItemsComponent] Items already loaded, skipping...');
            return;
        }

        // T004: Use selected directory or fall back to first valid directory
        const directory =
            this.directoryService.getSelectedDirectory() ||
            this.directoryService.getFirstValidDirectory();

        if (!directory) {
            // Bug fix: Don't set error if directories are still being validated or if service is not initialized yet
            const isAnyValidating = this.directoryService.isAnyValidatingSig();
            const initialized = this.directoryService.initializedSig();
            if (isAnyValidating || !initialized) {
                console.log(
                    '[ItemsComponent] Waiting for valid directories to become available...',
                );
                return;
            }
            const errorMsg = this.transloco.translate(
                'items.errors.noGamePath',
            );
            this.itemService['error'].set(errorMsg);
            return;
        }

        await this.itemService.scanItems(directory.path, directory.path);
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
        // T004: Use selected directory or fall back to first valid directory
        const directory =
            this.directoryService.getSelectedDirectory() ||
            this.directoryService.getFirstValidDirectory();

        if (!directory) {
            const errorMsg = this.transloco.translate(
                'items.errors.noGamePath',
            );
            this.itemService['error'].set(errorMsg);
            return;
        }

        await this.itemService.refreshItems(directory.path, directory.path);
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

    /** Load item icon URL and cache the result */
    async loadItemIcon(item: GenericItem): Promise<void> {
        const itemKey = item.key || '';
        // Only CarryItem has hudIcon
        if (
            item.itemType !== 'carry_item' ||
            !item.hudIcon ||
            this.itemIconUrls().has(itemKey)
        ) {
            return;
        }
        try {
            const url = await this.itemService.getIconUrl(item);
            if (url) {
                this.itemIconUrls.update((map) => {
                    const newMap = new Map(map);
                    newMap.set(itemKey, url);
                    return newMap;
                });
            }
        } catch {
            // Icon loading failed - silently skip
        }
    }

    /** Get cached icon URL for an item */
    getItemIconUrl(item: GenericItem): string {
        const itemKey = item.key || '';
        return this.itemIconUrls().get(itemKey) || '';
    }

    /** Handle image load error */
    onItemImageError(): void {
        // Image loading failed - silently ignore
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

    /** NEW: Select item and show side panel */
    selectItem(item: GenericItem): void {
        this.selectedItem.set(item);
        this.isDetailPanelOpen.set(true);
    }

    /** NEW: Close detail side panel */
    closeDetailPanel(): void {
        this.isDetailPanelOpen.set(false);
        this.selectedItem.set(null);
    }

    /** NEW: Select next item for keyboard navigation */
    selectNext(): void {
        const current = this.selectedItem();
        if (!current) return;

        const items = this.paginatedItems();
        const index = items.findIndex((i) => i.key === current.key);
        if (index < items.length - 1) {
            this.selectItem(items[index + 1]);
        }
    }

    /** NEW: Select previous item for keyboard navigation */
    selectPrevious(): void {
        const current = this.selectedItem();
        if (!current) return;

        const items = this.paginatedItems();
        const index = items.findIndex((i) => i.key === current.key);
        if (index > 0) {
            this.selectItem(items[index - 1]);
        }
    }

    /** Feature 007: Get icon name for item type (for detail panel display) */
    getIconForItemType(itemType: string): string {
        const icon = this.ITEM_ICONS[itemType];
        if (!icon) {
            console.warn(
                `[ItemsComponent] No icon mapping for item type: "${itemType}". Using fallback "box" icon.`,
            );
            return 'box';
        }
        return icon;
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

    /** Helper to get nested property value safely */
    getExtendedValue(item: GenericItem, path: string): string {
        const parts = path.split('.');
        let value: any = item;
        for (const part of parts) {
            value = value?.[part];
        }
        if (value === null || value === undefined) return '-';
        if (typeof value === 'number' && path.includes('commonness.value')) {
            return value.toFixed(2);
        }
        return String(value);
    }

    /** Helper to get boolean value for badge display */
    getBooleanBadge(item: GenericItem, path: string): 'true' | 'false' | null {
        const parts = path.split('.');
        let value: any = item;
        for (const part of parts) {
            value = value?.[part];
        }
        if (value === true) return 'true';
        if (value === false) return 'false';
        return null;
    }

    /** Helper to safely check if item has capacity */
    hasCapacity(item: GenericItem): boolean {
        return item.capacity !== null && item.capacity !== undefined;
    }

    /** Helper to safely check if item has commonness */
    hasCommonness(item: GenericItem): boolean {
        return item.commonness !== null && item.commonness !== undefined;
    }

    /** Helper to safely check if item has modifiers */
    hasModifiers(item: GenericItem): boolean {
        return (
            item.modifiers !== null &&
            item.modifiers !== undefined &&
            item.modifiers.length > 0
        );
    }

    /** Helper to safely get capacity */
    getCapacity(item: GenericItem): any {
        return item.capacity;
    }

    /** Helper to safely get commonness */
    getCommonness(item: GenericItem): any {
        return item.commonness;
    }

    /** Helper to safely get modifiers */
    getModifiers(item: GenericItem): any[] {
        return item.modifiers || [];
    }

    /** Helper to safely get transformOnConsume from CarryItem */
    getTransformOnConsume(item: GenericItem): string | undefined {
        return isCarryItem(item) ? item.transformOnConsume : undefined;
    }

    /** Helper to safely get timeToLive from CarryItem */
    getTimeToLive(item: GenericItem): number | undefined {
        return isCarryItem(item) ? item.timeToLive : undefined;
    }

    /** Helper to safely get draggable from CarryItem */
    getDraggable(item: GenericItem): boolean | undefined {
        return isCarryItem(item) ? item.draggable : undefined;
    }

    /** Type guard to check if item is a CarryItem (exposed for template) */
    readonly isCarryItem = isCarryItem;

    private min(a: number, b: number): number {
        return a < b ? a : b;
    }

    private max(a: number, b: number): number {
        return a > b ? a : b;
    }

    private escapeRegExp(text: string): string {
        return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    private escapeHtml(text: string): string {
        return text
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/\"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    /**
     * Highlight current search query inside text (case-insensitive).
     * Returns HTML string; all non-markup content is escaped.
     */
    highlight(text: string | null | undefined): string {
        const raw = (text ?? '').toString();
        if (!raw) return '-';

        const query = (this.searchTerm() ?? '').trim();
        if (!query) return this.escapeHtml(raw);

        const re = new RegExp(this.escapeRegExp(query), 'gi');
        let result = '';
        let lastIndex = 0;

        for (const match of raw.matchAll(re)) {
            const index = match.index ?? 0;
            const matched = match[0] ?? '';
            result += this.escapeHtml(raw.slice(lastIndex, index));
            result += `<span class="bg-yellow-200/70 text-base-content px-0.5 rounded-sm">${this.escapeHtml(matched)}</span>`;
            lastIndex = index + matched.length;
        }

        result += this.escapeHtml(raw.slice(lastIndex));
        return result || this.escapeHtml(raw);
    }
}
