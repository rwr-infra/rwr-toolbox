/**
 * Weapon data models for RWR game weapons
 * Feature: 001-weapons-directory-scanner
 */

/**
 * Stance accuracy values for different positions
 */
export interface StanceAccuracy {
    /** Stance name (running, walking, crouch_moving, standing, crouching, prone, prone_moving, over_wall) */
    stance: string;
    /** Accuracy value (0.0 - 1.0) */
    accuracy: number;
}

/**
 * Complete weapon definition from parsed .weapon XML file
 */
export interface Weapon {
    /** Unique weapon identifier (filename without extension) */
    key?: string;
    /** Display name shown to users */
    name: string;
    /** Weapon category/class (assault, sniper, smg, etc.) */
    classTag: string;
    /** Ammo capacity per magazine */
    magazineSize: number;
    /** Base damage (0.0 - 1.0) */
    killProbability: number;
    /** Fire rate in seconds between shots */
    retriggerTime: number;
    /** Number of rounds per burst */
    burstShots?: number;
    /** Accuracy spread */
    spreadRange?: number;
    /** Sight range multiplier */
    sightRangeModifier?: number;
    /** Bullet velocity */
    projectileSpeed?: number;
    /** Barrel length offset */
    barrelOffset?: number;
    /** Weight/encumbrance value */
    encumbrance?: number;
    /** In-game cost */
    price?: number;
    /** Is weapon silenced */
    suppressed: boolean;
    /** Available in loadout */
    canRespawnWith: boolean;
    /** Available for purchase */
    inStock: boolean;
    /** Related weapon modes (next_in_chain) */
    chainVariants: string[];
    /** Accuracy values per stance */
    stanceAccuracies: StanceAccuracy[];
    /** File path relative to packages directory (e.g., 'vanilla/weapons/ak47.weapon') */
    filePath: string;
    /** Original absolute XML file path */
    sourceFile: string;
    /** Package name (vanilla or mod) */
    packageName: string;
}

/**
 * Error encountered during weapon scanning
 */
export interface ScanError {
    /** File that caused error */
    file: string;
    /** Error message */
    error: string;
    /** Error classification */
    severity: 'error' | 'warning';
}

/**
 * Result from weapon scanning operation
 */
export interface WeaponScanResult {
    /** All scanned weapons */
    weapons: Weapon[];
    /** Errors encountered during scan */
    errors: ScanError[];
    /** Duplicate weapon keys detected */
    duplicateKeys: string[];
    /** Scan duration in milliseconds */
    scanTime: number;
}

/**
 * Column visibility preference
 */
export interface ColumnVisibility {
    /** Column identifier */
    columnId: string;
    /** Is column currently shown */
    visible: boolean;
    /** Display order (optional) */
    order?: number;
}

/**
 * Advanced search filters
 */
export interface AdvancedFilters {
    /** Range filters */
    damage?: { min: number; max: number };
    fireRate?: { min: number; max: number };
    magazineSize?: { min: number; max: number };
    encumbrance?: { min: number; max: number };
    price?: { min: number; max: number };

    /** Stance accuracy ranges */
    stanceAccuracies?: {
        [stance: string]: { min: number; max: number };
    };

    /** Exact match filters */
    classTag?: string;           // assault, sniper, smg, etc.
    suppressed?: boolean;        // true/false
    canRespawnWith?: boolean;    // true/false
}

/**
 * Weapon column keys (6 default columns for 800x600 + filePath)
 */
export type WeaponColumnKey =
    | 'key'
    | 'name'
    | 'class'
    | 'magazineSize'
    | 'killProbability'
    | 'retriggerTime'
    | 'filePath';

/**
 * Weapon column configuration
 */
export interface WeaponColumn {
    /** Column key */
    key: WeaponColumnKey;
    /** Field name in Weapon interface */
    field: keyof Weapon;
    /** Default label (fallback) */
    label: string;
    /** i18n key for translation */
    i18nKey: string;
    /** Text alignment */
    alignment: 'left' | 'center' | 'right';
    /** Always visible (cannot be toggled) */
    alwaysVisible?: boolean;
}
