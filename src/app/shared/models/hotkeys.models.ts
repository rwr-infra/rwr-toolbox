/**
 * Raw XML hotkey configuration item
 */
export interface IHotkeyRawItem {
    '@_index': string;
    '@_text': string;
    '#text'?: string;
}

/**
 * Raw XML configuration root node
 */
export interface IHotkeyRawConfig {
    hotkeys: {
        hotkey: IHotkeyRawItem[];
    };
}

/**
 * Hotkey configuration item (internal format)
 */
export interface IHotkeyConfigItem {
    /** Hotkey label / function description */
    label: string;
    /** Key combination / value */
    value: string;
}

/**
 * Profile configuration
 */
export interface IHotkeyProfile {
    /** Unique identifier */
    id: string;
    /** Profile title */
    title: string;
    /** Hotkey configuration list */
    config: IHotkeyConfigItem[];
    /** Creation timestamp */
    createdAt: number;
    /** Update timestamp */
    updatedAt: number;
}

/**
 * All profiles configuration
 */
export interface IHotkeyProfilesConfig {
    /** Profile list */
    profiles: IHotkeyProfile[];
    /** Currently active profile ID */
    activeProfileId: string | null;
}

/**
 * Create Profile DTO (without id and timestamps)
 */
export interface IHotkeyProfileCreate {
    title: string;
    config: IHotkeyConfigItem[];
}

/**
 * Hotkey conflict information
 */
export interface IHotkeyConflict {
    /** Conflicting key combination */
    keyCombination: string;
    /** Conflicting hotkey items */
    items: {
        label: string;
        index: number;
    }[];
}

/**
 * Share format for profile (portable, without id)
 */
export interface IShareProfileItem {
    type: 'profile';
    value: Omit<IHotkeyProfile, 'id'>;
}

/**
 * Type guard for share profile item
 */
export function isShareProfileItem(data: unknown): data is IShareProfileItem {
    return (
        typeof data === 'object' &&
        data !== null &&
        'type' in data &&
        (data as any).type === 'profile' &&
        'value' in data &&
        typeof (data as any).value === 'object'
    );
}
