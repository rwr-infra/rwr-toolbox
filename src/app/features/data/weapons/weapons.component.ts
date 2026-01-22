import {
    Component,
    inject,
    computed,
    signal,
    effect,
    AfterViewInit,
    ViewChild,
    DestroyRef,
} from '@angular/core';
import {
    CdkVirtualScrollViewport,
    ScrollingModule,
} from '@angular/cdk/scrolling';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { invoke } from '@tauri-apps/api/core';
import { LucideAngularModule } from 'lucide-angular';
import { WeaponService } from './services/weapon.service';
import { DirectoryService } from '../../settings/services/directory.service';
import { Weapon, AdvancedFilters } from '../../../shared/models/weapons.models';
import { yieldToMain } from '../../../core/utils/performance.utils';
import { WEAPON_COLUMNS } from './weapon-columns';
import { ScrollingModeService } from '../../shared/services/scrolling-mode.service';
import type { PaginationState } from '../../../shared/models/common.models';
import {
    animate,
    state,
    style,
    transition,
    trigger,
} from '@angular/animations';

/**
 * Weapons table component with search, filters, and column visibility
 * Feature: 001-weapons-directory-scanner
 * Uses Angular v20 Signals pattern
 */
@Component({
    selector: 'app-weapons',
    imports: [TranslocoPipe, LucideAngularModule, ScrollingModule],
    templateUrl: './weapons.component.html',
    styleUrl: './weapons.component.scss',
    animations: [
        trigger('expandCollapse', [
            state(
                'collapsed',
                style({
                    height: '0',
                    opacity: 0,
                    overflow: 'hidden',
                    visibility: 'hidden',
                }),
            ),
            state(
                'expanded',
                style({
                    height: '*',
                    opacity: 1,
                    overflow: 'hidden',
                    visibility: 'visible',
                }),
            ),
            transition('collapsed <=> expanded', [
                animate('250ms cubic-bezier(0.4, 0, 0.2, 1)'),
            ]),
        ]),
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
export class WeaponsComponent implements AfterViewInit {
    private weaponService = inject(WeaponService);
    private directoryService = inject(DirectoryService);
    private transloco = inject(TranslocoService);
    private scrollingModeService = inject(ScrollingModeService);
    private destroyRef = inject(DestroyRef);

    @ViewChild('weaponsViewport')
    private weaponsViewport?: CdkVirtualScrollViewport;

    readonly rowHeight = 44;
    private iconLoadToken = 0;

    trackByWeaponId = (_: number, weapon: Weapon) => weapon.id;

    // Readonly signals from service
    readonly weapons = this.weaponService.filteredWeapons;
    readonly loading = this.weaponService.loadingSig;
    readonly error = this.weaponService.errorSig;
    readonly visibleColumns = this.weaponService.visibleColumnsSig;
    readonly sortState = this.weaponService.sortStateSig;

    // UI state signals
    readonly searchTerm = signal<string>('');
    readonly selectedTag = signal<string | undefined>(undefined);
    readonly showAdvancedSearch = signal<boolean>(false);
    readonly advancedFilters = signal<AdvancedFilters>({});
    readonly selectedWeapon = signal<Weapon | null>(null);
    readonly showWeaponDetails = signal<boolean>(false);

    // NEW: Detail view side panel state
    readonly isDetailPanelOpen = signal<boolean>(false);
    readonly detailPanelPosition = signal<'side' | 'overlay'>('side');

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

    // Feature 007: Icon mapping for weapon types
    readonly WEAPON_ICONS: Record<string, string> = {
        // Assault rifles
        assault_rifle: 'crosshair',
        rifle_assault: 'crosshair',
        m4: 'crosshair',
        ak47: 'crosshair',

        // SMGs
        smg: 'crosshair',
        submachine_gun: 'crosshair',
        mp5: 'crosshair',

        // Pistols
        pistol: 'crosshair',
        sidearm: 'crosshair',

        // Sniper rifles
        sniper: 'crosshair',
        sniper_rifle: 'crosshair',

        // LMGs
        lmg: 'zap',
        machine_gun: 'zap',

        // Shotguns
        shotgun: 'crosshair',

        // Heavy weapons
        rpg: 'zap',
        rocket_launcher: 'zap',
    };

    // T004: Image URL cache: weapon.key -> image URL
    readonly weaponIconUrls = signal<Map<string, string>>(new Map());

    // T013: Track loading state for icons: weapon.key -> boolean
    readonly loadingIcons = signal<Set<string>>(new Set());

    // Bug fix: Track if we've already attempted loading to avoid duplicate load attempts
    private hasAttemptedLoad = signal<boolean>(false);

    // Computed signals
    readonly weaponCount = computed(() => this.weapons().length);
    readonly hasError = computed(() => this.error() !== null);
    readonly availableTags = computed(() => {
        const tags = new Set<string>();
        this.weaponService.weaponsSig().forEach((w) => {
            if (w.tag) tags.add(w.tag);
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
        // Migrate localStorage preferences from 'classTag' to 'tag'
        const saved = this.weaponService.getColumnVisibility();
        const migrated = saved.map((col) => {
            if (col.columnId === 'classTag') {
                return { ...col, columnId: 'tag' };
            }
            return col;
        });
        this.weaponService.setColumnVisibility(migrated);

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

        // NOTE: Icon loading is driven by the virtual-scroll viewport so we only
        // request icons for visible rows (plus a small buffer).

        // Bug fix: Auto-load weapons when valid directories become available after initialization
        effect(() => {
            // Ensure DirectoryService initialization is kicked off (it is idempotent).
            void this.directoryService.ensureInitialized();

            const initialized = this.directoryService.initializedSig();
            const validDirCount =
                this.directoryService.validDirectoryCountSig();
            const scanState = this.directoryService.scanProgressSig().state;
            const hasAttempted = this.hasAttemptedLoad();
            const hasWeapons = this.weapons().length > 0;

            // Only trigger load when:
            // 1. Service is initialized
            // 2. Valid directories are available
            // 3. Not currently running a multi-directory scan (avoid races/duplicate scans)
            // 3. Haven't attempted loading yet
            // 4. No weapons loaded yet
            if (
                initialized &&
                validDirCount > 0 &&
                scanState !== 'scanning' &&
                !hasAttempted &&
                !hasWeapons
            ) {
                console.log(
                    '[WeaponsComponent] Auto-loading weapons on component mount...',
                );
                this.hasAttemptedLoad.set(true);
                this.loadWeapons();
            }
        });
    }

    ngAfterViewInit(): void {
        const viewport = this.weaponsViewport;
        if (!viewport) return;

        viewport.renderedRangeStream
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe((range) => {
                void this.loadVisibleWeaponIcons(range.start, range.end);
            });

        queueMicrotask(() => viewport.checkViewportSize());
    }

    private async loadVisibleWeaponIcons(
        startIndex: number,
        endIndex: number,
    ): Promise<void> {
        const token = ++this.iconLoadToken;
        const weapons = this.paginatedWeapons();
        const end = Math.min(endIndex, weapons.length);

        for (let i = startIndex; i < end; i++) {
            if (token !== this.iconLoadToken) return;

            await this.loadWeaponIcon(weapons[i]);

            if (i > startIndex && (i - startIndex) % 6 === 0) {
                await yieldToMain();
            }
        }
    }

    private scrollViewportToTop(): void {
        this.weaponsViewport?.scrollToIndex(0);
    }

    toggleScrollingMode(): void {
        const newMode = this.isTableOnlyMode() ? 'full-page' : 'table-only';
        this.scrollingModeService.setMode(newMode);
    }

    /** Load weapons from game directory */
    async loadWeapons(): Promise<void> {
        // Bug fix: Skip loading if weapons are already loaded
        // Only load on first visit or when directories change
        if (this.weapons().length > 0) {
            console.log(
                '[WeaponsComponent] Weapons already loaded, skipping...',
            );
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
                    '[WeaponsComponent] Waiting for valid directories to become available...',
                );
                return;
            }
            const errorMsg = this.transloco.translate(
                'weapons.errors.noGamePath',
            );
            this.weaponService['error'].set(errorMsg);
            return;
        }

        await this.weaponService.scanWeapons(directory.path, directory.path);

        this.scrollViewportToTop();
    }

    /** Handle search input */
    onSearch(term: string): void {
        this.searchTerm.set(term);
        this.weaponService.setSearchTerm(term);
        // T066: Reset pagination to page 1 on search
        this.pagination.update((p) => ({ ...p, currentPage: 1 }));
    }

    /** Handle tag filter change */
    onTagFilter(tag: string): void {
        this.selectedTag.set(tag || undefined);
        // T067: Reset pagination to page 1 on filter change
        this.pagination.update((p) => ({ ...p, currentPage: 1 }));
        this.updateAdvancedFilters();
    }

    /** Update advanced filters with current tag selection */
    private updateAdvancedFilters(): void {
        const filters: AdvancedFilters = {
            ...this.advancedFilters(),
            tag: this.selectedTag(),
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
        this.selectedTag.set(undefined);
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
        // T004: Use selected directory or fall back to first valid directory
        const directory =
            this.directoryService.getSelectedDirectory() ||
            this.directoryService.getFirstValidDirectory();

        if (!directory) {
            const errorMsg = this.transloco.translate(
                'weapons.errors.noGamePath',
            );
            this.weaponService['error'].set(errorMsg);
            return;
        }

        await this.weaponService.refreshWeapons(directory.path, directory.path);
        this.scrollViewportToTop();
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
        this.scrollViewportToTop();
        this.weaponsViewport?.checkViewportSize();
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

    /** NEW: Select weapon and show side panel */
    selectWeapon(weapon: Weapon): void {
        this.selectedWeapon.set(weapon);
        this.isDetailPanelOpen.set(true);
    }

    /** NEW: Close detail side panel */
    closeDetailPanel(): void {
        this.isDetailPanelOpen.set(false);
        this.selectedWeapon.set(null);
    }

    /** NEW: Select next weapon for keyboard navigation */
    selectNext(): void {
        const current = this.selectedWeapon();
        if (!current) return;

        const weapons = this.paginatedWeapons();
        const index = weapons.findIndex((w) => w.key === current.key);
        if (index < weapons.length - 1) {
            this.selectWeapon(weapons[index + 1]);
        }
    }

    /** NEW: Select previous weapon for keyboard navigation */
    selectPrevious(): void {
        const current = this.selectedWeapon();
        if (!current) return;

        const weapons = this.paginatedWeapons();
        const index = weapons.findIndex((w) => w.key === current.key);
        if (index > 0) {
            this.selectWeapon(weapons[index - 1]);
        }
    }

    /** Feature 007: Get icon name for weapon type (for detail panel display) */
    getIconForWeaponType(weaponType: string): string {
        const icon = this.WEAPON_ICONS[weaponType];
        if (!icon) {
            console.warn(
                `[WeaponsComponent] No icon mapping for weapon type: "${weaponType}". Using fallback "box" icon.`,
            );
            return 'box';
        }
        return icon;
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

    /** T004: Load weapon icon URL and cache the result */
    async loadWeaponIcon(weapon: Weapon): Promise<void> {
        const weaponKey = weapon.key || '';
        if (
            !weapon.hudIcon ||
            this.weaponIconUrls().has(weaponKey) ||
            this.loadingIcons().has(weaponKey)
        ) {
            return;
        }

        this.loadingIcons.update((set) => {
            const next = new Set(set);
            next.add(weaponKey);
            return next;
        });

        try {
            const url = await this.weaponService.getIconUrl(weapon);
            if (url) {
                this.weaponIconUrls.update((map) => {
                    const newMap = new Map(map);
                    newMap.set(weaponKey, url);
                    return newMap;
                });
            }
        } catch {
            // Icon loading failed - silently skip
        } finally {
            this.loadingIcons.update((set) => {
                const next = new Set(set);
                next.delete(weaponKey);
                return next;
            });
        }
    }

    /** T004: Get cached icon URL for a weapon */
    getWeaponIconUrl(weapon: Weapon): string {
        const weaponKey = weapon.key || '';
        return this.weaponIconUrls().get(weaponKey) || '';
    }

    /** T004: Handle image load error */
    onWeaponImageError(): void {
        // Image loading failed - silently ignore
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
        this.scrollViewportToTop();
        this.weaponsViewport?.checkViewportSize();
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
