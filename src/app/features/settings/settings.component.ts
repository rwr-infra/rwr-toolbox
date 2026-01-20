import { Component, inject, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
    TranslocoDirective,
    TranslocoPipe,
    TranslocoService,
} from '@jsverse/transloco';
import { open } from '@tauri-apps/plugin-dialog';
import {
    SupportedLocale,
    LOCALES,
    DEFAULT_LOCALE,
} from '../../../i18n/locales';
import { DirectoryService } from './services/directory.service';
import { ThemeService } from '../../shared/services/theme.service';
import { SettingsService } from '../../core/services/settings.service';

/**
 * Settings component
 * Handles application settings including language switching and directory management
 */
@Component({
    selector: 'app-settings',
    imports: [CommonModule, TranslocoDirective, TranslocoPipe],
    templateUrl: './settings.component.html',
    styleUrl: './settings.component.css',
})
export class SettingsComponent implements OnInit {
    private translocoService = inject(TranslocoService);
    private directoryService = inject(DirectoryService);
    private themeService = inject(ThemeService);
    private settingsService = inject(SettingsService);

    /** Available locales */
    readonly locales = LOCALES;

    /** Default locale */
    readonly defaultLocale = DEFAULT_LOCALE;

    /** Theme preferences */
    readonly theme = this.themeService.theme;

    /** T034: Directory management - readonly directories signal reference */
    readonly directoriesSig = this.directoryService.directoriesSig;
    readonly validatingSig = this.directoryService.validatingSig;
    readonly isAnyValidatingSig = this.directoryService.isAnyValidatingSig;
    readonly validationProgressSig =
        this.directoryService.validationProgressSig;
    readonly loadingSig = this.directoryService.loadingSig;
    readonly errorSig = this.directoryService.errorSig;

    /** T004: Selected directory ID from SettingsService */
    readonly selectedDirectoryIdSig = computed(() =>
        this.settingsService.settings().selectedDirectoryId
    );

    /** Current locale from Transloco */
    get currentLocale(): SupportedLocale {
        return this.translocoService.getActiveLang() as SupportedLocale;
    }

    ngOnInit(): void {
        // Bug fix: Load scan directories from Tauri store and revalidate
        // Previously: this.directoryService.loadDirectories(); was not awaited
        this.directoryService.loadDirectories().then(() => {
            this.directoryService.revalidateAll();
        });
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
     * Get the current theme type
     */
    get currentTheme(): 'light' | 'dark' | 'auto' {
        return this.theme().themeType;
    }

    /**
     * Change the application theme
     * @param event Change event from select element
     */
    async onThemeChange(event: Event): Promise<void> {
        const target = event.target as HTMLSelectElement;
        if (target?.value) {
            const newTheme = target.value as 'light' | 'dark' | 'auto';
            await this.themeService.setTheme(newTheme);
        }
    }

    /**
     * T035: Add directory using file dialog
     */
    async onAddDirectory(): Promise<void> {
        try {
            const selected = await open({
                directory: true,
                multiple: false,
                title: 'Select Game Directory',
            });
            if (selected && typeof selected === 'string') {
                await this.directoryService.addDirectory(selected);
            }
        } catch (e) {
            console.error('Failed to open directory dialog:', e);
        }
    }

    /**
     * T036: Remove directory by ID
     */
    async onRemoveDirectory(directoryId: string): Promise<void> {
        await this.directoryService.removeDirectory(directoryId);
    }

    /**
     * T037: Revalidate directory
     */
    async onRevalidateDirectory(directoryId: string): Promise<void> {
        await this.directoryService.revalidateDirectory(directoryId);
    }

    /**
     * T004: Check if a directory is currently selected
     */
    isDirectorySelected(directoryId: string): boolean {
        return this.selectedDirectoryIdSig() === directoryId;
    }

    /**
     * T004: Handle directory selection change
     */
    async onDirectorySelect(directoryId: string): Promise<void> {
        await this.directoryService.setSelectedDirectory(directoryId);
    }
}
