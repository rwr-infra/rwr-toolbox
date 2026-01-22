import { Injectable, signal, computed } from '@angular/core';
import type {
    DirectoryErrorCode,
    ValidationResult,
} from '../../shared/models/directory.models';
import {
    AppSettings,
    ApiEndpoint,
    FavoriteItem,
    ScanDirectory,
} from '../../shared/models/common.models';
import { DEFAULT_COLUMN_VISIBILITY } from '../../features/players/player-columns';
import { DEFAULT_SERVER_COLUMN_VISIBILITY } from '../../features/servers/server-columns';

/**
 * Default application settings
 */
const DEFAULT_SETTINGS: AppSettings = {
    apiEndpoint: 'global',
    gameInstallDirectory: null,
    serverPageSize: 100,
    playerPageSize: 100,
    enablePing: true,
    pingTimeout: 10000,
    cacheEnabled: true,
    favorites: [],
    playerColumnVisibility: DEFAULT_COLUMN_VISIBILITY,
    serverColumnVisibility: DEFAULT_SERVER_COLUMN_VISIBILITY,
    modInstallHistory: [],
    scanDirectories: [],
    selectedDirectoryId: null,
};

/**
 * Available API endpoints
 */
const AVAILABLE_ENDPOINTS: ApiEndpoint[] = [
    { key: 'cn', label: '中国大陆', host: 'robin.kreedzt.cn' },
    { key: 'global', label: '全球', host: 'robin.kreedzt.com' },
];

/**
 * Settings service with Tauri Store persistence
 * Falls back to localStorage for web mode
 */
@Injectable({
    providedIn: 'root',
})
export class SettingsService {
    // Reactive settings using signals
    private settingsState = signal<AppSettings>(DEFAULT_SETTINGS);

    private getDirectoryErrorMessageKey(errorCode: DirectoryErrorCode): string {
        const messages: Record<DirectoryErrorCode, string> = {
            path_not_found: 'settings.errors.pathNotFound',
            not_a_directory: 'settings.errors.notADirectory',
            access_denied: 'settings.errors.accessDenied',
            missing_media_subdirectory:
                'settings.errors.missingMediaSubdirectory',
            packages_not_found: 'settings.errors.packagesNotFound',
            duplicate_directory: 'settings.errors.duplicateDirectory',
        };

        return messages[errorCode] || 'settings.errors.unknown';
    }

    private gameDirValidationState = signal<ValidationResult | null>(null);

    /** Latest validation for game install directory */
    readonly gameInstallDirectoryValidation = computed(() =>
        this.gameDirValidationState(),
    );

    /** Current settings */
    readonly settings = computed(() => this.settingsState());

    /** Available endpoints */
    readonly endpoints = AVAILABLE_ENDPOINTS;

    /** Local storage key */
    private readonly LOCAL_STORAGE_KEY = 'app_settings';

    /** Tauri store filename (desktop) */
    private readonly TAURI_STORE_FILE = 'settings.json';

    /** Cached store instance promise */
    private storePromise: Promise<{
        get: (key: string) => Promise<any>;
        set: (key: string, value: any) => Promise<void>;
        save: () => Promise<void>;
    } | null> | null = null;

    private async getTauriStore(): Promise<{
        get: (key: string) => Promise<any>;
        set: (key: string, value: any) => Promise<void>;
        save: () => Promise<void>;
    } | null> {
        if (this.storePromise) return this.storePromise;

        this.storePromise = (async () => {
            try {
                // Dynamic import to keep web builds working
                const mod = await import('@tauri-apps/plugin-store');
                // v2: Store constructor is private; use Store.load(...)
                const store = await mod.Store.load(this.TAURI_STORE_FILE);
                return store as any;
            } catch {
                return null;
            }
        })();

        return this.storePromise;
    }

    /**
     * Initialize settings from storage
     */
    async initialize(): Promise<void> {
        // Desktop: prefer Tauri Store. Web: fallback to localStorage.
        const store = await this.getTauriStore();
        let stored: any = null;

        if (store) {
            try {
                stored = await store.get(this.LOCAL_STORAGE_KEY);
            } catch (error) {
                console.error(
                    'Failed to load settings from Tauri Store:',
                    error,
                );
            }
        }

        if (!stored) {
            try {
                const storedJson = localStorage.getItem(this.LOCAL_STORAGE_KEY);
                stored = storedJson ? JSON.parse(storedJson) : null;
            } catch (error) {
                console.error(
                    'Failed to load settings from localStorage:',
                    error,
                );
            }
        }

        if (stored) {
            // T010: Legacy migration (pre-001-game-path-setup)
            // Previously we used a single `gamePath` which later got migrated into `scanDirectories`.
            // Keep this migration for backwards compatibility, but store it as `gameInstallDirectory`
            // (the dedicated base-game setting) instead of a scan directory.
            if (stored.gamePath && stored.gamePath.trim() !== '') {
                stored.gameInstallDirectory = stored.gamePath.trim();
                delete stored.gamePath;
            }

            this.settingsState.set({ ...DEFAULT_SETTINGS, ...stored });

            // Persist if we made migration changes.
            if (store) {
                try {
                    await store.set(this.LOCAL_STORAGE_KEY, stored);
                    await store.save();
                } catch (error) {
                    console.error(
                        'Failed to save migrated settings to Tauri Store:',
                        error,
                    );
                }
            } else {
                try {
                    localStorage.setItem(
                        this.LOCAL_STORAGE_KEY,
                        JSON.stringify(stored),
                    );
                } catch (error) {
                    console.error(
                        'Failed to save migrated settings to localStorage:',
                        error,
                    );
                }
            }
        }
    }

    /**
     * Update settings
     * @param updates Partial settings to update
     */
    async updateSettings(updates: Partial<AppSettings>): Promise<void> {
        const newSettings = { ...this.settingsState(), ...updates };
        this.settingsState.set(newSettings);

        const store = await this.getTauriStore();
        if (store) {
            try {
                await store.set(this.LOCAL_STORAGE_KEY, newSettings);
                await store.save();
                return;
            } catch (error) {
                console.error('Failed to save settings to Tauri Store:', error);
            }
        }

        try {
            localStorage.setItem(
                this.LOCAL_STORAGE_KEY,
                JSON.stringify(newSettings),
            );
        } catch (error) {
            console.error('Failed to save settings to localStorage:', error);
        }
    }

    /**
     * Get the current API endpoint host
     * @returns Host address
     */
    getEndpoint(): string {
        const endpointKey = this.settingsState().apiEndpoint;
        const endpoint = this.endpoints.find((e) => e.key === endpointKey);
        return endpoint?.host ?? AVAILABLE_ENDPOINTS[1].host;
    }

    /**
     * Get the current API endpoint
     * @returns Full endpoint object
     */
    getEndpointConfig(): ApiEndpoint {
        const endpointKey = this.settingsState().apiEndpoint;
        return (
            this.endpoints.find((e) => e.key === endpointKey) ??
            AVAILABLE_ENDPOINTS[1]
        );
    }

    /**
     * Add a favorite item
     * @param item Favorite item to add
     */
    async addFavorite(item: FavoriteItem): Promise<void> {
        const currentFavorites = this.settingsState().favorites;
        const exists = currentFavorites.some(
            (f) => f.id === item.id && f.type === item.type,
        );

        if (!exists) {
            await this.updateSettings({
                favorites: [...currentFavorites, item],
            });
        }
    }

    /**
     * Remove a favorite item
     * @param id Item ID
     * @param type Item type ('server' or 'player')
     */
    async removeFavorite(id: string, type: 'server' | 'player'): Promise<void> {
        const currentFavorites = this.settingsState().favorites;
        await this.updateSettings({
            favorites: currentFavorites.filter(
                (f) => !(f.id === id && f.type === type),
            ),
        });
    }

    /**
     * Get favorite IDs by type
     * @param type Item type
     * @returns Array of favorite IDs
     */
    getFavorites(type: 'server' | 'player'): string[] {
        return this.settingsState()
            .favorites.filter((f) => f.type === type)
            .map((f) => f.id);
    }

    /**
     * Check if item is favorited
     * @param id Item ID
     * @param type Item type
     * @returns True if favorited
     */
    isFavorite(id: string, type: 'server' | 'player'): boolean {
        return this.settingsState().favorites.some(
            (f) => f.id === id && f.type === type,
        );
    }

    /**
     * Toggle favorite status
     * @param id Item ID
     * @param type Item type
     */
    async toggleFavorite(id: string, type: 'server' | 'player'): Promise<void> {
        if (this.isFavorite(id, type)) {
            await this.removeFavorite(id, type);
        } else {
            await this.addFavorite({
                id,
                type,
                addedAt: Date.now(),
            });
        }
    }

    /**
     * Reset settings to defaults
     */
    async resetToDefaults(): Promise<void> {
        this.settingsState.set(DEFAULT_SETTINGS);
        await this.updateSettings(DEFAULT_SETTINGS);
    }

    /**
     * Get player column visibility settings
     * @returns Column visibility record
     */
    getPlayerColumnVisibility(): Record<string, boolean> {
        return this.settingsState().playerColumnVisibility;
    }

    /**
     * Check if a specific player column is visible
     * @param key Column key
     * @returns True if visible
     */
    isPlayerColumnVisible(key: string): boolean {
        const visibility = this.settingsState()
            .playerColumnVisibility as unknown as Record<string, boolean>;
        return visibility[key] ?? false;
    }

    /**
     * Toggle visibility of a player column
     * @param key Column key
     */
    async togglePlayerColumn(key: string): Promise<void> {
        const current = this.settingsState()
            .playerColumnVisibility as unknown as Record<string, boolean>;
        const updated = {
            ...current,
            [key]: !current[key],
        };
        await this.updateSettings({ playerColumnVisibility: updated as any });
    }

    /**
     * Set player column visibility
     * @param visibility Complete visibility record
     */
    async setPlayerColumnVisibility(
        visibility: Record<string, boolean>,
    ): Promise<void> {
        await this.updateSettings({
            playerColumnVisibility: visibility as any,
        });
    }

    /**
     * Reset player column visibility to defaults
     */
    async resetPlayerColumnVisibility(): Promise<void> {
        await this.updateSettings({
            playerColumnVisibility: DEFAULT_COLUMN_VISIBILITY,
        });
    }

    /**
     * Get server column visibility settings
     * @returns Column visibility record
     */
    getServerColumnVisibility(): Record<string, boolean> {
        return this.settingsState().serverColumnVisibility;
    }

    /**
     * Check if a specific server column is visible
     * @param key Column key
     * @returns True if visible
     */
    isServerColumnVisible(key: string): boolean {
        const visibility = this.settingsState()
            .serverColumnVisibility as unknown as Record<string, boolean>;
        return visibility[key] ?? false;
    }

    /**
     * Toggle visibility of a server column
     * @param key Column key
     */
    async toggleServerColumn(key: string): Promise<void> {
        const current = this.settingsState()
            .serverColumnVisibility as unknown as Record<string, boolean>;
        const updated = {
            ...current,
            [key]: !current[key],
        };
        await this.updateSettings({ serverColumnVisibility: updated as any });
    }

    /**
     * Set server column visibility
     * @param visibility Complete visibility record
     */
    async setServerColumnVisibility(
        visibility: Record<string, boolean>,
    ): Promise<void> {
        await this.updateSettings({
            serverColumnVisibility: visibility as any,
        });
    }

    /**
     * Reset server column visibility to defaults
     */
    async resetServerColumnVisibility(): Promise<void> {
        await this.updateSettings({
            serverColumnVisibility: DEFAULT_SERVER_COLUMN_VISIBILITY,
        });
    }

    /**
     * Get scan directories for multi-directory support
     * @returns Array of configured scan directories
     */
    getScanDirectories(): ScanDirectory[] {
        return this.settingsState().scanDirectories;
    }

    /**
     * Update scan directories for multi-directory support
     * @param directories Updated array of scan directories
     */
    async updateScanDirectories(directories: ScanDirectory[]): Promise<void> {
        await this.updateSettings({ scanDirectories: directories });
    }

    getGameInstallDirectory(): string | null {
        return this.settingsState().gameInstallDirectory;
    }

    async setGameInstallDirectory(path: string | null): Promise<void> {
        await this.updateSettings({ gameInstallDirectory: path });
    }

    async validateGameInstallDirectory(
        path?: string | null,
    ): Promise<ValidationResult> {
        const value = (path ?? this.getGameInstallDirectory())?.trim() ?? '';
        if (!value) {
            const result: ValidationResult = {
                valid: false,
                errorCode: null,
                message: 'settings.errors.gamePathNotSet',
            };
            this.gameDirValidationState.set(result);
            return result;
        }

        try {
            // Dynamic import keeps web builds working.
            const mod = await import('@tauri-apps/api/core');
            const raw = await mod.invoke<any>(
                'validate_game_install_directory',
                {
                    path: value,
                },
            );

            const errorCode = (raw.errorCode ??
                null) as DirectoryErrorCode | null;
            const result: ValidationResult = {
                valid: raw.valid,
                errorCode,
                message: errorCode
                    ? this.getDirectoryErrorMessageKey(errorCode)
                    : 'settings.pathValid',
                details: raw.details ?? undefined,
                packageCount: raw.packageCount,
            };

            this.gameDirValidationState.set(result);
            return result;
        } catch (e) {
            console.error(
                '[SettingsService] validateGameInstallDirectory failed:',
                e,
            );

            const result: ValidationResult = {
                valid: false,
                errorCode: 'access_denied',
                message: 'settings.errors.accessDenied',
            };
            this.gameDirValidationState.set(result);
            return result;
        }
    }
}
