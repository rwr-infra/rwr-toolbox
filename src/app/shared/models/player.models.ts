/**
 * Raw player data from API response (parsed from HTML table)
 */
export interface RawPlayerData {
    row_number: string;
    username: string;
    kills: string;
    deaths: string;
    score: string;
    kd: string;
    time_played: string;
    longest_kill_streak: string;
    targets_destroyed: string;
    vehicles_destroyed: string;
    soldiers_healed: string;
    teamkills: string;
    distance_moved: string;
    rank_name?: string;
    rank_icon?: string;
}

/**
 * Parsed and typed player model
 */
export interface Player {
    /** Unique identifier (username) */
    id: string;
    /** Row number in current page */
    rowNumber: number;
    /** Player username */
    username: string;
    /** Total kills */
    kills: number;
    /** Total deaths */
    deaths: number;
    /** Score */
    score: number;
    /** Kill/death ratio */
    kd: number;
    /** Time played in seconds */
    timePlayed: number;
    /** Time played as human-readable string */
    timePlayedFormatted: string;
    /** Longest kill streak */
    longestKillStreak: number;
    /** Targets destroyed */
    targetsDestroyed: number;
    /** Vehicles destroyed */
    vehiclesDestroyed: number;
    /** Soldiers healed */
    soldiersHealed: number;
    /** Teamkills */
    teamkills: number;
    /** Distance moved in meters */
    distanceMoved: number;
    /** Rank name (if available) */
    rankName?: string;
    /** Rank icon URL (if available) */
    rankIcon?: string;
    /** Shots fired */
    shotsFired?: number;
    /** Throwables thrown */
    throwablesThrown?: number;
    /** Rank progression XP */
    rankProgression?: number;
}

/**
 * Player database types
 */
export type PlayerDatabase = 'invasion' | 'pacific' | 'prereset_invasion';

/**
 * Player list response wrapper
 */
export interface PlayerListResponse {
    players: Player[];
    currentPage: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
    timestamp: number;
    fromCache: boolean;
}

/**
 * Player filter criteria
 */
export interface PlayerFilter {
    /** Search by username */
    search?: string;
    /** Minimum kills */
    minKills?: number;
    /** Maximum kills */
    maxKills?: number;
    /** Minimum K/D ratio */
    minKd?: number;
    /** Minimum time played (seconds) */
    minTimePlayed?: number;
    /** Show only favorites */
    isFavorite?: boolean;
}

/**
 * Player sort field options
 */
export type PlayerSortField =
    | 'username'
    | 'kills'
    | 'deaths'
    | 'kd'
    | 'timePlayed'
    | 'score';

/**
 * Player sort configuration
 */
export interface PlayerSort {
    field: PlayerSortField;
    direction: 'asc' | 'desc';
}

/**
 * Available player column keys
 */
export type PlayerColumnKey =
    | 'rowNumber'
    | 'username'
    | 'action'
    | 'kills'
    | 'deaths'
    | 'kd'
    | 'score'
    | 'timePlayed'
    | 'longestKillStreak'
    | 'targetsDestroyed'
    | 'vehiclesDestroyed'
    | 'soldiersHealed'
    | 'teamkills'
    | 'distanceMoved'
    | 'shotsFired'
    | 'throwablesThrown'
    | 'rankProgression'
    | 'rankName';

/**
 * Player column configuration
 */
export interface PlayerColumn {
    /** Column key */
    key: PlayerColumnKey;
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
 * Player column visibility state
 */
export type PlayerColumnVisibility = Record<PlayerColumnKey, boolean>;
