import { Injectable, signal, computed } from '@angular/core';
import { invoke } from '@tauri-apps/api/core';
import { ThemePreference, SystemTheme } from '../../shared/models/theme.models';

@Injectable({
    providedIn: 'root',
})
export class ThemeService {
    private themeSig = signal<ThemePreference>({
        themeType: 'dark',
        isAutoDetect: true,
        lastUpdated: Date.now(),
    });

    readonly theme = this.themeSig.asReadonly();
    readonly isDarkTheme = computed(() => {
        const pref = this.theme();
        if (pref.themeType === 'dark') return true;
        if (pref.themeType === 'auto' && pref.autoDetectedTheme === 'dark')
            return true;
        return false;
    });

    async initialize(): Promise<void> {
        try {
            const stored = await invoke<ThemePreference | null>(
                'get_theme_preference',
            );
            if (stored) {
                this.themeSig.set(stored);
                // Apply the loaded theme to DOM
                if (stored.themeType === 'dark') {
                    this.applyTheme('dark');
                } else if (stored.themeType === 'light') {
                    this.applyTheme('light');
                } else if (stored.themeType === 'auto' && stored.autoDetectedTheme) {
                    this.applyTheme(stored.autoDetectedTheme);
                }
            } else {
                await this.detectAndApplySystemTheme();
            }
        } catch (error) {
            console.error('Failed to load theme preference:', error);
            await this.detectAndApplySystemTheme();
        }
    }

    async setTheme(themeType: 'light' | 'dark' | 'auto'): Promise<void> {
        if (themeType === 'auto') {
            await this.detectAndApplySystemTheme();
            return;
        }

        // Explicitly narrow type since 'auto' check doesn't narrow unions
        const lightOrDark: 'light' | 'dark' = themeType as 'light' | 'dark';
        const preference: ThemePreference = {
            themeType: lightOrDark,
            isAutoDetect: false,
            lastUpdated: Date.now(),
            autoDetectedTheme: null,
        };

        this.themeSig.set(preference);
        await invoke('set_theme_preference', { preference });
        this.applyTheme(lightOrDark);
    }

    private async detectAndApplySystemTheme(): Promise<void> {
        try {
            const systemTheme = await invoke<SystemTheme>('get_system_theme');
            const detectedTheme = systemTheme.themeType || 'light';
            const preference: ThemePreference = {
                themeType: 'auto',
                isAutoDetect: true,
                lastUpdated: Date.now(),
                autoDetectedTheme: detectedTheme,
            };

            this.themeSig.set(preference);
            await invoke('set_theme_preference', { preference });
            this.applyTheme(detectedTheme);
        } catch (error) {
            console.error('Failed to detect system theme:', error);
            this.applyTheme('light');
        }
    }

    private applyTheme(themeType: 'light' | 'dark'): void {
        if (themeType === 'dark') {
            document.documentElement.setAttribute('data-theme', 'dark');
        } else {
            document.documentElement.removeAttribute('data-theme');
        }
    }
}
