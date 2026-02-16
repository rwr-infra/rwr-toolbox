import { Injectable, inject, signal, computed } from '@angular/core';
import { Observable, from, throwError } from 'rxjs';
import { catchError, tap, finalize, switchMap, map } from 'rxjs/operators';
import { invoke } from '@tauri-apps/api/core';
import { save, open } from '@tauri-apps/plugin-dialog';
import { readText, writeText } from '@tauri-apps/plugin-clipboard-manager';
import {
    IHotkeyProfile,
    IHotkeyProfilesConfig,
    IHotkeyConfigItem,
    IHotkeyProfileCreate,
    IHotkeyConflict,
} from '../../../shared/models/hotkeys.models';
import { SettingsService } from '../../../core/services/settings.service';
import {
    transformProfileToShare,
    transformShareToProfile,
    validateShareFormat,
    serializeShareItem,
} from '../../../shared/utils/hotkey-share.utils';

/**
 * Service for managing game hotkeys
 */
@Injectable({
    providedIn: 'root',
})
export class HotkeyService {
    private settingsService = inject(SettingsService);
    private readonly defaultHotkeysConfig: IHotkeyConfigItem[] = [
        { label: 'Hotkey 1', value: 'enter here text for Hotkey 1' },
        { label: 'Hotkey 2', value: 'enter here text for Hotkey 2' },
        { label: 'Hotkey 3', value: 'enter here text for Hotkey 3' },
        { label: 'Hotkey 4', value: 'enter here text for Hotkey 4' },
        { label: 'Hotkey 5', value: 'enter here text for Hotkey 5' },
        { label: 'Hotkey 6', value: 'enter here text for Hotkey 6' },
        { label: 'Hotkey 7', value: 'enter here text for Hotkey 7' },
        { label: 'Hotkey 8', value: 'enter here text for Hotkey 8' },
        { label: 'Hotkey 9', value: 'enter here text for Hotkey 9' },
        { label: 'Hotkey 10', value: 'enter here text for Hotkey 10' },
    ];

    // State management with signals (Principle IX: Signal管状态)
    private loadingState = signal<boolean>(false);
    private errorState = signal<string | null>(null);
    private profilesState = signal<IHotkeyProfilesConfig>({
        profiles: [],
        activeProfileId: null,
    });
    private currentConfigState = signal<IHotkeyConfigItem[]>([]);

    /** Readonly signal streams */
    readonly loadingSig = this.loadingState.asReadonly();
    readonly errorSig = this.errorState.asReadonly();
    readonly profilesSig = this.profilesState.asReadonly();
    readonly currentConfigSig = this.currentConfigState.asReadonly();

    /** Currently active profile (computed from profiles state) */
    readonly activeProfileSig = computed(() => {
        const config = this.profilesState();
        if (!config.activeProfileId) return null;
        return (
            config.profiles.find((p) => p.id === config.activeProfileId) || null
        );
    });

    private resolveGamePath(): string | null {
        const gameInstallDirectory =
            this.settingsService.getGameInstallDirectory()?.trim() ?? '';
        if (gameInstallDirectory) {
            return gameInstallDirectory;
        }

        const directories = this.settingsService.getScanDirectories();
        const firstValid = directories.find((d) => d.status === 'valid');
        return firstValid?.path ?? null;
    }

    getConfiguredGamePath(): string | null {
        return this.resolveGamePath();
    }

    /**
     * Initialize: load profiles
     */
    initialize(): Observable<void> {
        this.loadingState.set(true);
        this.errorState.set(null);

        return from(invoke<string>('read_profiles')).pipe(
            map((result) => JSON.parse(result) as IHotkeyProfilesConfig),
            tap((config) => this.profilesState.set(config)),
            catchError((error) => {
                this.errorState.set(`Failed to load profiles: ${error}`);
                return throwError(() => error);
            }),
            finalize(() => {
                this.loadingState.set(false);
            }),
            map(() => undefined),
        );
    }

    /**
     * Read hotkey configuration from game directory
     */
    readFromGame(): Observable<IHotkeyConfigItem[]> {
        const gamePath = this.resolveGamePath();

        if (!gamePath) {
            const errorKey = 'hotkeys.no_game_path_desc';
            this.errorState.set(errorKey);
            return throwError(() => errorKey);
        }

        this.loadingState.set(true);
        this.errorState.set(null);

        return from(invoke<string>('read_hotkeys', { gamePath })).pipe(
            switchMap((xmlContent) => {
                return from(invoke<string>('parse_hotkeys', { xmlContent }));
            }),
            map((result) => JSON.parse(result) as IHotkeyConfigItem[]),
            tap((config) => {
                this.currentConfigState.set(config);
            }),
            catchError((error) => {
                const errorKey = this.mapReadErrorToKey(error);
                this.errorState.set(errorKey);
                return throwError(() => errorKey);
            }),
            finalize(() => {
                this.loadingState.set(false);
            }),
        );
    }

    createDefaultHotkeys(): Observable<void> {
        return this.writeToGame([...this.defaultHotkeysConfig]);
    }

    createDefaultHotkeysAndActivateProfile(title: string): Observable<void> {
        return this.createDefaultHotkeys().pipe(
            switchMap(() => this.readFromGame()),
            switchMap((config) => this.upsertAndActivateProfile(title, config)),
        );
    }

    syncReadConfigToProfilesWhenEmpty(
        title: string,
        config: IHotkeyConfigItem[],
    ): Observable<void> {
        const current = this.profilesState();
        if (current.profiles.length > 0) {
            return from(Promise.resolve());
        }

        return this.upsertAndActivateProfile(title, config);
    }

    /**
     * Write hotkey configuration to game directory
     */
    writeToGame(config: IHotkeyConfigItem[]): Observable<void> {
        const gamePath = this.resolveGamePath();

        if (!gamePath) {
            const errorKey = 'hotkeys.no_game_path_desc';
            this.errorState.set(errorKey);
            return throwError(() => errorKey);
        }

        this.loadingState.set(true);
        this.errorState.set(null);

        return from(invoke<string>('generate_hotkeys', { config })).pipe(
            switchMap((xmlContent) => {
                return from(
                    invoke('write_hotkeys', {
                        gamePath,
                        xmlContent,
                    }),
                );
            }),
            map(() => undefined),
            catchError((error) => {
                this.errorState.set(`Failed to write hotkeys: ${error}`);
                return throwError(() => error);
            }),
            finalize(() => {
                this.loadingState.set(false);
            }),
        );
    }

    /**
     * Create new profile
     */
    createProfile(create: IHotkeyProfileCreate): Observable<IHotkeyProfile> {
        const newProfile: IHotkeyProfile = {
            id: this.generateId(),
            title: create.title,
            config: create.config,
            createdAt: Date.now(),
            updatedAt: Date.now(),
        };

        const current = this.profilesState();
        const updated: IHotkeyProfilesConfig = {
            ...current,
            profiles: [...current.profiles, newProfile],
        };

        return this.saveProfiles(updated).pipe(map(() => newProfile));
    }

    /**
     * Update profile
     */
    updateProfile(
        id: string,
        updates: Partial<IHotkeyProfileCreate>,
    ): Observable<void> {
        const current = this.profilesState();
        const profileIndex = current.profiles.findIndex((p) => p.id === id);

        if (profileIndex === -1) {
            return throwError(() => 'Profile not found');
        }

        const updatedProfiles = [...current.profiles];
        updatedProfiles[profileIndex] = {
            ...updatedProfiles[profileIndex],
            ...updates,
            updatedAt: Date.now(),
        };

        const updated: IHotkeyProfilesConfig = {
            ...current,
            profiles: updatedProfiles,
        };

        return this.saveProfiles(updated);
    }

    /**
     * Delete profile
     */
    deleteProfile(id: string): Observable<void> {
        const current = this.profilesState();

        const updated: IHotkeyProfilesConfig = {
            profiles: current.profiles.filter((p) => p.id !== id),
            activeProfileId:
                current.activeProfileId === id ? null : current.activeProfileId,
        };

        return this.saveProfiles(updated);
    }

    /**
     * Apply profile to game (also sets as active)
     */
    applyProfile(id: string): Observable<void> {
        const profile = this.profilesState().profiles.find((p) => p.id === id);
        if (!profile) {
            return throwError(() => 'Profile not found');
        }

        return this.writeToGame(profile.config).pipe(
            tap(() => {
                this.currentConfigState.set(profile.config);
                // Also mark as active
                const current = this.profilesState();
                this.profilesState.set({
                    ...current,
                    activeProfileId: id,
                });
            }),
        );
    }

    /**
     * Export profile
     */
    async exportProfile(id: string): Promise<void> {
        const profile = this.profilesState().profiles.find((p) => p.id === id);
        if (!profile) {
            throw new Error('Profile not found');
        }

        const filePath = await save({
            filters: [
                {
                    name: 'RWR Hotkey Profile',
                    extensions: ['json'],
                },
            ],
            defaultPath: `${profile.title}.json`,
        });

        if (filePath) {
            await invoke('export_profile', {
                profileJson: JSON.stringify(profile, null, 2),
                filePath,
            });
        }
    }

    /**
     * Import profile
     */
    async importProfile(): Promise<void> {
        const filePath = await open({
            filters: [
                {
                    name: 'RWR Hotkey Profile',
                    extensions: ['json'],
                },
            ],
        });

        if (filePath) {
            const profileJson = await invoke<string>('import_profile', {
                filePath,
            });
            const profile: IHotkeyProfile = JSON.parse(profileJson);

            // Generate new ID to avoid conflicts
            const newProfile: IHotkeyProfile = {
                ...profile,
                id: this.generateId(),
                createdAt: Date.now(),
                updatedAt: Date.now(),
            };

            const current = this.profilesState();
            const updated: IHotkeyProfilesConfig = {
                ...current,
                profiles: [...current.profiles, newProfile],
            };

            await this.saveProfiles(updated).toPromise();
        }
    }

    /**
     * Open hotkeys.xml in external editor
     */
    async openInEditor(): Promise<void> {
        const gamePath = this.resolveGamePath();

        if (!gamePath) {
            const errorKey = 'hotkeys.no_game_path_desc';
            this.errorState.set(errorKey);
            throw new Error(errorKey);
        }

        try {
            this.errorState.set(null);
            await invoke('open_hotkeys_in_editor', { gamePath });
        } catch (error) {
            this.errorState.set(`Failed to open editor: ${error}`);
            throw error;
        }
    }

    /**
     * Detect hotkey conflicts
     */
    detectConflicts(config: IHotkeyConfigItem[]): IHotkeyConflict[] {
        const keyMap = new Map<string, { label: string; index: number }[]>();

        config.forEach((item, index) => {
            const key = item.value.toLowerCase();
            if (!keyMap.has(key)) {
                keyMap.set(key, []);
            }
            keyMap.get(key)!.push({ label: item.label, index });
        });

        const conflicts: IHotkeyConflict[] = [];
        keyMap.forEach((items, keyCombination) => {
            if (items.length > 1) {
                conflicts.push({ keyCombination, items });
            }
        });

        return conflicts;
    }

    /**
     * Save profiles to storage
     */
    private saveProfiles(config: IHotkeyProfilesConfig): Observable<void> {
        const configJson = JSON.stringify(config);

        return from(invoke('save_profiles', { profilesJson: configJson })).pipe(
            tap(() => {
                this.profilesState.set(config);
            }),
            map(() => undefined),
            catchError((error) => {
                this.errorState.set(`Failed to save profiles: ${error}`);
                return throwError(() => error);
            }),
        );
    }

    private upsertAndActivateProfile(
        title: string,
        config: IHotkeyConfigItem[],
    ): Observable<void> {
        const now = Date.now();
        const current = this.profilesState();
        const existing = current.profiles.find(
            (profile) => profile.title === title,
        );

        const profiles = existing
            ? current.profiles.map((profile) =>
                  profile.id === existing.id
                      ? {
                            ...profile,
                            config,
                            updatedAt: now,
                        }
                      : profile,
              )
            : [
                  ...current.profiles,
                  {
                      id: this.generateId(),
                      title,
                      config,
                      createdAt: now,
                      updatedAt: now,
                  },
              ];

        const activeProfileId = existing
            ? existing.id
            : profiles[profiles.length - 1].id;

        return this.saveProfiles({
            profiles,
            activeProfileId,
        });
    }

    /**
     * Generate unique ID
     */
    private generateId(): string {
        return `profile_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
    }

    /**
     * Clear error state
     */
    clearError(): void {
        this.errorState.set(null);
    }

    private mapReadErrorToKey(error: unknown): string {
        const message =
            typeof error === 'string'
                ? error
                : error instanceof Error
                  ? error.message
                  : String(error);

        if (message.startsWith('hotkeys.')) {
            return message;
        }

        if (message.includes('hotkeys.xml not found')) {
            return 'hotkeys.hotkeys_file_missing';
        }

        if (message.includes('Failed to parse XML')) {
            return 'hotkeys.read_parse_failed';
        }

        return 'hotkeys.read_failed';
    }

    /**
     * Share profile to clipboard
     */
    async shareProfile(id: string): Promise<void> {
        const profile = this.profilesState().profiles.find((p) => p.id === id);
        if (!profile) {
            throw new Error('Profile not found');
        }

        const shareItem = transformProfileToShare(profile);
        await writeText(serializeShareItem(shareItem));
    }

    /**
     * Import profile from clipboard
     */
    async importProfileFromClipboard(): Promise<IHotkeyProfile> {
        const clipboardText = await readText();
        if (!clipboardText) {
            throw new Error('Clipboard is empty');
        }

        const shareItem = validateShareFormat(clipboardText);
        if (!shareItem) {
            throw new Error('Invalid share format');
        }

        const profileData = transformShareToProfile(shareItem);
        const newProfile: IHotkeyProfile = {
            id: this.generateId(),
            title: `${profileData.title} (Imported)`,
            config: profileData.config,
            createdAt: Date.now(),
            updatedAt: Date.now(),
        };

        const current = this.profilesState();
        const updated: IHotkeyProfilesConfig = {
            ...current,
            profiles: [...current.profiles, newProfile],
        };

        await this.saveProfiles(updated).toPromise();
        return newProfile;
    }

    /**
     * Validate clipboard content as share format
     */
    async validateClipboard(): Promise<boolean> {
        try {
            const clipboardText = await readText();
            return clipboardText
                ? validateShareFormat(clipboardText) !== null
                : false;
        } catch {
            return false;
        }
    }
}
