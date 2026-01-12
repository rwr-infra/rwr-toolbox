import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Observable, from, throwError } from 'rxjs';
import { catchError, tap, finalize, switchMap, map } from 'rxjs/operators';
import { invoke } from '@tauri-apps/api/core';
import { save, open } from '@tauri-apps/plugin-dialog';
import { readText, writeText } from '@tauri-apps/plugin-clipboard-manager';
import {
    IHotkeyProfile,
    IHotkeyProfilesConfig,
    IHotkeyConfigItem,
    IHotkeyProfileCreate,
    IHotkeyConflict
} from '../../../shared/models/hotkeys.models';
import { SettingsService } from '../../../core/services/settings.service';
import { transformProfileToShare, transformShareToProfile, validateShareFormat, serializeShareItem } from '../../../shared/utils/hotkey-share.utils';

/**
 * Service for managing game hotkeys
 */
@Injectable({
    providedIn: 'root'
})
export class HotkeyService {
    private settingsService = inject(SettingsService);

    // State management with BehaviorSubjects
    private loadingSubject = new BehaviorSubject<boolean>(false);
    private errorSubject = new BehaviorSubject<string | null>(null);
    private profilesSubject = new BehaviorSubject<IHotkeyProfilesConfig>({
        profiles: [],
        activeProfileId: null
    });
    private currentConfigSubject = new BehaviorSubject<IHotkeyConfigItem[]>([]);

    /** Observable streams */
    readonly loading$ = this.loadingSubject.asObservable();
    readonly error$ = this.errorSubject.asObservable();
    readonly profiles$ = this.profilesSubject.asObservable();
    readonly currentConfig$ = this.currentConfigSubject.asObservable();

    /** Currently active profile */
    readonly activeProfile = this.profilesSubject.pipe(
        map(config => {
            if (!config.activeProfileId) return null;
            return config.profiles.find(p => p.id === config.activeProfileId) || null;
        })
    );

    /**
     * Initialize: load profiles
     */
    initialize(): Observable<void> {
        this.loadingSubject.next(true);
        this.errorSubject.next(null);

        return from(invoke<string>('read_profiles')).pipe(
            map(result => JSON.parse(result) as IHotkeyProfilesConfig),
            tap(config => this.profilesSubject.next(config)),
            catchError(error => {
                this.errorSubject.next(`Failed to load profiles: ${error}`);
                return throwError(() => error);
            }),
            finalize(() => {
                this.loadingSubject.next(false);
            }),
            map(() => undefined)
        );
    }

    /**
     * Read hotkey configuration from game directory
     */
    readFromGame(): Observable<IHotkeyConfigItem[]> {
        const gamePath = this.settingsService.settings().gamePath;
        if (!gamePath) {
            return throwError(() => 'Game path not configured');
        }

        this.loadingSubject.next(true);
        this.errorSubject.next(null);

        return from(invoke<string>('read_hotkeys', { gamePath })).pipe(
            switchMap(xmlContent => {
                return from(invoke<string>('parse_hotkeys', { xmlContent }));
            }),
            map(result => JSON.parse(result) as IHotkeyConfigItem[]),
            tap(config => {
                this.currentConfigSubject.next(config);
            }),
            catchError(error => {
                this.errorSubject.next(`Failed to read hotkeys: ${error}`);
                return throwError(() => error);
            }),
            finalize(() => {
                this.loadingSubject.next(false);
            })
        );
    }

    /**
     * Write hotkey configuration to game directory
     */
    writeToGame(config: IHotkeyConfigItem[]): Observable<void> {
        const gamePath = this.settingsService.settings().gamePath;
        if (!gamePath) {
            return throwError(() => 'Game path not configured');
        }

        this.loadingSubject.next(true);
        this.errorSubject.next(null);

        return from(invoke<string>('generate_hotkeys', { config })).pipe(
            switchMap(xmlContent => {
                return from(invoke('write_hotkeys', {
                    gamePath,
                    xmlContent
                }));
            }),
            map(() => undefined),
            catchError(error => {
                this.errorSubject.next(`Failed to write hotkeys: ${error}`);
                return throwError(() => error);
            }),
            finalize(() => {
                this.loadingSubject.next(false);
            })
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
            updatedAt: Date.now()
        };

        const current = this.profilesSubject.value;
        const updated: IHotkeyProfilesConfig = {
            ...current,
            profiles: [...current.profiles, newProfile]
        };

        return this.saveProfiles(updated).pipe(
            map(() => newProfile)
        );
    }

    /**
     * Update profile
     */
    updateProfile(id: string, updates: Partial<IHotkeyProfileCreate>): Observable<void> {
        const current = this.profilesSubject.value;
        const profileIndex = current.profiles.findIndex(p => p.id === id);

        if (profileIndex === -1) {
            return throwError(() => 'Profile not found');
        }

        const updatedProfiles = [...current.profiles];
        updatedProfiles[profileIndex] = {
            ...updatedProfiles[profileIndex],
            ...updates,
            updatedAt: Date.now()
        };

        const updated: IHotkeyProfilesConfig = {
            ...current,
            profiles: updatedProfiles
        };

        return this.saveProfiles(updated);
    }

    /**
     * Delete profile
     */
    deleteProfile(id: string): Observable<void> {
        const current = this.profilesSubject.value;

        const updated: IHotkeyProfilesConfig = {
            profiles: current.profiles.filter(p => p.id !== id),
            activeProfileId: current.activeProfileId === id ? null : current.activeProfileId
        };

        return this.saveProfiles(updated);
    }

    /**
     * Apply profile to game (also sets as active)
     */
    applyProfile(id: string): Observable<void> {
        const profile = this.profilesSubject.value.profiles.find(p => p.id === id);
        if (!profile) {
            return throwError(() => 'Profile not found');
        }

        return this.writeToGame(profile.config).pipe(
            tap(() => {
                this.currentConfigSubject.next(profile.config);
                // Also mark as active
                const current = this.profilesSubject.value;
                this.profilesSubject.next({
                    ...current,
                    activeProfileId: id
                });
            })
        );
    }

    /**
     * Export profile
     */
    async exportProfile(id: string): Promise<void> {
        const profile = this.profilesSubject.value.profiles.find(p => p.id === id);
        if (!profile) {
            throw new Error('Profile not found');
        }

        const filePath = await save({
            filters: [{
                name: 'RWR Hotkey Profile',
                extensions: ['json']
            }],
            defaultPath: `${profile.title}.json`
        });

        if (filePath) {
            await invoke('export_profile', {
                profileJson: JSON.stringify(profile, null, 2),
                filePath
            });
        }
    }

    /**
     * Import profile
     */
    async importProfile(): Promise<void> {
        const filePath = await open({
            filters: [{
                name: 'RWR Hotkey Profile',
                extensions: ['json']
            }]
        });

        if (filePath) {
            const profileJson = await invoke<string>('import_profile', { filePath });
            const profile: IHotkeyProfile = JSON.parse(profileJson);

            // Generate new ID to avoid conflicts
            const newProfile: IHotkeyProfile = {
                ...profile,
                id: this.generateId(),
                createdAt: Date.now(),
                updatedAt: Date.now()
            };

            const current = this.profilesSubject.value;
            const updated: IHotkeyProfilesConfig = {
                ...current,
                profiles: [...current.profiles, newProfile]
            };

            await this.saveProfiles(updated).toPromise();
        }
    }

    /**
     * Open hotkeys.xml in external editor
     */
    async openInEditor(): Promise<void> {
        const gamePath = this.settingsService.settings().gamePath;
        if (!gamePath) {
            throw new Error('Game path not configured');
        }

        await invoke('open_hotkeys_in_editor', { gamePath });
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
                this.profilesSubject.next(config);
            }),
            map(() => undefined),
            catchError(error => {
                this.errorSubject.next(`Failed to save profiles: ${error}`);
                return throwError(() => error);
            })
        );
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
        this.errorSubject.next(null);
    }

    /**
     * Share profile to clipboard
     */
    async shareProfile(id: string): Promise<void> {
        const profile = this.profilesSubject.value.profiles.find(p => p.id === id);
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
            updatedAt: Date.now()
        };

        const current = this.profilesSubject.value;
        const updated: IHotkeyProfilesConfig = {
            ...current,
            profiles: [...current.profiles, newProfile]
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
            return clipboardText ? validateShareFormat(clipboardText) !== null : false;
        } catch {
            return false;
        }
    }
}
