import type { PlayerColumnVisibility } from './player.models';
import type { ServerColumnVisibility } from './server.models';
import type { ModInstallHistory, ModArchiveEntry } from './mod.models';
import type { ScanDirectory } from './directory.models';

// Re-export ScanDirectory for convenience
export type { ScanDirectory };

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

    /** Game installation directory path (base game). */
    gameInstallDirectory: string | null;

    /** Steam launch: boolean flags (known + custom). */
    steamLaunchBoolParams: Record<string, boolean>;

    /** Steam launch: key=value params (supports any key). */
    steamLaunchKeyValueParams: Record<string, string>;

    /** Steam launch: custom tokens (one token per item). */
    steamLaunchCustomTokens: string[];

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
    /** RWRMI mod target path (defaults to game root, mods directly replace game files) */
    rwrmiTargetPath?: string;
    /** Mod installation history */
    modInstallHistory: ModInstallHistory[];
    /** Configured scan directories for multi-directory support */
    scanDirectories: ScanDirectory[];
    /** T004: Selected scan directory ID for persistent library selection */
    selectedDirectoryId: string | null;
    /** Enable mod archive (save installed mod zips to a directory) */
    modArchiveEnabled: boolean;
    /** Directory path for mod archive */
    modArchiveDirectory: string | null;
    /** Cached mod archive entries with metadata */
    modArchiveEntries: ModArchiveEntry[];
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
