import type { PlayerColumnVisibility } from './player.models';
import type { ServerColumnVisibility } from './server.models';

/**
 * Favorite item for servers or players
 */
export interface FavoriteItem {
    /** Unique identifier (server id or player username) */
    id: string;
    /** Type of favorite */
    type: 'server' | 'player';
    /** Timestamp when added */
    addedAt: number;
    /** Optional user notes */
    notes?: string;
}

/**
 * API endpoint configuration
 */
export interface ApiEndpoint {
    /** Unique key for the endpoint */
    key: string;
    /** Display label (e.g., "中国大陆", "全球") */
    label: string;
    /** Host address (e.g., "robin.kreedzt.cn") */
    host: string;
}

/**
 * Application settings
 */
export interface AppSettings {
    /** Selected API endpoint key */
    apiEndpoint: string;
    /** Server page size for pagination */
    serverPageSize: number;
    /** Player page size for pagination */
    playerPageSize: number;
    /** Enable ping functionality */
    enablePing: boolean;
    /** Ping timeout in milliseconds */
    pingTimeout: number;
    /** Enable offline caching */
    cacheEnabled: boolean;
    /** List of favorited items */
    favorites: FavoriteItem[];
    /** Player column visibility settings */
    playerColumnVisibility: PlayerColumnVisibility;
    /** Server column visibility settings */
    serverColumnVisibility: ServerColumnVisibility;
}

/**
 * Pagination state
 */
export interface PaginationState {
    currentPage: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
}
