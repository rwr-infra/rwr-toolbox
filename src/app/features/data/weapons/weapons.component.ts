import { Component, inject, computed, signal, OnInit } from '@angular/core';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { invoke } from '@tauri-apps/api/core';
import { LucideAngularModule } from 'lucide-angular';
import { WeaponService } from './services/weapon.service';
import { DirectoryService } from '../../settings/services/directory.service';
import { Weapon, AdvancedFilters } from '../../../shared/models/weapons.models';
import { WEAPON_COLUMNS } from './weapon-columns';
import { ScrollingModeService } from '../../shared/services/scrolling-mode.service';
import type { PaginationState } from '../../../shared/models/common.models';

/**
 * Weapons table component with search, filters, and column visibility
 * Feature: 001-weapons-directory-scanner
 * Uses Angular v20 Signals pattern
 */
@Component({
    selector: 'app-weapons',
    imports: [TranslocoPipe, LucideAngularModule],
    templateUrl: './weapons.component.html',
    styleUrl: './weapons.component.scss',
})
export class WeaponsComponent implements OnInit {
    private weaponService = inject(WeaponService);
    private directoryService = inject(DirectoryService);
    private transloco = inject(TranslocoService);
    private scrollingModeService = inject(ScrollingModeService);

    // Readonly signals from service
    readonly weapons = this.weaponService.filteredWeapons;
    readonly loading = this.weaponService.loadingSig;
    readonly error = this.weaponService.errorSig;
    readonly visibleColumns = this.weaponService.visibleColumnsSig;
    readonly sortState = this.weaponService.sortStateSig;

    // UI state signals
    readonly searchTerm = signal<string>('');
    readonly selectedClassTag = signal<string | undefined>(undefined);
    readonly showAdvancedSearch = signal<boolean>(false);
    readonly advancedFilters = signal<AdvancedFilters>({});
    readonly selectedWeapon = signal<Weapon | null>(null);
    readonly showWeaponDetails = signal<boolean>(false);

    // T056: Pagination state signal (100 items per page)
    readonly pagination = signal<
        Pick<PaginationState, 'currentPage' | 'pageSize'>
    >({
        currentPage: 1,
        pageSize: 100,
    });

    // Table columns
    readonly columns = WEAPON_COLUMNS;

    // Page size options
    readonly pageSizeOptions = [25, 50, 100, 200];

    // Computed signals
    readonly weaponCount = computed(() => this.weapons().length);
    readonly hasError = computed(() => this.error() !== null);
    readonly availableClassTags = computed(() => {
        const tags = new Set<string>();
        this.weaponService.weaponsSig().forEach((w) => {
            if (w.classTag) tags.add(w.classTag);
        });
        return Array.from(tags).sort();
    });

    readonly isTableOnlyMode = computed(() =>
        this.scrollingModeService.isTableOnlyMode(),
    );

    // T057: Pagination computed signals
    readonly totalItems = computed(() => this.weapons().length);
    readonly totalPages = computed(
        () => Math.ceil(this.totalItems() / this.pagination().pageSize) || 1,
    );

    // T058: Paginated weapons signal (only render current page)
    readonly paginatedWeapons = computed(() => {
        const filtered = this.weapons();
        const { currentPage, pageSize } = this.pagination();
        const start = (currentPage - 1) * pageSize;
        const end = start + pageSize;
        return filtered.slice(start, end);
    });

    constructor() {
        // Load column visibility from localStorage on init
        this.weaponService.setColumnVisibility(
            this.weaponService.getColumnVisibility(),
        );

        // Load page size from localStorage
        const savedPageSize = localStorage.getItem('weapons-page-size');
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
        // Load weapons on component init
        this.loadWeapons();
    }

    /** Load weapons from game directory */
    async loadWeapons(): Promise<void> {
        // T026: Get first valid scan directory from DirectoryService
        const directories = this.directoryService.directoriesSig();
        const firstValidDirectory = directories.find(
            (d) => d.status === 'valid',
        );

        if (!firstValidDirectory) {
            const errorMsg = this.transloco.translate(
                'weapons.errors.noGamePath',
            );
            this.weaponService['error'].set(errorMsg);
            return;
        }

        await this.weaponService.scanWeapons(
            firstValidDirectory.path,
            firstValidDirectory.path,
        );
    }

    /** Handle search input */
    onSearch(term: string): void {
        this.searchTerm.set(term);
        this.weaponService.setSearchTerm(term);
        // T066: Reset pagination to page 1 on search
        this.pagination.update((p) => ({ ...p, currentPage: 1 }));
    }

    /** Handle classTag filter change */
    onClassTagFilter(classTag: string): void {
        this.selectedClassTag.set(classTag || undefined);
        // T067: Reset pagination to page 1 on filter change
        this.pagination.update((p) => ({ ...p, currentPage: 1 }));
        this.updateAdvancedFilters();
    }

    /** Update advanced filters with current classTag selection */
    private updateAdvancedFilters(): void {
        const filters: AdvancedFilters = {
            ...this.advancedFilters(),
            classTag: this.selectedClassTag(),
        };
        this.advancedFilters.set(filters); // Also update local signal
        this.weaponService.setAdvancedFilters(filters);
        // T067: Reset pagination to page 1 on filter change
        this.pagination.update((p) => ({ ...p, currentPage: 1 }));
    }

    /** Toggle advanced search panel */
    toggleAdvancedSearch(): void {
        this.showAdvancedSearch.update((v) => !v);
    }

    /** Handle advanced filters change */
    onAdvancedFiltersChange(filters: AdvancedFilters): void {
        this.advancedFilters.set(filters);
        this.weaponService.setAdvancedFilters(filters);
        // T067: Reset pagination to page 1 on filter change
        this.pagination.update((p) => ({ ...p, currentPage: 1 }));
    }

    /** Handle range filter input change */
    onRangeFilter(
        field: keyof AdvancedFilters,
        type: 'min' | 'max',
        value: string,
    ): void {
        const numValue = value ? parseFloat(value) : undefined;
        const current = this.advancedFilters();
        const range = current[field] as
            | { min?: number; max?: number }
            | undefined;

        if (!range) {
            // Initialize range if it doesn't exist
            this.advancedFilters.update((filters) => ({
                ...filters,
                [field]: type === 'min' ? { min: numValue } : { max: numValue },
            }));
        } else {
            // Update existing range
            this.advancedFilters.update((filters) => ({
                ...filters,
                [field]: {
                    ...range,
                    [type]: numValue,
                },
            }));
        }

        this.weaponService.setAdvancedFilters(this.advancedFilters());
    }

    /** Handle exact filter checkbox change */
    onExactFilter(
        field: 'suppressed' | 'canRespawnWith',
        value: boolean | undefined,
    ): void {
        this.advancedFilters.update((filters) => ({
            ...filters,
            [field]: value,
        }));
        this.weaponService.setAdvancedFilters(this.advancedFilters());
    }

    /** Clear all filters */
    onClearFilters(): void {
        this.searchTerm.set('');
        this.selectedClassTag.set(undefined);
        this.advancedFilters.set({});
        this.weaponService.clearFilters();
    }

    /** Toggle column visibility */
    onColumnToggle(columnId: string): void {
        const current = this.visibleColumns();
        const updated = current.map((col) =>
            col.columnId === columnId ? { ...col, visible: !col.visible } : col,
        );
        this.weaponService.setColumnVisibility(updated);
    }

    /** Handle column header click - cycle through sort states */
    onColumnClick(columnKey: string): void {
        const current = this.sortState();
        let newDirection: 'asc' | 'desc' | null;

        if (current.columnKey === columnKey) {
            // Same column: cycle asc -> desc -> unsorted
            if (current.direction === 'asc') {
                newDirection = 'desc';
            } else if (current.direction === 'desc') {
                newDirection = null;
            } else {
                newDirection = 'asc';
            }
        } else {
            // New column: start with asc
            newDirection = 'asc';
        }

        this.weaponService.setSortState({
            columnKey: newDirection ? columnKey : null,
            direction: newDirection,
        });
        // T068: Reset pagination to page 1 on sort change
        this.pagination.update((p) => ({ ...p, currentPage: 1 }));
    }

    /** Get sort direction for a column */
    getColumnSortDirection(columnKey: string): 'asc' | 'desc' | null {
        const current = this.sortState();
        return current.columnKey === columnKey ? current.direction : null;
    }

    /** Refresh weapons from game directory */
    async onRefresh(): Promise<void> {
        // T026: Get first valid scan directory from DirectoryService
        const directories = this.directoryService.directoriesSig();
        const firstValidDirectory = directories.find(
            (d) => d.status === 'valid',
        );

        if (!firstValidDirectory) {
            const errorMsg = this.transloco.translate(
                'weapons.errors.noGamePath',
            );
            this.weaponService['error'].set(errorMsg);
            return;
        }

        await this.weaponService.refreshWeapons(
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
        localStorage.setItem('weapons-page-size', String(newSize));
    }

    /** Handle weapon row click - show details */
    onRowClick(weapon: Weapon): void {
        this.selectedWeapon.set(weapon);
        this.showWeaponDetails.set(true);
    }

    /** Close weapon details modal */
    closeWeaponDetails(): void {
        this.showWeaponDetails.set(false);
        // Don't immediately clear selectedWeapon to allow animation
        setTimeout(() => {
            if (!this.showWeaponDetails()) {
                this.selectedWeapon.set(null);
            }
        }, 300);
    }

    /** Open weapon file in default editor */
    async onOpenInEditor(weapon: Weapon): Promise<void> {
        try {
            await invoke('open_file_in_editor', {
                filePath: weapon.sourceFile,
            });
        } catch (error) {
            console.error('Failed to open file:', error);
            const errorMsg = this.transloco.translate(
                'weapons.errors.openFileFailed',
                {
                    file: weapon.filePath,
                },
            );
            this.weaponService['error'].set(errorMsg);
        }
    }

    /** Copy file path to clipboard */
    async onCopyPath(weapon: Weapon): Promise<void> {
        try {
            await navigator.clipboard.writeText(weapon.sourceFile);
            // Show success feedback (optional - could add a toast notification)
        } catch (error) {
            console.error('Failed to copy path:', error);
            const errorMsg = this.transloco.translate(
                'weapons.errors.copyPathFailed',
                {
                    file: weapon.filePath,
                },
            );
            this.weaponService['error'].set(errorMsg);
        }
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

    /** Check if a column is visible */
    isColumnVisible(columnKey: string): boolean {
        const col = this.visibleColumns().find((c) => c.columnId === columnKey);
        return col ? col.visible : true;
    }

    /** Check if column toggle should be disabled (last column protection) */
    isColumnDisabled(columnKey: string): boolean {
        const col = this.columns.find((c) => c.key === columnKey);
        if (col?.alwaysVisible) return true;
        const visibleCount = this.visibleColumns().filter(
            (c) => c.visible,
        ).length;
        const isCurrentlyVisible = this.isColumnVisible(columnKey);
        return visibleCount <= 1 && isCurrentlyVisible;
    }

    /** T063: Handle page changes */
    onPageChange(page: number): void {
        this.pagination.update((p) => ({ ...p, currentPage: page }));
    }

    /** T064: Get page numbers for pagination */
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

    /** T065: Get display range for pagination stats */
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
