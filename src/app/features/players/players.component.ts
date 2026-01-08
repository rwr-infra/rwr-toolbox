import { Component, inject, OnInit, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';
import {
    Player,
    PlayerFilter,
    PlayerSortField,
    PlayerDatabase,
    PlayerColumn,
    PlayerColumnKey
} from '../../shared/models/player.models';
import { PlayerService } from './services/player.service';
import { SettingsService } from '../../core/services/settings.service';
import { PLAYER_COLUMNS } from './player-columns';
import { toSignal } from '@angular/core/rxjs-interop';

/**
 * Players list component with filtering, sorting, and database switching
 */
@Component({
    selector: 'app-players',
    standalone: true,
    imports: [CommonModule, LucideAngularModule, TranslocoDirective],
    templateUrl: './players.component.html',
    styleUrl: './players.component.css'
})
export class PlayersComponent implements OnInit {
    private playerService = inject(PlayerService);
    private settingsService = inject(SettingsService);
    private translocoService = inject(TranslocoService);

    // Convert observables to signals
    private players$ = this.playerService.players$;
    private loading$ = this.playerService.loading$;
    private error$ = this.playerService.error$;
    private currentPage$ = this.playerService.currentPage$;
    private hasNextPage$ = this.playerService.hasNextPage$;
    private hasPreviousPage$ = this.playerService.hasPreviousPage$;

    players = toSignal(this.players$, { initialValue: [] as Player[] });
    loading = toSignal(this.loading$, { initialValue: false });
    error = toSignal(this.error$, { initialValue: null as string | null });
    currentPage = toSignal(this.currentPage$, { initialValue: 1 });
    hasNextPage = toSignal(this.hasNextPage$, { initialValue: false });
    hasPreviousPage = toSignal(this.hasPreviousPage$, { initialValue: false });

    // Available databases
    databases: PlayerDatabase[] = ['invasion', 'pacific', 'prereset_invasion'];

    // Page size options
    pageSizeOptions = [20, 50, 100];

    // Column configuration
    columns = PLAYER_COLUMNS;

    // Local component state with signals
    selectedDatabase = signal<PlayerDatabase>('invasion');
    filter = signal<PlayerFilter>({});
    sortField = signal<PlayerSortField>('score');
    pageSize = signal<number>(20);

    // Computed state
    filteredPlayers = computed(() => {
        const allPlayers = this.players();
        const currentFilter = this.filter();
        const currentSortField = this.sortField();

        // Inline filtering
        let filtered = allPlayers;
        if (currentFilter.search) {
            const search = currentFilter.search.toLowerCase();
            filtered = filtered.filter(p => p.username.toLowerCase().includes(search));
        }
        if (currentFilter.minKills !== undefined) {
            filtered = filtered.filter(p => p.kills >= currentFilter.minKills!);
        }
        if (currentFilter.maxKills !== undefined) {
            filtered = filtered.filter(p => p.kills <= currentFilter.maxKills!);
        }
        if (currentFilter.minKd !== undefined) {
            filtered = filtered.filter(p => p.kd >= currentFilter.minKd!);
        }
        if (currentFilter.minTimePlayed !== undefined) {
            filtered = filtered.filter(p => p.timePlayed >= currentFilter.minTimePlayed!);
        }
        if (currentFilter.isFavorite) {
            filtered = filtered.filter(p => this.settingsService.isFavorite(p.id, 'player'));
        }

        // Inline sorting (descending only)
        const sorted = [...filtered].sort((a, b) => {
            switch (currentSortField) {
                case 'username':
                    return b.username.localeCompare(a.username);
                case 'kills':
                    return b.kills - a.kills;
                case 'deaths':
                    return b.deaths - a.deaths;
                case 'kd':
                    return b.kd - a.kd;
                case 'timePlayed':
                    return b.timePlayed - a.timePlayed;
                case 'score':
                    return b.score - a.score;
                default:
                    return 0;
            }
        });

        return sorted;
    });

    ngOnInit() {
        this.loadData();
    }

    /**
     * Load players from API
     */
    loadData(page: number = 1) {
        this.playerService.fetchPlayers(
            this.selectedDatabase(),
            page,
            this.pageSize(),
            this.sortField(),
            this.filter().search || ''
        ).subscribe({
            error: err => console.error('Failed to load players:', err)
        });
    }

    /**
     * Handle database change
     */
    onDatabaseChange(event: Event) {
        const value = (event.target as HTMLSelectElement).value;
        this.selectedDatabase.set(value as PlayerDatabase);
        this.loadData(1);
    }

    /**
     * Handle search input Enter key
     */
    onSearchKeydown(event: KeyboardEvent) {
        if (event.key === 'Enter') {
            this.loadData(1);
        }
    }

    /**
     * Handle search button click
     */
    onSearchClick() {
        this.loadData(1);
    }

    /**
     * Clear search
     */
    clearSearch() {
        this.filter.update(f => ({ ...f, search: undefined }));
        this.loadData(1);
    }

    /**
     * Handle favorites toggle change
     */
    onFavoritesToggleChange(event: Event) {
        const checked = (event.target as HTMLInputElement).checked;
        this.filter.update(f => ({ ...f, isFavorite: checked || undefined }));
    }

    /**
     * Handle sort changes
     */
    onSortChange(field: PlayerSortField) {
        // Toggle: if clicking the same field, clear selection; otherwise select new field
        this.sortField.update(currentField => currentField === field ? 'score' : field);
        this.loadData(1);
    }

    /**
     * Handle page size change
     */
    onPageSizeChange(event: Event) {
        const value = (event.target as HTMLSelectElement).value;
        this.pageSize.set(parseInt(value, 10));
        this.loadData(1);
    }

    /**
     * Toggle favorite status
     */
    async onToggleFavorite(player: Player) {
        await this.settingsService.toggleFavorite(player.id, 'player');
    }

    /**
     * Check if player is favorited
     */
    isFavorite(playerId: string): boolean {
        return this.settingsService.isFavorite(playerId, 'player');
    }

    /**
     * Refresh player list
     */
    onRefresh() {
        this.playerService.clearCache(this.selectedDatabase());
        this.loadData(this.currentPage());
    }

    /**
     * Navigate to previous page
     */
    onPreviousPage() {
        const current = this.currentPage();
        if (current > 1) {
            this.loadData(current - 1);
        }
    }

    /**
     * Navigate to next page
     */
    onNextPage() {
        const current = this.currentPage();
        if (this.hasNextPage()) {
            this.loadData(current + 1);
        }
    }

    /**
     * Get database display label
     */
    getDatabaseLabel(db: PlayerDatabase): string {
        const keyMap: Record<PlayerDatabase, string> = {
            invasion: 'players.db_invasion',
            pacific: 'players.db_pacific',
            prereset_invasion: 'players.db_prereset'
        };
        const key = keyMap[db] || db;
        return this.translocoService.translate(key);
    }

    /**
     * Get page size display label
     */
    getPageSizeLabel(size: number): string {
        const keyMap: Record<number, string> = {
            20: 'players.page_size_20',
            50: 'players.page_size_50',
            100: 'players.page_size_100'
        };
        const key = keyMap[size] || `${size}`;
        return this.translocoService.translate(key);
    }

    /**
     * Check if a column is visible
     */
    isColumnVisible(key: PlayerColumnKey): boolean {
        return this.settingsService.isPlayerColumnVisible(key);
    }

    /**
     * Toggle column visibility
     */
    async toggleColumn(key: PlayerColumnKey): Promise<void> {
        await this.settingsService.togglePlayerColumn(key);
    }

    /**
     * Get column alignment class
     */
    getColumnAlignment(alignment: 'left' | 'center' | 'right'): string {
        switch (alignment) {
            case 'center':
                return 'text-center';
            case 'right':
                return 'text-right';
            default:
                return 'text-left';
        }
    }

    /**
     * Check if a column is sortable
     */
    isColumnSortable(key: PlayerColumnKey): boolean {
        const sortableFields: PlayerSortField[] = ['username', 'kills', 'deaths', 'kd', 'timePlayed', 'score'];
        return sortableFields.includes(key as PlayerSortField);
    }

    /**
     * Handle column sort change (safe wrapper for template)
     */
    onColumnSort(key: PlayerColumnKey): void {
        if (this.isColumnSortable(key)) {
            this.onSortChange(key as PlayerSortField);
        }
    }
}
