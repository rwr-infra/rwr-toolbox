import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
    TranslocoDirective,
    TranslocoPipe,
    TranslocoService,
} from '@jsverse/transloco';
import { invoke } from '@tauri-apps/api/core';
import {
    SupportedLocale,
    LOCALES,
    DEFAULT_LOCALE,
} from '../../../i18n/locales';
import { SettingsService } from '../../core/services/settings.service';

/**
 * Settings component
 * Handles application settings including language switching and game path configuration
 */
@Component({
    selector: 'app-settings',
    imports: [CommonModule, TranslocoDirective, TranslocoPipe],
    templateUrl: './settings.component.html',
    styleUrl: './settings.component.css',
})
export class SettingsComponent implements OnInit {
    private translocoService = inject(TranslocoService);
    private settingsService = inject(SettingsService);

    /** Available locales */
    readonly locales = LOCALES;

    /** Default locale */
    readonly defaultLocale = DEFAULT_LOCALE;

    /** Game path input value */
    readonly gamePathInput = signal<string>('');

    /** Game path validation state */
    readonly isValidating = signal<boolean>(false);
    readonly isValidPath = signal<boolean>(false);
    readonly pathError = signal<string>('');
    readonly packageCount = signal<number>(0);

    /** Current locale from Transloco */
    get currentLocale(): SupportedLocale {
        return this.translocoService.getActiveLang() as SupportedLocale;
    }

    ngOnInit(): void {
        // Load existing game path on init
        this.gamePathInput.set(this.settingsService.getGamePath());
    }

    /**
     * Get the current locale value for select binding
     */
    get localeValue(): SupportedLocale {
        return this.currentLocale;
    }

    /**
     * Change the application language
     * Stores preference and updates Transloco active language
     * @param event Change event from select element
     */
    onLocaleChange(event: Event): void {
        const target = event.target as HTMLSelectElement;
        if (target?.value) {
            this.changeLocale(target.value as SupportedLocale);
        }
    }

    /**
     * Change the application language
     * Stores preference in localStorage and updates Transloco
     * @param locale New locale to set
     */
    changeLocale(locale: SupportedLocale): void {
        // Store locale preference in localStorage
        localStorage.setItem('locale', locale);

        // Update Transloco active language (runtime switch)
        this.translocoService.setActiveLang(locale);
    }

    /**
     * Validate game directory path
     */
    async validateGamePath(): Promise<void> {
        const path = this.gamePathInput();
        if (!path) {
            this.pathError.set('');
            this.isValidPath.set(false);
            this.packageCount.set(0);
            return;
        }

        this.isValidating.set(true);
        this.pathError.set('');

        try {
            const result = await invoke<any>('validate_game_path', { path });
            this.isValidPath.set(result.valid);
            this.packageCount.set(result.package_count || 0);
            if (!result.valid) {
                this.pathError.set('Invalid game directory');
            }
        } catch (e) {
            this.isValidPath.set(false);
            this.packageCount.set(0);
            this.pathError.set(String(e));
        } finally {
            this.isValidating.set(false);
        }
    }

    /**
     * Save game path to settings
     */
    async saveGamePath(): Promise<void> {
        const path = this.gamePathInput();
        await this.settingsService.setGamePath(path);

        // Show validation state after save
        await this.validateGamePath();
    }
}
