import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Observable, of, throwError } from 'rxjs';
import { tap, catchError, shareReplay, map } from 'rxjs/operators';
import { XMLParser } from 'fast-xml-parser';
import { HttpClientService } from '../../../core/services/http-client.service';
import { SettingsService } from '../../../core/services/settings.service';
import { CacheService } from '../../../core/services/cache.service';
import {
    Player,
    PlayerListResponse,
    PlayerFilter,
    PlayerSort,
    PlayerDatabase
} from '../../../shared/models/player.models';

/**
 * Service for fetching and managing player data
 */
@Injectable({
    providedIn: 'root'
})
export class PlayerService {
    private httpClient = inject(HttpClientService);
    private settingsService = inject(SettingsService);
    private cacheService = inject(CacheService);

    private readonly CACHE_KEY_PREFIX = 'players_list_';
    private readonly BASE_URL = 'http://rwr.runningwithrifles.com/rwr_stats/view_players.php';
    private readonly xmlParser = new XMLParser({
        ignoreAttributes: false,
        attributeNamePrefix: '',
        textNodeName: '_text',
        htmlEntities: true,
        ignoreDeclaration: true,
        ignorePiTags: true
    });

    // State management with BehaviorSubjects
    private playersSubject = new BehaviorSubject<Player[]>([]);
    private loadingSubject = new BehaviorSubject<boolean>(false);
    private errorSubject = new BehaviorSubject<string | null>(null);
    private currentPageSubject = new BehaviorSubject<number>(1);
    private hasNextPageSubject = new BehaviorSubject<boolean>(false);
    private hasPreviousPageSubject = new BehaviorSubject<boolean>(false);

    /** Observable streams */
    readonly players$ = this.playersSubject.asObservable();
    readonly loading$ = this.loadingSubject.asObservable();
    readonly error$ = this.errorSubject.asObservable();
    readonly currentPage$ = this.currentPageSubject.asObservable();
    readonly hasNextPage$ = this.hasNextPageSubject.asObservable();
    readonly hasPreviousPage$ = this.hasPreviousPageSubject.asObservable();

    /**
     * Fetch players from API
     * @param database Player database to query
     * @param page Page number
     * @param pageSize Number of results per page
     * @param sortBy Sort field
     * @param forceRefresh Force refresh from API
     * @returns Observable of player list response
     */
    fetchPlayers(
        database: PlayerDatabase = 'invasion',
        page: number = 1,
        pageSize: number = 100,
        sortBy: string = 'rank_progression',
        forceRefresh = false
    ): Observable<PlayerListResponse> {
        this.loadingSubject.next(true);
        this.errorSubject.next(null);

        const params = new URLSearchParams({
            db: database,
            sort: sortBy,
            search: ''
        });

        const url = `${this.BASE_URL}?${params.toString()}`;

        return this.httpClient.get<string>(url, {
            timeout: this.settingsService.settings().pingTimeout,
            withCacheBuster: true,
            responseType: 'text'
        }).pipe(
            map(html => this.parsePlayerList(html)),
            tap(response => {
                this.playersSubject.next(response.players);
                this.currentPageSubject.next(page);
                this.hasNextPageSubject.next(response.hasNextPage);
                this.hasPreviousPageSubject.next(response.hasPreviousPage);
                this.loadingSubject.next(false);

                // Cache the response
                this.cacheService.set(`${this.CACHE_KEY_PREFIX}${database}`, {
                    players: response.players,
                    timestamp: Date.now()
                });
            }),
            catchError(error => {
                this.loadingSubject.next(false);
                this.errorSubject.next(error.message);

                // Try to load from cache
                const cached = this.cacheService.get<{ players: Player[]; timestamp: number }>(`${this.CACHE_KEY_PREFIX}${database}`);
                if (cached) {
                    console.log('Using cached player data');
                    this.playersSubject.next(cached.players);
                    return of({
                        players: cached.players,
                        currentPage: page,
                        hasNextPage: false,
                        hasPreviousPage: page > 1,
                        timestamp: cached.timestamp,
                        fromCache: true
                    });
                }

                return throwError(() => error);
            }),
            shareReplay(1)
        );
    }

    /**
     * Parse HTML response into Player objects using fast-xml-parser
     * @param html HTML string from API
     * @returns Parsed player list response
     */
    private parsePlayerList(html: string): PlayerListResponse {
        const parsed = this.xmlParser.parse(html);
        const players: Player[] = [];

        // Navigate to table rows
        let tableRows: any[] = [];
        let links: any[] = [];

        // Try different possible paths to table rows and links
        if (parsed.html?.body?.table?.tr) {
            tableRows = Array.isArray(parsed.html.body.table.tr) ? parsed.html.body.table.tr : [parsed.html.body.table.tr];
            links = Array.isArray(parsed.html.body.a) ? parsed.html.body.a : parsed.html.body.a ? [parsed.html.body.a] : [];
        } else if (parsed.body?.table?.tr) {
            tableRows = Array.isArray(parsed.body.table.tr) ? parsed.body.table.tr : [parsed.body.table.tr];
            links = Array.isArray(parsed.body.a) ? parsed.body.a : parsed.body.a ? [parsed.body.a] : [];
        } else if (parsed.table?.tr) {
            tableRows = Array.isArray(parsed.table.tr) ? parsed.table.tr : [parsed.table.tr];
            links = Array.isArray(parsed.a) ? parsed.a : parsed.a ? [parsed.a] : [];
        }

        // Check for pagination links
        const hasNextPage = this.checkPaginationLink(links, 'Next');
        const hasPreviousPage = this.checkPaginationLink(links, 'Previous');

        // Skip header row (index 0)
        for (let i = 1; i < tableRows.length; i++) {
            const row = tableRows[i];
            const cells = Array.isArray(row.td) ? row.td : [row.td];

            if (cells.length < 13) continue;

            const player: Player = {
                id: this.extractTextValue(cells[1]),
                username: this.extractTextValue(cells[1]),
                kills: parseInt(this.extractTextValue(cells[2])) || 0,
                deaths: parseInt(this.extractTextValue(cells[3])) || 0,
                score: parseInt(this.extractTextValue(cells[4])) || 0,
                kd: parseFloat(this.extractTextValue(cells[5])) || 0,
                timePlayed: this.parseTimeToSeconds(this.extractTextValue(cells[6])),
                timePlayedFormatted: this.extractTextValue(cells[6]),
                longestKillStreak: parseInt(this.extractTextValue(cells[7])) || 0,
                targetsDestroyed: parseInt(this.extractTextValue(cells[8])) || 0,
                vehiclesDestroyed: parseInt(this.extractTextValue(cells[9])) || 0,
                soldiersHealed: parseInt(this.extractTextValue(cells[10])) || 0,
                teamkills: parseInt(this.extractTextValue(cells[11])) || 0,
                distanceMoved: this.parseDistanceToMeters(this.extractTextValue(cells[12]))
            };

            players.push(player);
        }

        return {
            players,
            currentPage: 1,
            hasNextPage,
            hasPreviousPage,
            timestamp: Date.now(),
            fromCache: false
        };
    }

    /**
     * Check if pagination link exists in links array
     * @param links Array of link elements from XML parser
     * @param text Link text to find
     * @returns True if link exists
     */
    private checkPaginationLink(links: any[], text: string): boolean {
        if (!links) return false;
        return links.some((link: any) => {
            const linkText = link._text?.toString()?.trim() || link.toString()?.trim();
            return linkText === text;
        });
    }

    /**
     * Filter players based on criteria
     * @param players Player list to filter
     * @param filter Filter criteria
     * @returns Filtered player list
     */
    filterPlayers(players: Player[], filter: PlayerFilter): Player[] {
        return players.filter(player => {
            // Search filter
            if (filter.search) {
                const search = filter.search.toLowerCase();
                if (!player.username.toLowerCase().includes(search)) {
                    return false;
                }
            }

            // Kills filters
            if (filter.minKills !== undefined && player.kills < filter.minKills) {
                return false;
            }
            if (filter.maxKills !== undefined && player.kills > filter.maxKills) {
                return false;
            }

            // K/D filter
            if (filter.minKd !== undefined && player.kd < filter.minKd) {
                return false;
            }

            // Time played filter
            if (filter.minTimePlayed !== undefined && player.timePlayed < filter.minTimePlayed) {
                return false;
            }

            // Favorites filter
            if (filter.isFavorite) {
                if (!this.settingsService.isFavorite(player.id, 'player')) {
                    return false;
                }
            }

            return true;
        });
    }

    /**
     * Sort players
     * @param players Player list to sort
     * @param sort Sort configuration
     * @returns Sorted player list
     */
    sortPlayers(players: Player[], sort: PlayerSort): Player[] {
        return [...players].sort((a, b) => {
            let comparison = 0;

            switch (sort.field) {
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

            return sort.direction === 'desc' ? -comparison : comparison;
        });
    }

    /**
     * Clear player cache
     * @param database Specific database to clear, or all if undefined
     */
    clearCache(database?: PlayerDatabase): void {
        if (database) {
            this.cacheService.delete(`${this.CACHE_KEY_PREFIX}${database}`);
        } else {
            // Clear all player caches
            ['invasion', 'pacific', 'prereset_invasion'].forEach(db => {
                this.cacheService.delete(`${this.CACHE_KEY_PREFIX}${db}`);
            });
        }
    }

    // Helper methods

    /**
     * Extract text value from XML parser cell
     * Handles: string, object with _text, or nested structure
     */
    private extractTextValue(cell: any): string {
        if (typeof cell === 'string') return cell.trim();
        if (cell?._text) return String(cell._text).trim();
        if (typeof cell === 'object') {
            // Try to find any text content
            const values = Object.values(cell).filter(v => typeof v === 'string');
            if (values.length > 0) return values[0].trim();
        }
        return '';
    }

    private parseTimeToSeconds(text: string): number {
        // Format: "123h 45m" or similar
        const hoursMatch = text.match(/(\d+)h/);
        const minutesMatch = text.match(/(\d+)m/);

        const hours = hoursMatch ? parseInt(hoursMatch[1]) : 0;
        const minutes = minutesMatch ? parseInt(minutesMatch[1]) : 0;

        return (hours * 3600) + (minutes * 60);
    }

    private parseDistanceToMeters(text: string): number {
        // Format: "12.5 km" or "12500 m"
        const kmMatch = text.match(/([\d.]+)\s*km/i);
        const mMatch = text.match(/([\d.]+)\s*m/i);

        if (kmMatch) {
            return parseFloat(kmMatch[1]) * 1000;
        }
        if (mMatch) {
            return parseFloat(mMatch[1]);
        }

        return 0;
    }
}
