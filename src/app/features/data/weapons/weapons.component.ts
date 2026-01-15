import { Component, inject, computed, signal, OnInit } from '@angular/core';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { invoke } from '@tauri-apps/api/core';
import { WeaponService } from './services/weapon.service';
import { SettingsService } from '../../../core/services/settings.service';
import { Weapon, AdvancedFilters } from '../../../shared/models/weapons.models';
import { WEAPON_COLUMNS } from './weapon-columns';

/**
 * Weapons table component with search, filters, and column visibility
 * Feature: 001-weapons-directory-scanner
 * Uses Angular v20 Signals pattern
 */
@Component({
    selector: 'app-weapons',
    imports: [TranslocoPipe],
    templateUrl: './weapons.component.html',
    styleUrl: './weapons.component.scss',
})
export class WeaponsComponent implements OnInit {
    private weaponService = inject(WeaponService);
    private settingsService = inject(SettingsService);
    private transloco = inject(TranslocoService);

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

    // Table columns
    readonly columns = WEAPON_COLUMNS;

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

    constructor() {
        // Load column visibility from localStorage on init
        this.weaponService.setColumnVisibility(
            this.weaponService.getColumnVisibility(),
        );
    }

    ngOnInit(): void {
        // Load weapons on component init
        this.loadWeapons();
    }

    /** Load weapons from game directory */
    async loadWeapons(): Promise<void> {
        const gamePath = this.settingsService.getGamePath();
        if (!gamePath) {
            const errorMsg = this.transloco.translate(
                'weapons.errors.noGamePath',
            );
            this.weaponService['error'].set(errorMsg);
            return;
        }
        await this.weaponService.scanWeapons(gamePath);
    }

    /** Handle search input */
    onSearch(term: string): void {
        this.searchTerm.set(term);
        this.weaponService.setSearchTerm(term);
    }

    /** Handle classTag filter change */
    onClassTagFilter(classTag: string): void {
        this.selectedClassTag.set(classTag || undefined);
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
    }

    /** Toggle advanced search panel */
    toggleAdvancedSearch(): void {
        this.showAdvancedSearch.update((v) => !v);
    }

    /** Handle advanced filters change */
    onAdvancedFiltersChange(filters: AdvancedFilters): void {
        this.advancedFilters.set(filters);
        this.weaponService.setAdvancedFilters(filters);
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
    }

    /** Get sort direction for a column */
    getColumnSortDirection(columnKey: string): 'asc' | 'desc' | null {
        const current = this.sortState();
        return current.columnKey === columnKey ? current.direction : null;
    }

    /** Refresh weapons from game directory */
    async onRefresh(): Promise<void> {
        const gamePath = this.settingsService.getGamePath();
        if (!gamePath) {
            const errorMsg = this.transloco.translate(
                'weapons.errors.noGamePath',
            );
            this.weaponService['error'].set(errorMsg);
            return;
        }
        await this.weaponService.refreshWeapons(gamePath);
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
            console.log('Copied path:', weapon.sourceFile);
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
}
