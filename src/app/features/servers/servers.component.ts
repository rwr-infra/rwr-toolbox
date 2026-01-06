import { Component, inject, OnInit, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';
import {
    Server,
    ServerFilter,
    ServerSort,
    ServerSortField
} from '../../shared/models/server.models';
import { PaginationState } from '../../shared/models/common.models';
import { ServerService } from './services/server.service';
import { PingService, PingResult } from '../../core/services/ping.service';
import { SettingsService } from '../../core/services/settings.service';
import { toSignal } from '@angular/core/rxjs-interop';

/**
 * Servers list component with filtering, sorting, pagination, and ping functionality
 */
@Component({
    selector: 'app-servers',
    standalone: true,
    imports: [CommonModule, LucideAngularModule],
    templateUrl: './servers.component.html',
    styleUrl: './servers.component.css'
})
export class ServersComponent implements OnInit {
    private serverService = inject(ServerService);
    private pingService = inject(PingService);
    private settingsService = inject(SettingsService);

    // Convert observables to signals
    private servers$ = this.serverService.servers$;
    private loading$ = this.serverService.loading$;
    private error$ = this.serverService.error$;
    private pinging$ = this.pingService.pinging$;

    servers = toSignal(this.servers$, { initialValue: [] as Server[] });
    loading = toSignal(this.loading$, { initialValue: false });
    error = toSignal(this.error$, { initialValue: null as string | null });
    pinging = toSignal(this.pinging$, { initialValue: false });

    // Local component state with signals
    filter = signal<ServerFilter>({});
    sort = signal<ServerSort>({ field: 'playerCount', direction: 'desc' });
    pagination = signal<Pick<PaginationState, 'currentPage' | 'pageSize'>>({
        currentPage: 1,
        pageSize: 100
    });

    // Computed state
    filteredServers = computed(() => {
        const allServers = this.servers();
        const currentFilter = this.filter();
        const currentSort = this.sort();

        let filtered = this.serverService.filterServers(allServers, currentFilter);
        filtered = this.serverService.sortServers(filtered, currentSort);

        return filtered;
    });

    // Computed pagination totals (derived from filtered servers)
    totalItems = computed(() => this.filteredServers().length);
    totalPages = computed(() => Math.ceil(this.totalItems() / this.pagination().pageSize) || 1);

    paginatedServers = computed(() => {
        const filtered = this.filteredServers();
        const { currentPage, pageSize } = this.pagination();

        const start = (currentPage - 1) * pageSize;
        const end = start + pageSize;

        return filtered.slice(start, end);
    });

    // Available options for filters
    countries = computed(() => {
        const servers = this.servers();
        return [...new Set(servers.map(s => s.country))].sort();
    });

    maps = computed(() => {
        const servers = this.servers();
        return [...new Set(servers.map(s => s.map))].sort();
    });

    ngOnInit() {
        this.loadData();
    }

    /**
     * Load servers from API
     */
    loadData() {
        this.serverService.fetchServers().subscribe({
            error: err => console.error('Failed to load servers:', err)
        });
    }

    /**
     * Handle filter changes
     */
    onFilterChange(newFilter: Partial<ServerFilter>) {
        this.filter.update(f => ({ ...f, ...newFilter }));
        this.pagination.update(p => ({ ...p, currentPage: 1 }));
    }

    /**
     * Handle country filter change
     */
    onCountryChange(event: Event) {
        const value = (event.target as HTMLSelectElement).value;
        this.onFilterChange({ country: value || undefined });
    }

    /**
     * Handle map filter change
     */
    onMapChange(event: Event) {
        const value = (event.target as HTMLSelectElement).value;
        this.onFilterChange({ map: value || undefined });
    }

    /**
     * Handle search input change
     */
    onSearchChange(event: Event) {
        const value = (event.target as HTMLInputElement).value;
        this.onFilterChange({ search: value || undefined });
    }

    /**
     * Handle favorites toggle change
     */
    onFavoritesToggleChange(event: Event) {
        const checked = (event.target as HTMLInputElement).checked;
        this.onFilterChange({ isFavorite: checked || undefined });
    }

    /**
     * Handle sort changes
     */
    onSortChange(field: ServerSortField) {
        this.sort.update(s => {
            if (s.field === field) {
                return { field, direction: s.direction === 'asc' ? 'desc' : 'asc' };
            }
            return { field, direction: 'desc' };
        });
    }

    /**
     * Handle page changes
     */
    onPageChange(page: number) {
        this.pagination.update(p => ({ ...p, currentPage: page }));
    }

    /**
     * Ping all visible servers
     */
    onPingServers() {
        const serversToPing = this.paginatedServers().map(s => ({
            address: s.address,
            port: s.port
        }));

        this.pingService.pingServers(serversToPing).subscribe(results => {
            results.forEach(result => {
                if (result.ping !== null) {
                    // Update server ping in the list
                    this.serverService.servers$.subscribe(servers => {
                        const server = servers.find(s => s.id === result.address);
                        if (server) {
                            (server as any).ping = result.ping;
                        }
                    });
                }
            });
        });
    }

    /**
     * Toggle favorite status
     */
    async onToggleFavorite(server: Server) {
        await this.settingsService.toggleFavorite(server.id, 'server');
    }

    /**
     * Check if server is favorited
     */
    isFavorite(serverId: string): boolean {
        return this.settingsService.isFavorite(serverId, 'server');
    }

    /**
     * Refresh server list
     */
    onRefresh() {
        this.serverService.clearCache();
        this.loadData();
    }

    /**
     * Get page numbers for pagination
     */
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

    /**
     * Get display range for pagination stats
     */
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
