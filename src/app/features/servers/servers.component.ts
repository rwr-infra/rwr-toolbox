import { Component, inject, OnInit, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';
import { TranslocoDirective, TranslocoPipe } from '@jsverse/transloco';
import {
    Server,
    ServerFilter,
    ServerSort,
    ServerSortField,
    ServerColumnKey,
} from '../../shared/models/server.models';
import { PaginationState } from '../../shared/models/common.models';
import { ServerService } from './services/server.service';
import { PingService } from '../../core/services/ping.service';
import { SettingsService } from '../../core/services/settings.service';
import { SERVER_COLUMNS } from './server-columns';
import { ScrollingModeService } from '../shared/services/scrolling-mode.service';

/**
 * Servers list component with filtering, sorting, pagination, and ping functionality
 */
@Component({
    selector: 'app-servers',
    standalone: true,
    imports: [
        CommonModule,
        LucideAngularModule,
        TranslocoDirective,
        TranslocoPipe,
    ],
    templateUrl: './servers.component.html',
})
export class ServersComponent implements OnInit {
    private serverService = inject(ServerService);
    private pingService = inject(PingService);
    private settingsService = inject(SettingsService);
    private scrollingModeService = inject(ScrollingModeService);

    // Use signals directly from services (refactored to Signal pattern)
    readonly servers = this.serverService.serversSig;
    readonly loading = this.serverService.loadingSig;
    readonly error = this.serverService.errorSig;
    // Use signal directly from PingService (refactored to Signal pattern)
    readonly pinging = this.pingService.pingingSig;

    // Local component state with signals
    filter = signal<ServerFilter>({});
    sort = signal<ServerSort>({ field: 'playerCount', direction: 'desc' });
    pagination = signal<Pick<PaginationState, 'currentPage' | 'pageSize'>>({
        currentPage: 1,
        pageSize: 100,
    });

    // Column configuration
    columns = SERVER_COLUMNS;

    // Computed state
    filteredServers = computed(() => {
        const allServers = this.servers();
        const currentFilter = this.filter();
        const currentSort = this.sort();

        let filtered = this.serverService.filterServers(
            allServers,
            currentFilter,
        );
        filtered = this.serverService.sortServers(filtered, currentSort);

        return filtered;
    });

    // Computed pagination totals (derived from filtered servers)
    readonly isTableOnlyMode = computed(() =>
        this.scrollingModeService.isTableOnlyMode(),
    );

    totalItems = computed(() => this.filteredServers().length);
    totalPages = computed(
        () => Math.ceil(this.totalItems() / this.pagination().pageSize) || 1,
    );

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
        return [...new Set(servers.map((s) => s.country))].sort();
    });

    maps = computed(() => {
        const servers = this.servers();
        return [...new Set(servers.map((s) => s.map))].sort();
    });

    ngOnInit() {
        this.loadData();
    }

    toggleScrollingMode(): void {
        const newMode = this.isTableOnlyMode() ? 'full-page' : 'table-only';
        this.scrollingModeService.setMode(newMode);
    }

    /**
     * Load servers from API
     */
    loadData() {
        this.serverService.fetchServers().subscribe({
            error: (err) => console.error('Failed to load servers:', err),
        });
    }

    /**
     * Handle filter changes
     */
    onFilterChange(newFilter: Partial<ServerFilter>) {
        this.filter.update((f) => ({ ...f, ...newFilter }));
        this.pagination.update((p) => ({ ...p, currentPage: 1 }));
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
        this.sort.update((s) => {
            if (s.field === field) {
                return {
                    field,
                    direction: s.direction === 'asc' ? 'desc' : 'asc',
                };
            }
            return { field, direction: 'desc' };
        });
    }

    /**
     * Handle page changes
     */
    onPageChange(page: number) {
        this.pagination.update((p) => ({ ...p, currentPage: page }));
    }

    /**
     * Ping all visible servers
     */
    onPingServers() {
        const serversToPing = this.paginatedServers().map((s) => ({
            address: s.address,
            port: s.port,
        }));

        this.pingService.pingServers(serversToPing).subscribe((results) => {
            results.forEach((result) => {
                if (result.ping !== null) {
                    // Update server ping in the list via service method
                    this.serverService.updateServerPing(
                        result.address,
                        result.ping,
                    );
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
     * Check if a column is visible
     */
    isColumnVisible(key: ServerColumnKey): boolean {
        return this.settingsService.isServerColumnVisible(key);
    }

    /**
     * Toggle column visibility
     */
    toggleColumn(key: ServerColumnKey): void {
        // fire-and-forget (template doesn't await)
        void this.settingsService.toggleServerColumn(key);
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
    isColumnSortable(key: ServerColumnKey): boolean {
        const sortable: ServerSortField[] = [
            'name',
            'playerCount',
            'ping',
            'country',
        ];
        return sortable.includes(key as ServerSortField);
    }

    /**
     * Handle column sort change (safe wrapper for template)
     */
    onColumnSort(key: ServerColumnKey): void {
        if (this.isColumnSortable(key)) {
            this.onSortChange(key as ServerSortField);
        }
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

        const query = (this.filter().search ?? '').trim();
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

    /**
     * Capacity badge classes (colored by occupancy).
     */
    getCapacityBadgeClass(server: Server): string {
        const { currentPlayers, maxPlayers } = server;
        const occupancy = maxPlayers > 0 ? currentPlayers / maxPlayers : 0;

        if (currentPlayers === 0)
            return 'badge bg-gray-100 text-gray-500 border-gray-200 opacity-60';
        if (occupancy >= 1.0 || currentPlayers >= maxPlayers)
            return 'badge bg-red-100 text-red-700 border-red-200';
        if (occupancy >= 0.8)
            return 'badge bg-orange-100 text-orange-700 border-orange-200';
        if (occupancy >= 0.6)
            return 'badge bg-amber-100 text-amber-700 border-amber-200';
        return 'badge bg-green-100 text-green-700 border-green-200';
    }

    getCapacityTitle(server: Server): string {
        const { currentPlayers, maxPlayers } = server;
        const occupancy = maxPlayers > 0 ? currentPlayers / maxPlayers : 0;
        if (currentPlayers === 0) return 'Empty server';
        if (occupancy >= 1.0 || currentPlayers >= maxPlayers)
            return 'Full server';
        return `${Math.round(occupancy * 100)}% full`;
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
