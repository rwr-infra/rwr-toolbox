import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Observable, of, throwError } from 'rxjs';
import { tap, catchError, shareReplay, map, concatMap } from 'rxjs/operators';
import { XMLParser } from 'fast-xml-parser';
import { HttpClientService } from '../../../core/services/http-client.service';
import { SettingsService } from '../../../core/services/settings.service';
import { CacheService } from '../../../core/services/cache.service';
import {
    Server,
    ServerListResponse,
    ServerFilter,
    ServerSort
} from '../../../shared/models/server.models';
import { HttpParams } from '@angular/common/http';

/**
 * Service for fetching and managing server data
 */
@Injectable({
    providedIn: 'root'
})
export class ServerService {
    private httpClient = inject(HttpClientService);
    private settingsService = inject(SettingsService);
    private cacheService = inject(CacheService);

    private readonly CACHE_KEY = 'servers_list';
    private readonly BASE_URL = 'http://rwr.runningwithrifles.com/rwr_server_list/get_server_list.php';
    private readonly PAGE_SIZE = 100;
    private readonly xmlParser = new XMLParser();

    // State management with BehaviorSubjects
    private serversSubject = new BehaviorSubject<Server[]>([]);
    private loadingSubject = new BehaviorSubject<boolean>(false);
    private errorSubject = new BehaviorSubject<string | null>(null);

    /** Observable streams */
    readonly servers$ = this.serversSubject.asObservable();
    readonly loading$ = this.loadingSubject.asObservable();
    readonly error$ = this.errorSubject.asObservable();

    /**
     * Fetch all servers from API (loops until all data is retrieved)
     * @param forceRefresh Force refresh from API, ignore cache
     * @returns Observable of server list response
     */
    fetchServers(forceRefresh = false): Observable<ServerListResponse> {
        this.loadingSubject.next(true);
        this.errorSubject.next(null);

        const allServers: Server[] = [];
        let start = 0;
        const timestamp = Date.now();

        // Recursive function to fetch all pages
        const fetchPage = (currentPageStart: number): Observable<ServerListResponse> => {
            const params = new HttpParams()
                .set('start', currentPageStart.toString())
                .set('size', this.PAGE_SIZE.toString())
                .set('names', '1')
                .set('_t', timestamp.toString()); // Cache buster

            return this.httpClient.get<string>(this.BASE_URL, {
                timeout: this.settingsService.settings().pingTimeout,
                params,
                responseType: 'text'
            }).pipe(
                map(html => this.parseServerList(html)),
                tap(response => {
                    allServers.push(...response.servers);
                }),
                // Continue fetching if we got a full page
                concatMap((response: ServerListResponse) => {
                    if (response.servers.length === this.PAGE_SIZE) {
                        // Fetch next page
                        return fetchPage(currentPageStart + this.PAGE_SIZE);
                    }
                    // All pages fetched, return complete response
                    return of({
                        servers: allServers,
                        timestamp: Date.now(),
                        totalCount: allServers.length,
                        fromCache: false
                    } as ServerListResponse);
                })
            );
        };

        return fetchPage(start).pipe(
            tap(response => {
                this.serversSubject.next(response.servers);
                this.loadingSubject.next(false);

                // Cache the complete response
                this.cacheService.set(this.CACHE_KEY, {
                    servers: response.servers,
                    timestamp: Date.now()
                });
            }),
            catchError(error => {
                this.loadingSubject.next(false);
                this.errorSubject.next(error.message);

                // Try to load from cache
                const cached = this.cacheService.get<{ servers: Server[]; timestamp: number }>(this.CACHE_KEY);
                if (cached) {
                    console.log('Using cached server data');
                    this.serversSubject.next(cached.servers);
                    return of({
                        servers: cached.servers,
                        timestamp: cached.timestamp,
                        totalCount: cached.servers.length,
                        fromCache: true
                    });
                }

                return throwError(() => error);
            }),
            shareReplay(1)
        );
    }

    /**
     * Parse HTML/XML response into Server objects using fast-xml-parser
     * @param html HTML/XML string from API
     * @returns Parsed server list response
     */
    private parseServerList(html: string): ServerListResponse {
        const parsed = this.xmlParser.parse(html);
        const servers: Server[] = [];
        const timestamp = Date.now();

        // Navigate to server elements
        // The API returns: <result><server_list><server>...</server></server_list></result>
        // Or: <result><server>...</server></result>
        let serverArray: any[] = [];

        if (parsed.result?.server_list?.server) {
            const serverData = parsed.result.server_list.server;
            serverArray = Array.isArray(serverData) ? serverData : [serverData];
        } else if (parsed.result?.server) {
            const serverData = parsed.result.server;
            serverArray = Array.isArray(serverData) ? serverData : [serverData];
        } else if (parsed.server_list?.server) {
            const serverData = parsed.server_list.server;
            serverArray = Array.isArray(serverData) ? serverData : [serverData];
        } else if (parsed.server) {
            const serverData = parsed.server;
            serverArray = Array.isArray(serverData) ? serverData : [serverData];
        }

        for (const server of serverArray) {
            const parsedServer: Server = {
                id: `${server.address || ''}:${server.port || 0}`,
                name: server.name?.toString() || '',
                address: server.address?.toString() || '',
                port: Number(server.port) || 0,
                country: server.country?.toString() || '',
                map: server.map_name?.toString() || '',
                currentPlayers: Number(server.current_players) || 0,
                maxPlayers: Number(server.max_players) || 0,
                botCount: Number(server.bots) || 0,
                version: server.version?.toString() || '',
                lastUpdate: this.formatTimestamp(Number(server.timestamp) || 0),
                lastUpdateSeconds: Number(server.timestamp) || 0,
                steamLink: server.url?.toString() || '',
                playerNames: this.parsePlayerList(server.player),
                comment: server.comment?.toString() || '',
                isReachable: true // Default to reachable if server is in the list
            };

            servers.push(parsedServer);
        }

        return {
            servers,
            timestamp,
            totalCount: servers.length,
            fromCache: false
        };
    }

    /**
     * Filter servers based on criteria
     * @param servers Server list to filter
     * @param filter Filter criteria
     * @returns Filtered server list
     */
    filterServers(servers: Server[], filter: ServerFilter): Server[] {
        return servers.filter(server => {
            // Search filter
            if (filter.search) {
                const search = filter.search.toLowerCase();
                const matchesName = server.name.toLowerCase().includes(search);
                const matchesMap = server.map.toLowerCase().includes(search);
                const matchesCountry = server.country.toLowerCase().includes(search);
                if (!matchesName && !matchesMap && !matchesCountry) {
                    return false;
                }
            }

            // Country filter
            if (filter.country && server.country !== filter.country) {
                return false;
            }

            // Map filter
            if (filter.map && server.map !== filter.map) {
                return false;
            }

            // Player count filters
            if (filter.minPlayers !== undefined && server.currentPlayers < filter.minPlayers) {
                return false;
            }
            if (filter.maxPlayers !== undefined && server.currentPlayers > filter.maxPlayers) {
                return false;
            }

            // Available slots filter
            if (filter.hasAvailableSlots && server.currentPlayers >= server.maxPlayers) {
                return false;
            }

            // Favorites filter
            if (filter.isFavorite) {
                if (!this.settingsService.isFavorite(server.id, 'server')) {
                    return false;
                }
            }

            return true;
        });
    }

    /**
     * Sort servers
     * @param servers Server list to sort
     * @param sort Sort configuration
     * @returns Sorted server list
     */
    sortServers(servers: Server[], sort: ServerSort): Server[] {
        return [...servers].sort((a, b) => {
            let comparison = 0;

            switch (sort.field) {
                case 'name':
                    comparison = a.name.localeCompare(b.name);
                    break;
                case 'playerCount':
                    comparison = b.currentPlayers - a.currentPlayers;
                    break;
                case 'ping':
                    const aPing = a.ping ?? Infinity;
                    const bPing = b.ping ?? Infinity;
                    comparison = aPing - bPing;
                    break;
                case 'lastUpdate':
                    comparison = a.lastUpdateSeconds - b.lastUpdateSeconds;
                    break;
                case 'country':
                    comparison = a.country.localeCompare(b.country);
                    break;
            }

            return sort.direction === 'desc' ? -comparison : comparison;
        });
    }

    /**
     * Clear server cache
     */
    clearCache(): void {
        this.cacheService.delete(this.CACHE_KEY);
    }

    // Helper methods

    /**
     * Format timestamp to human-readable string (e.g., "2m", "54s")
     */
    private formatTimestamp(timestamp: number): string {
        if (timestamp < 60) return `${timestamp}s`;
        if (timestamp < 3600) return `${Math.floor(timestamp / 60)}m`;
        if (timestamp < 86400) return `${Math.floor(timestamp / 3600)}h`;
        return `${Math.floor(timestamp / 86400)}d`;
    }

    /**
     * Parse player list from server data
     * Handles: string with comma-separated names, or XML parsed structure
     */
    private parsePlayerList(playerData: any): string[] {
        if (!playerData) return [];

        // If it's already a string, split by comma
        if (typeof playerData === 'string') {
            return playerData.split(',').map(n => n.trim()).filter(n => n);
        }

        // If it's an array from XML parser
        if (Array.isArray(playerData)) {
            return playerData.map(p => p?.toString?.() || p?.toString() || '').filter(n => n);
        }

        // If it's an object with name property or _text
        if (typeof playerData === 'object') {
            const name = playerData.name?.toString() || playerData._text?.toString() || '';
            return name ? [name] : [];
        }

        return [];
    }
}
