import { Injectable, signal, computed } from '@angular/core';
import { invoke } from '@tauri-apps/api/core';
import { getVersion } from '@tauri-apps/api/app';
import { Store } from '@tauri-apps/plugin-store';

export interface VersionCheckSettings {
    lastChecked: string;
    checkFrequency: string;
    dismissedVersion: string;
    lastSeenVersion: string;
}

export interface UpdateStatus {
    currentVersion: string;
    availableVersion: string | null;
    isAvailable: boolean;
    releaseUrl: string | null;
    lastChecked: string;
    error: string | null;
}

@Injectable({
    providedIn: 'root',
})
export class VersionCheckService {
    private store: Store | null = null;

    private settingsState = signal<VersionCheckSettings>({
        lastChecked: '0',
        checkFrequency: 'weekly',
        dismissedVersion: '',
        lastSeenVersion: '',
    });

    private updateStatusState = signal<UpdateStatus>({
        currentVersion: '',
        availableVersion: null,
        isAvailable: false,
        releaseUrl: null,
        lastChecked: '0',
        error: null,
    });

    private isCheckingState = signal(false);

    readonly settings = computed(() => this.settingsState());
    readonly updateStatus = computed(() => this.updateStatusState());
    readonly isChecking = computed(() => this.isCheckingState());

    async initialize() {
        try {
            this.store = await Store.load('settings.json');
            await this.loadSettings();
        } catch (error) {
            console.error('Failed to initialize store:', error);
        }
    }

    private async loadSettings() {
        if (!this.store) return;

        try {
            const settings =
                await this.store?.get<VersionCheckSettings>('versionCheck');
            if (settings) {
                this.settingsState.set({
                    lastChecked: settings.lastChecked ?? '0',
                    checkFrequency: settings.checkFrequency ?? 'weekly',
                    dismissedVersion:
                        settings.dismissedVersion ??
                        (settings as unknown as { dismissed_version?: string })
                            .dismissed_version ??
                        '',
                    lastSeenVersion: settings.lastSeenVersion ?? '',
                });
            } else {
                await this.initializeDefaultSettings();
            }
        } catch (error) {
            console.error('Failed to load settings:', error);
        }
    }

    private async initializeDefaultSettings() {
        const defaultSettings: VersionCheckSettings = {
            lastChecked: '0',
            checkFrequency: 'weekly',
            dismissedVersion: '',
            lastSeenVersion: await this.getCurrentVersion(),
        };

        await this.saveSettings(defaultSettings);
        this.settingsState.set(defaultSettings);
    }

    private async saveSettings(settings: VersionCheckSettings) {
        if (!this.store) return;

        try {
            await this.store?.set('versionCheck', settings);
            await this.store?.save();
        } catch (error) {
            console.error('Failed to save settings:', error);
        }
    }

    async getCurrentVersion(): Promise<string> {
        try {
            return await getVersion();
        } catch {
            return '0.0.0';
        }
    }

    async checkForUpdates(): Promise<void> {
        if (this.isCheckingState()) return;

        this.isCheckingState.set(true);

        console.log(
            '[VersionCheck] Starting version check with settings:',
            this.settingsState(),
        );

        try {
            const settings = this.settingsState();
            const result: UpdateStatus = await invoke('trigger_version_check', {
                settings,
            });

            console.log('[VersionCheck] Backend response:', result);

            this.updateStatusState.set(result);

            await this.updateLastChecked();
            if (result.availableVersion) {
                await this.updateLastSeenVersion(result.availableVersion);
            }
        } catch (error) {
            console.error('[VersionCheck] Failed to check for updates:', error);
            const errorMessage = String(error);
            this.updateStatusState.update((status) => ({
                currentVersion: status.currentVersion,
                availableVersion: status.availableVersion,
                isAvailable: status.isAvailable,
                releaseUrl: status.releaseUrl,
                lastChecked: status.lastChecked,
                error: errorMessage,
            }));
        } finally {
            this.isCheckingState.set(false);
        }
    }

    async dismiss_update(version: string): Promise<void> {
        try {
            await this.updateDismissedVersion(version);
        } catch (error) {
            console.error('Failed to dismiss update:', error);
        }
    }

    private async updateLastChecked() {
        const now = Math.floor(Date.now() / 1000).toString();
        const settings = this.settingsState();
        await this.saveSettings({ ...settings, lastChecked: now });
    }

    private async updateLastSeenVersion(version: string) {
        const settings = this.settingsState();
        await this.saveSettings({ ...settings, lastSeenVersion: version });
    }

    private async updateDismissedVersion(version: string) {
        const settings = this.settingsState();
        await this.saveSettings({ ...settings, dismissedVersion: version });
        this.updateStatusState.update((status) => ({
            ...status,
            isAvailable: false,
        }));
    }
}
