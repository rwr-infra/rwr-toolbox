import { Component, inject, OnInit, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
    TranslocoDirective,
    TranslocoPipe,
    TranslocoService,
} from '@jsverse/transloco';
import { LucideAngularModule } from 'lucide-angular';
import { open } from '@tauri-apps/plugin-dialog';
import {
    SupportedLocale,
    LOCALES,
    DEFAULT_LOCALE,
} from '../../../i18n/locales';
import { DirectoryService } from './services/directory.service';
import { SteamLaunchService } from './services/steam-launch.service';
import { ThemeService } from '../../shared/services/theme.service';
import { SettingsService } from '../../core/services/settings.service';
import { DatePipe } from '@angular/common';

/**
 * Settings component
 * Handles application settings including language switching and directory management
 */
@Component({
    selector: 'app-settings',
    imports: [
        CommonModule,
        TranslocoDirective,
        TranslocoPipe,
        LucideAngularModule,
    ],
    providers: [DatePipe],
    templateUrl: './settings.component.html',
})
export class SettingsComponent implements OnInit {
    private translocoService = inject(TranslocoService);
    private directoryService = inject(DirectoryService);
    private themeService = inject(ThemeService);
    private settingsService = inject(SettingsService);
    private steamLaunchService = inject(SteamLaunchService);
    private datePipe = inject(DatePipe);

    private readonly validatingGameInstallDir = signal(false);
    readonly validatingGameInstallDirSig =
        this.validatingGameInstallDir.asReadonly();

    readonly gameInstallDirectorySig = computed(
        () => this.settingsService.settings().gameInstallDirectory,
    );
    readonly gameInstallDirectoryValidationSig =
        this.settingsService.gameInstallDirectoryValidation;

    /** Available locales */
    readonly locales = LOCALES;

    /** Default locale */
    readonly defaultLocale = DEFAULT_LOCALE;

    /** Theme preferences */
    readonly theme = this.themeService.theme;

    /** Steam launch */
    readonly steamLaunchBoolParamsSig = this.steamLaunchService.boolParamsSig;
    readonly steamLaunchKeyValueParamsSig =
        this.steamLaunchService.keyValueParamsSig;
    readonly steamLaunchCustomTokensSig =
        this.steamLaunchService.customTokensSig;
    readonly steamLaunchArgsTextSig = this.steamLaunchService.argsText;
    readonly steamLaunchIsLaunchingSig = this.steamLaunchService.isLaunching;
    readonly steamLaunchErrorKeySig = this.steamLaunchService.errorKey;

    /** Mod archive settings */
    readonly modArchiveEnabledSig = this.settingsService.modArchiveEnabledSig;
    readonly modArchiveDirectorySig = this.settingsService.modArchiveDirectorySig;

    /** T034: Directory management - readonly directories signal reference */
    readonly directoriesSig = this.directoryService.directoriesSig;
    readonly validatingSig = this.directoryService.validatingSig;
    readonly isAnyValidatingSig = this.directoryService.isAnyValidatingSig;
    readonly validationProgressSig =
        this.directoryService.validationProgressSig;
    readonly loadingSig = this.directoryService.loadingSig;
    readonly errorSig = this.directoryService.errorSig;

    /** T004: Selected directory ID from SettingsService */
    readonly selectedDirectoryIdSig = computed(
        () => this.settingsService.settings().selectedDirectoryId,
    );

    /** Current locale from Transloco */
    get currentLocale(): SupportedLocale {
        return this.translocoService.getActiveLang() as SupportedLocale;
    }

    ngOnInit(): void {
        // Ensure directories are loaded/revalidated even if the user navigated here first.
        // DirectoryService also auto-initializes on first injection, so this is mostly a no-op.
        void this.directoryService.ensureInitialized();

        // Validate current game install directory (if any) in the background.
        if (this.gameInstallDirectorySig()) {
            void this.onValidateGameInstallDirectory();
        }
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
                title: this.translocoService.translate(
                    'settings.dialog.selectScanDirectoryTitle',
                ),
            });
            if (selected && typeof selected === 'string') {
                await this.directoryService.addDirectory(selected);
            }
        } catch (e) {
            console.error('Failed to open directory dialog:', e);
        }
    }

    async onSelectGameInstallDirectory(): Promise<void> {
        try {
            const selected = await open({
                directory: true,
                multiple: false,
                title: this.translocoService.translate(
                    'settings.dialog.selectGameInstallDirectoryTitle',
                ),
            });
            if (!selected || typeof selected !== 'string') {
                return;
            }

            await this.settingsService.setGameInstallDirectory(selected);
            await this.onValidateGameInstallDirectory();
        } catch (e) {
            console.error('Failed to select game install directory:', e);
        }
    }

    async onClearGameInstallDirectory(): Promise<void> {
        await this.settingsService.setGameInstallDirectory(null);
        await this.onValidateGameInstallDirectory();
    }

    async onValidateGameInstallDirectory(): Promise<void> {
        if (this.validatingGameInstallDir()) return;

        this.validatingGameInstallDir.set(true);
        try {
            await this.settingsService.validateGameInstallDirectory();
        } finally {
            this.validatingGameInstallDir.set(false);
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
     * Toggle active state of a directory
     */
    async onToggleActive(directoryId: string): Promise<void> {
        await this.directoryService.toggleActive(directoryId);
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

    /**
     * Format a timestamp for display
     * @param timestamp Unix timestamp in milliseconds
     * @returns Formatted date string or empty string if timestamp is 0
     */
    async onToggleSteamBoolParam(paramId: string, event: Event): Promise<void> {
        const target = event.target as HTMLInputElement;
        await this.steamLaunchService.setBoolParamEnabled(
            paramId,
            Boolean(target?.checked),
        );
    }

    async onLaunchSteamGame(): Promise<void> {
        try {
            await this.steamLaunchService.launchGame();
        } catch {
            // Error message is handled via steamLaunchErrorKeySig.
        }
    }

    async onCopySteamArgsText(): Promise<void> {
        await this.steamLaunchService.copyArgsTextToClipboard();
    }

    async onAddSteamKeyValue(): Promise<void> {
        await this.steamLaunchService.setKeyValueParam('key', 'value');
    }

    async onRemoveSteamKeyValue(key: string): Promise<void> {
        await this.steamLaunchService.removeKeyValueParam(key);
    }

    async onSteamKeyValueKeyChange(
        oldKey: string,
        newKey: string,
    ): Promise<void> {
        // Move value to a new key.
        const current = this.steamLaunchKeyValueParamsSig();
        const value = current[oldKey] ?? '';
        await this.steamLaunchService.removeKeyValueParam(oldKey);
        await this.steamLaunchService.setKeyValueParam(newKey, value);
    }

    async onSteamKeyValueValueChange(
        key: string,
        value: string,
    ): Promise<void> {
        await this.steamLaunchService.setKeyValueParam(key, value);
    }

    async onSteamCustomTokensChange(multiline: string): Promise<void> {
        await this.steamLaunchService.setCustomTokensFromText(multiline);
    }

    formatTimestamp(timestamp: number): string {
        if (timestamp === 0) return '';
        return this.datePipe.transform(timestamp, 'short') || '';
    }

    async onToggleModArchive(event: Event): Promise<void> {
        const target = event.target as HTMLInputElement;
        await this.settingsService.setModArchiveEnabled(Boolean(target?.checked));
    }

    async onSelectModArchiveDirectory(): Promise<void> {
        try {
            const selected = await open({
                directory: true,
                multiple: false,
                title: this.translocoService.translate(
                    'settings.modArchive.selectDirectoryTitle',
                ),
            });
            if (selected && typeof selected === 'string') {
                await this.settingsService.setModArchiveDirectory(selected);
            }
        } catch (e) {
            console.error('Failed to select mod archive directory:', e);
        }
    }

    async onClearModArchiveDirectory(): Promise<void> {
        await this.settingsService.setModArchiveDirectory(null);
    }
}
