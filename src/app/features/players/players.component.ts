import { Component, inject, OnInit, computed, signal, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';
import {
    Player,
    PlayerFilter,
    PlayerSort,
    PlayerSortField,
    PlayerDatabase
} from '../../shared/models/player.models';
import { PlayerService } from './services/player.service';
import { SettingsService } from '../../core/services/settings.service';
import { toSignal } from '@angular/core/rxjs-interop';
import { Subject, Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

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
export class PlayersComponent implements OnInit, OnDestroy {
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

    // Local component state with signals
    selectedDatabase = signal<PlayerDatabase>('invasion');
    filter = signal<PlayerFilter>({});
    sort = signal<PlayerSort>({ field: 'score', direction: 'desc' });
    searchQuery = signal<string>('');

    // Search debouncing
    private searchSubject = new Subject<string>();
    private searchSubscription?: Subscription;

    // Computed state
    filteredPlayers = computed(() => {
        const allPlayers = this.players();
        const currentFilter = this.filter();
        const currentSort = this.sort();

        console.log('filteredPlayers - allPlayers:', allPlayers.length, allPlayers);
        console.log('filteredPlayers - filter:', currentFilter);
        console.log('filteredPlayers - sort:', currentSort);

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

        console.log('filteredPlayers - after filter:', filtered.length);

        // Inline sorting
        const sorted = [...filtered].sort((a, b) => {
            let comparison = 0;
            switch (currentSort.field) {
                case 'username':
                    comparison = a.username.localeCompare(b.username);
                    break;
                case 'kills':
                    comparison = b.kills - a.kills;
                    break;
                case 'deaths':
                    comparison = b.deaths - a.deaths;
                    break;
                case 'kd':
                    comparison = b.kd - a.kd;
                    break;
                case 'timePlayed':
                    comparison = b.timePlayed - a.timePlayed;
                    break;
                case 'score':
                    comparison = b.score - a.score;
                    break;
            }
            return currentSort.direction === 'desc' ? -comparison : comparison;
        });

        console.log('filteredPlayers - after sort:', sorted);

        console.log('filteredPlayers - first:', sorted[0]?.username);

        return sorted;
    });

    ngOnInit() {
        // Set up search debouncing
        this.searchSubscription = this.searchSubject.pipe(
            debounceTime(500),
            distinctUntilChanged()
        ).subscribe(query => {
            this.searchQuery.set(query);
            this.loadData();
        });

        this.loadData();
    }

    ngOnDestroy() {
        this.searchSubscription?.unsubscribe();
    }

    /**
     * Load players from API
     */
    loadData(page: number = 1) {
        this.playerService.fetchPlayers(
            this.selectedDatabase(),
            page,
            20,
            this.sort().field,
            this.searchQuery()
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
     * Handle search input change
     */
    onSearchChange(event: Event) {
        const value = (event.target as HTMLInputElement).value;
        this.searchSubject.next(value || '');
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
        this.sort.update(s => {
            if (s.field === field) {
                return { field, direction: s.direction === 'asc' ? 'desc' : 'asc' };
            }
            return { field, direction: 'desc' };
        });
        this.loadData(1); // Reload from server with new sort
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
}
