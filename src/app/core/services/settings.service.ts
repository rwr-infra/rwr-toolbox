import { Injectable, signal, computed } from '@angular/core';
import {
    AppSettings,
    ApiEndpoint,
    FavoriteItem,
} from '../../shared/models/common.models';
import { DEFAULT_COLUMN_VISIBILITY } from '../../features/players/player-columns';
import { DEFAULT_SERVER_COLUMN_VISIBILITY } from '../../features/servers/server-columns';

/**
 * Default application settings
 */
const DEFAULT_SETTINGS: AppSettings = {
    apiEndpoint: 'global',
    serverPageSize: 100,
    playerPageSize: 100,
    enablePing: true,
    pingTimeout: 10000,
    cacheEnabled: true,
    favorites: [],
    playerColumnVisibility: DEFAULT_COLUMN_VISIBILITY,
    serverColumnVisibility: DEFAULT_SERVER_COLUMN_VISIBILITY,
    gamePath: '',
    modInstallHistory: [],
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
        if (store) {
            try {
                const stored = await store.get(this.LOCAL_STORAGE_KEY);
                if (stored) {
                    this.settingsState.set({ ...DEFAULT_SETTINGS, ...stored });
                }
                return;
            } catch (error) {
                console.error(
                    'Failed to load settings from Tauri Store:',
                    error,
                );
            }
        }

        try {
            const stored = localStorage.getItem(this.LOCAL_STORAGE_KEY);
            if (stored) {
                const parsed = JSON.parse(stored);
                this.settingsState.set({ ...DEFAULT_SETTINGS, ...parsed });
            }
        } catch (error) {
            console.error('Failed to load settings from localStorage:', error);
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
     * Get the game directory path
     * @returns Game path or empty string if not set
     */
    getGamePath(): string {
        return this.settingsState().gamePath ?? '';
    }

    /**
     * Set the game directory path
     * @param path Game directory path
     */
    async setGamePath(path: string): Promise<void> {
        await this.updateSettings({ gamePath: path });
    }
}
