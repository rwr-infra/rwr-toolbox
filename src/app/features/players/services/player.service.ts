import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Observable, of, throwError } from 'rxjs';
import { tap, catchError, shareReplay, map, finalize } from 'rxjs/operators';
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
import { HttpParams } from '@angular/common/http';

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
        attributeNamePrefix: '@_',
        textNodeName: '#text',
        parseAttributeValue: true,
        trimValues: true,
        allowBooleanAttributes: true
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
     * @param search Search term
     * @param forceRefresh Force refresh from API
     * @returns Observable of player list response
     */
    fetchPlayers(
        database: PlayerDatabase = 'invasion',
        page: number = 1,
        pageSize: number = 20,
        sortBy: string = 'rank_progression',
        search: string = '',
        forceRefresh = false
    ): Observable<PlayerListResponse> {
        this.loadingSubject.next(true);
        this.errorSubject.next(null);

        const params = new HttpParams()
            .set('db', database)
            .set('sort', sortBy)
            .set('search', search)
            .set('start', ((page - 1) * pageSize).toString())
            .set('size', pageSize.toString());

        return this.httpClient.get<string>(this.BASE_URL, {
            timeout: this.settingsService.settings().pingTimeout,
            params,
            withCacheBuster: true,
            responseType: 'text'
        }).pipe(
            map(html => this.parsePlayerList(html, database)),
            tap(response => {
                this.playersSubject.next(response.players);
                this.currentPageSubject.next(page);
                this.hasNextPageSubject.next(response.hasNextPage);
                this.hasPreviousPageSubject.next(response.hasPreviousPage);
                // Cache the response
                this.cacheService.set(`${this.CACHE_KEY_PREFIX}${database}`, {
                    players: response.players,
                    timestamp: Date.now()
                });
            }),
            catchError(error => {
                this.errorSubject.next(error.message);

                // Try to load from cache
                const cached = this.cacheService.get<{ players: Player[]; timestamp: number }>(`${this.CACHE_KEY_PREFIX}${database}`);
                if (cached) {
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
            finalize(() => this.loadingSubject.next(false)),
            shareReplay(1)
        );
    }

    /**
     * Parse HTML response into Player objects using fast-xml-parser
     * @param html HTML string from API
     * @param database Player database to use for player IDs
     * @returns Parsed player list response
     */
    private parsePlayerList(html: string, database: PlayerDatabase): PlayerListResponse {
        const parsed = this.xmlParser.parse(html);
        const players: Player[] = [];

        // Navigate to table using multiple path attempts
        let table = parsed.html?.body?.table;
        if (!table) {
            table = parsed.table;
        }
        if (!table) {
            table = parsed.html?.table;
        }
        if (!table) {
            table = parsed.body?.table;
        }
        if (!table) {
            // Fallback: recursively search for table
            table = this.findTable(parsed);
        }

        if (!table) {
            console.warn('[PlayerService] No table found in player list response');
            return {
                players: [],
                currentPage: 1,
                hasNextPage: false,
                hasPreviousPage: false,
                timestamp: Date.now(),
                fromCache: false
            };
        }

        const rows = table.tr;
        if (!rows) {
            console.warn('[PlayerService] No rows found in table');
            return {
                players: [],
                currentPage: 1,
                hasNextPage: false,
                hasPreviousPage: false,
                timestamp: Date.now(),
                fromCache: false
            };
        }

        const rowArray = Array.isArray(rows) ? rows : [rows];

        // Filter out header rows (rows with <th> elements)
        const dataRows = rowArray.filter((row: any) => !row.th);

        // Parse each data row
        for (let i = 0; i < dataRows.length; i++) {
            const row = dataRows[i];
            const cells = row.td || [];
            // fast-xml-parser returns an array for repeated tags, but a single object for one tag
            const cellArray = Array.isArray(cells) ? cells : cells ? [cells] : [];

            if (cellArray.length < 13) continue;

            const username = this.extractCellText(cellArray[1]);
            if (!username) continue;

            const player: Player = {
                id: `${database}:${username}`,
                rowNumber: i + 1,
                username,
                kills: parseInt(this.extractCellText(cellArray[2])) || 0,
                deaths: parseInt(this.extractCellText(cellArray[3])) || 0,
                score: parseInt(this.extractCellText(cellArray[4])) || 0,
                kd: parseFloat(this.extractCellText(cellArray[5])) || 0,
                timePlayed: this.parseTimeToSeconds(this.extractCellText(cellArray[6])),
                timePlayedFormatted: this.extractCellText(cellArray[6]),
                longestKillStreak: parseInt(this.extractCellText(cellArray[7])) || 0,
                targetsDestroyed: parseInt(this.extractCellText(cellArray[8])) || 0,
                vehiclesDestroyed: parseInt(this.extractCellText(cellArray[9])) || 0,
                soldiersHealed: parseInt(this.extractCellText(cellArray[10])) || 0,
                teamkills: parseInt(this.extractCellText(cellArray[11])) || 0,
                distanceMoved: this.parseDistanceToMeters(this.extractCellText(cellArray[12]))
            };

            players.push(player);
        }

        // Check for pagination links using recursive search
        const { hasNext, hasPrevious } = this.findPaginationLinks(parsed);

        return {
            players,
            currentPage: 1,
            hasNextPage: hasNext,
            hasPreviousPage: hasPrevious,
            timestamp: Date.now(),
            fromCache: false
        };
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
     * Recursively find table in parsed object
     */
    private findTable(obj: any): any {
        if (!obj || typeof obj !== 'object') return null;
        if (Array.isArray(obj)) {
            for (const item of obj) {
                const result = this.findTable(item);
                if (result && result.tr) return result;
            }
            return null;
        }
        if (obj.tr && Array.isArray(obj.tr)) return obj;
        for (const key in obj) {
            if (key === '#text' || key === '#comment') continue;
            const result = this.findTable(obj[key]);
            if (result && result.tr) return result;
        }
        return null;
    }

    /**
     * Recursively find pagination links
     */
    private findPaginationLinks(parsed: any): { hasNext: boolean; hasPrevious: boolean } {
        let hasNext = false;
        let hasPrevious = false;

        const findLinks = (obj: any): void => {
            if (!obj || typeof obj !== 'object') return;
            if (Array.isArray(obj)) {
                for (const item of obj) {
                    findLinks(item);
                }
                return;
            }

            // Check if this object is a link element with text content
            if (obj.a && typeof obj.a === 'object') {
                const links = Array.isArray(obj.a) ? obj.a : [obj.a];
                for (const link of links) {
                    const text = link['#text'] || link;
                    if (typeof text === 'string') {
                        const upperText = text.toUpperCase().trim();
                        if (upperText === 'NEXT') {
                            hasNext = true;
                        } else if (upperText === 'PREVIOUS') {
                            hasPrevious = true;
                        }
                    }
                }
            }

            for (const key in obj) {
                if (key === '#text' || key === '#comment') continue;
                findLinks(obj[key]);
            }
        };

        findLinks(parsed);
        return { hasNext, hasPrevious };
    }

    /**
     * Extract text value from cell (handles #text, a links, img tags)
     */
    private extractCellText(cell: any): string {
        // Handle primitive values directly (number, string, boolean)
        if (typeof cell === 'string') return cell.trim();
        if (typeof cell === 'number') return String(cell);
        if (cell && typeof cell === 'object') {
            if (cell['#text']) return cell['#text'].trim();
            if (cell.a) {
                // Handle <a href="...">text</a> structure
                const linkText = cell.a['#text'] || cell.a;
                return typeof linkText === 'string' ? linkText.trim() : '';
            }
            if (cell.img) {
                // Handle cell with <img> tag
                return '';
            }
        }
        return '';
    }

    /**
     * Extract img src from cell
     */
    private extractImgSrc(cell: any): string | null {
        if (!cell) return null;
        if (typeof cell !== 'object') return null;
        const img = cell.img;
        if (!img) return null;
        return img['@_src'] || img.src || null;
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
