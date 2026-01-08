/**
 * Raw server data from API response (parsed from HTML table)
 */
export interface RawServerData {
    row_number: number;
    name: string;
    address: string;
    port: string;
    country: string;
    map: string;
    player_count: string; // Format: "15/32"
    bot_count: string;
    version: string;
    last_update: string; // Format: "2s", "54s"
    steam: string; // HTML link
    player_names: string; // Comma-separated names
    comment: string;
    reachable: string; // "1" or "0"
}

/**
 * Parsed and typed server model
 */
export interface Server {
    /** Unique identifier (address:port) */
    id: string;
    /** Server name */
    name: string;
    /** Server address */
    address: string;
    /** Server port */
    port: number;
    /** Country code */
    country: string;
    /** Map name */
    map: string;
    /** Current player count */
    currentPlayers: number;
    /** Maximum player capacity */
    maxPlayers: number;
    /** Bot count */
    botCount: number;
    /** Game version */
    version: string;
    /** Last update as human-readable string */
    lastUpdate: string;
    /** Last update in seconds */
    lastUpdateSeconds: number;
    /** Steam connect link */
    steamLink: string;
    /** List of player names */
    playerNames: string[];
    /** Server comment */
    comment: string;
    /** Whether server is reachable */
    isReachable: boolean;
    /** Ping time in milliseconds (added after ping) */
    ping?: number;
}

/**
 * Server list response wrapper
 */
export interface ServerListResponse {
    servers: Server[];
    timestamp: number;
    totalCount: number;
    fromCache: boolean;
}

/**
 * Server filter criteria
 */
export interface ServerFilter {
    /** Search term (matches name, map, country) */
    search?: string;
    /** Filter by country */
    country?: string;
    /** Filter by map */
    map?: string;
    /** Minimum player count */
    minPlayers?: number;
    /** Maximum player count */
    maxPlayers?: number;
    /** Show only servers with available slots */
    hasAvailableSlots?: boolean;
    /** Show only favorites */
    isFavorite?: boolean;
}

/**
 * Server sort field options
 */
export type ServerSortField =
    | 'name'
    | 'playerCount'
    | 'ping'
    | 'lastUpdate'
    | 'country';

/**
 * Server sort configuration
 */
export interface ServerSort {
    field: ServerSortField;
    direction: 'asc' | 'desc';
}

/**
 * Server table column keys
 * - Includes placeholders (mode/dedicated/mod) for future data expansion.
 */
export type ServerColumnKey =
    | 'name'
    | 'address'
    | 'port'
    | 'botCount'
    | 'country'
    | 'mode'
    | 'map'
    | 'playerCount'
    | 'playerNames'
    | 'comment'
    | 'dedicated'
    | 'mod'
    | 'steamLink'
    | 'version'
    | 'lastUpdate'
    | 'ping'
    | 'status'
    | 'action';

/**
 * Server column configuration
 */
export interface ServerColumn {
    /** Column key */
    key: ServerColumnKey;
    /** Default label (fallback) */
    label: string;
    /** i18n key for translation */
    i18nKey: string;
    /** Text alignment */
    alignment: 'left' | 'center' | 'right';
    /** Always visible (cannot be toggled) */
    alwaysVisible?: boolean;
}

/**
 * Server column visibility state
 */
export type ServerColumnVisibility = Record<ServerColumnKey, boolean>;
