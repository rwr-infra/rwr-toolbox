import { Injectable, signal, computed, inject } from '@angular/core';
import { invoke, convertFileSrc } from '@tauri-apps/api/core';
import { TranslocoService } from '@jsverse/transloco';
import {
    Weapon,
    WeaponScanResult,
    AdvancedFilters,
    ColumnVisibility,
    StanceAccuracy,
} from '../../../../shared/models/weapons.models';
import { SortState } from '../../../../shared/models/sort.models';

/**
 * Manages weapon data state and communicates with Rust backend via Tauri commands.
 * Uses Angular v20 Signals pattern for reactive state management.
 */
@Injectable({ providedIn: 'root' })
export class WeaponService {
    private transloco = inject(TranslocoService);

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

    // Public computed signals
    readonly filteredWeapons = computed(() => {
        const weapons = this.weapons();
        const term = this.searchTerm();
        const filters = this.advancedFilters();
        const sort = this.sortState();

        let filtered = weapons.filter(
            (w) =>
                this.matchesSearch(w, term) && this.matchesFilters(w, filters),
        );

        // Apply sorting if active
        if (sort.columnKey && sort.direction) {
            filtered = this.sortWeapons(
                filtered,
                sort.columnKey,
                sort.direction,
            );
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
        }

        try {
            const result = await invoke<WeaponScanResult>('scan_weapons', {
                gamePath,
                directory: directory || null,
            });

            // Tag weapons with source directory for multi-directory support and generate unique IDs
            const weaponsWithSource = result.weapons.map((w) => ({
                ...w,
                sourceDirectory: directory || gamePath,
                _id: crypto.randomUUID(),
            }));

            if (append) {
                this.weapons.set([...this.weapons(), ...weaponsWithSource]);
            } else {
                this.weapons.set(weaponsWithSource);
            }

            // Report errors if any (only if not appending, or handle differently)
            if (result.errors.length > 0) {
                const errorMsg = this.transloco.translate('weapons.scanError', {
                    error: `${result.errors.length} files failed`,
                });
                this.error.set(errorMsg);
            }

            return weaponsWithSource;
        } catch (e) {
            const errorMsg = this.transloco.translate('weapons.scanError', {
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

    /** Clear weapons */
    clearWeapons(): void {
        this.weapons.set([]);
    }

    /** Refresh weapons using stored game path */
    async refreshWeapons(gamePath: string, directory?: string): Promise<Weapon[]> {
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
        // Persist to localStorage
        try {
            localStorage.setItem(
                'weapons.column.visibility',
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

    /** Get weapon details by key */
    getWeaponDetails(weaponKey: string): Weapon | undefined {
        return this.weapons().find((w) => w.key === weaponKey);
    }

    /**
     * Get icon URL for a weapon using Tauri's convertFileSrc
     * Resolves icon from textures/ folder relative to weapon file
     * @param weapon Weapon with hudIcon property
     * @returns Icon URL for use in <img> src attribute, or empty string if no icon
     */
    async getIconUrl(weapon: Weapon): Promise<string> {
        if (!weapon.hudIcon) {
            return '';
        }

        // Use the get_texture_path Tauri command to resolve the icon path
        // The command navigates from weapon file to textures/ folder and returns absolute path
        try {
            const iconPath = await invoke<string>('get_texture_path', {
                weaponFilePath: weapon.sourceFile,
                iconFilename: weapon.hudIcon,
            });
            // Convert absolute path to Tauri asset URL
            return convertFileSrc(iconPath);
        } catch {
            // Icon not found - silently return empty string
            return '';
        }
    }

    /** Check if weapon matches search term */
    private matchesSearch(weapon: Weapon, term: string): boolean {
        if (!term) return true;
        const lowerTerm = term.toLowerCase();
        const matches =
            weapon.name.toLowerCase().includes(lowerTerm) ||
            (weapon.key?.toLowerCase().includes(lowerTerm) ?? false) ||
            (weapon.tag?.toLowerCase().includes(lowerTerm) ?? false);
        return matches;
    }

    /** Check if weapon matches advanced filters */
    private matchesFilters(weapon: Weapon, filters: AdvancedFilters): boolean {
        // Range filters
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

        // Stance accuracy filters
        if (filters.stanceAccuracies) {
            for (const [stance, range] of Object.entries(
                filters.stanceAccuracies,
            ) as [string, { min: number; max: number }][]) {
                const accuracy = weapon.stanceAccuracies.find(
                    (sa: StanceAccuracy) => sa.stance === stance,
                );
                if (!accuracy) return false;
                if (
                    accuracy.accuracy < range.min ||
                    accuracy.accuracy > range.max
                )
                    return false;
            }
        }

        // Exact match filters
        if (filters.tag && weapon.tag !== filters.tag) {
            return false;
        }

        if (
            filters.suppressed !== undefined &&
            weapon.suppressed !== filters.suppressed
        ) {
            return false;
        }

        if (
            filters.canRespawnWith !== undefined &&
            weapon.canRespawnWith !== filters.canRespawnWith
        ) {
            return false;
        }

        return true;
    }

    /** Sort weapons by column with stable sort */
    private sortWeapons(
        weapons: Weapon[],
        columnKey: string,
        direction: 'asc' | 'desc',
    ): Weapon[] {
        // Create a copy with original indices for stable sort
        const indexed = weapons.map((w, i) => ({
            weapon: w,
            originalIndex: i,
        }));

        indexed.sort((a, b) => {
            const comparison = this.compareValues(
                a.weapon[columnKey as keyof Weapon],
                b.weapon[columnKey as keyof Weapon],
            );
            // Apply direction
            const result = direction === 'asc' ? comparison : -comparison;
            // Use original index as tiebreaker for stable sort
            return result !== 0 ? result : a.originalIndex - b.originalIndex;
        });

        return indexed.map((item) => item.weapon);
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
            const stored = localStorage.getItem('weapons.column.visibility');
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
            { columnId: 'tag', visible: true, order: 2 },
            { columnId: 'magazineSize', visible: true, order: 3 },
            { columnId: 'killProbability', visible: true, order: 4 },
            { columnId: 'retriggerTime', visible: true, order: 5 },
        ];
    }
}
