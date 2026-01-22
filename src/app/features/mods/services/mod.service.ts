import { Injectable, inject, signal } from '@angular/core';
import { Observable, from, of, throwError } from 'rxjs';
import { catchError, tap, finalize, switchMap, map } from 'rxjs/operators';
import { invoke } from '@tauri-apps/api/core';
import { open } from '@tauri-apps/plugin-dialog';
import {
    ModReadInfo,
    ModInstallOptions,
} from '../../../shared/models/mod.models';
import { SettingsService } from '../../../core/services/settings.service';

/**
 * Service for managing RWRMI mods
 */
@Injectable({
    providedIn: 'root',
})
export class ModService {
    private settingsService = inject(SettingsService);

    // State management with signals (Principle IX: Signal管状态)
    private loadingState = signal<boolean>(false);
    private errorState = signal<string | null>(null);

    /** Readonly signal streams */
    readonly loadingSig = this.loadingState.asReadonly();
    readonly errorSig = this.errorState.asReadonly();

    /**
     * Read mod info from a zip file
     * @param filePath Path to the mod zip file
     * @returns Observable of ModReadInfo
     */
    readModInfo(filePath: string): Observable<ModReadInfo> {
        this.loadingState.set(true);
        this.errorState.set(null);

        return from(invoke<string>('read_info', { path: filePath })).pipe(
            map((result) => JSON.parse(result) as ModReadInfo),
            catchError((error) => {
                this.errorState.set(`Failed to read mod info: ${error}`);
                return throwError(() => error);
            }),
            finalize(() => {
                this.loadingState.set(false);
            }),
        );
    }

    /**
     * Select a mod file and read its info
     * @returns Observable of ModReadInfo
     */
    selectAndReadModFile(): Observable<ModReadInfo> {
        this.loadingState.set(true);
        this.errorState.set(null);

        return from(
            open({
                filters: [
                    {
                        name: 'RWRMI Mod',
                        extensions: ['zip'],
                    },
                ],
            }),
        ).pipe(
            switchMap((filePath) => {
                if (!filePath) {
                    return throwError(() => 'No file selected');
                }
                return this.readModInfo(filePath as string);
            }),
            catchError((error) => {
                this.errorState.set(`Failed to select file: ${error}`);
                return throwError(() => error);
            }),
            finalize(() => {
                this.loadingState.set(false);
            }),
        );
    }

    /**
     * Install a mod to the target directory
     * @param filePath Path to the mod zip file
     * @param targetPath Target directory (game root)
     * @param options Install options
     * @returns Observable of void
     */
    installMod(
        filePath: string,
        targetPath: string,
        options: ModInstallOptions,
    ): Observable<void> {
        this.loadingState.set(true);
        this.errorState.set(null);

        // If backup is enabled, create backup first
        if (options.backup) {
            return from(this.readModInfo(filePath)).pipe(
                switchMap((modInfo) => {
                    return this.makeBackup(
                        filePath,
                        modInfo.file_path_list,
                        targetPath,
                    );
                }),
                switchMap(() => {
                    return from(
                        invoke('install_mod', {
                            path: filePath,
                            targetPath,
                        }),
                    ).pipe(map(() => undefined));
                }),
                catchError((error) => {
                    this.errorState.set(`Failed to install mod: ${error}`);
                    return throwError(() => error);
                }),
                finalize(() => {
                    this.loadingState.set(false);
                }),
            );
        }

        // Install without backup
        return from(
            invoke('install_mod', {
                path: filePath,
                targetPath,
            }),
        ).pipe(
            map(() => undefined),
            catchError((error) => {
                this.errorState.set(`Failed to install mod: ${error}`);
                return throwError(() => error);
            }),
            finalize(() => {
                this.loadingState.set(false);
            }),
        );
    }

    /**
     * Create backup of original files
     * @param modPath Path to the mod zip file
     * @param fileList List of files to backup
     * @param targetPath Target directory
     * @returns Observable of backup path
     */
    makeBackup(
        modPath: string,
        fileList: string[],
        targetPath: string,
    ): Observable<string> {
        return from(
            invoke<string>('make_backup', {
                modPath,
                fileList,
                targetPath,
            }),
        ).pipe(
            catchError((error) => {
                this.errorState.set(`Failed to create backup: ${error}`);
                return throwError(() => error);
            }),
        );
    }

    /**
     * Recover from backup
     * @param targetPath Target directory to recover
     * @returns Observable of void
     */
    recoverBackup(targetPath: string): Observable<void> {
        this.loadingState.set(true);
        this.errorState.set(null);

        return from(invoke('recover_backup', { path: targetPath })).pipe(
            map(() => undefined),
            catchError((error) => {
                this.errorState.set(`Failed to recover backup: ${error}`);
                return throwError(() => error);
            }),
            finalize(() => {
                this.loadingState.set(false);
            }),
        );
    }

    /**
     * Bundle a mod folder into a zip file
     * @param folderPath Path to the mod folder
     * @returns Observable of output file name
     */
    bundleMod(folderPath: string): Observable<string> {
        this.loadingState.set(true);
        this.errorState.set(null);

        return from(invoke<string>('bundle_mod', { path: folderPath })).pipe(
            catchError((error) => {
                this.errorState.set(`Failed to bundle mod: ${error}`);
                return throwError(() => error);
            }),
            finalize(() => {
                this.loadingState.set(false);
            }),
        );
    }

    /**
     * Select a folder and bundle it
     * @returns Observable of output file name
     */
    selectAndBundleFolder(): Observable<string> {
        this.loadingState.set(true);
        this.errorState.set(null);

        return from(
            open({
                directory: true,
            }),
        ).pipe(
            switchMap((folderPath) => {
                if (!folderPath) {
                    return throwError(() => 'No folder selected');
                }
                return this.bundleMod(folderPath as string);
            }),
            catchError((error) => {
                this.errorState.set(`Failed to bundle folder: ${error}`);
                return throwError(() => error);
            }),
            finalize(() => {
                this.loadingState.set(false);
            }),
        );
    }

    /**
     * Generate default mod config files
     * @param folderPath Path to the mod folder
     * @returns Observable of folder path
     */
    generateModConfig(folderPath: string): Observable<string> {
        this.loadingState.set(true);
        this.errorState.set(null);

        return from(
            invoke<string>('generate_mod_config', { path: folderPath }),
        ).pipe(
            catchError((error) => {
                this.errorState.set(`Failed to generate config: ${error}`);
                return throwError(() => error);
            }),
            finalize(() => {
                this.loadingState.set(false);
            }),
        );
    }

    /**
     * Select a folder and generate default config
     * @returns Observable of folder path
     */
    selectAndGenerateConfig(): Observable<string> {
        this.loadingState.set(true);
        this.errorState.set(null);

        return from(
            open({
                directory: true,
            }),
        ).pipe(
            switchMap((folderPath) => {
                if (!folderPath) {
                    return throwError(() => 'No folder selected');
                }
                return this.generateModConfig(folderPath as string);
            }),
            catchError((error) => {
                this.errorState.set(`Failed to generate config: ${error}`);
                return throwError(() => error);
            }),
            finalize(() => {
                this.loadingState.set(false);
            }),
        );
    }

    /**
     * Get the configured game installation directory.
     * @returns Game path or undefined
     */
    getGamePath(): string | undefined {
        return this.settingsService.getGameInstallDirectory() ?? undefined;
    }

    /**
     * Get the RWRMI target path from settings (defaults to first valid scan directory)
     * @returns Target path or undefined
     */
    getTargetPath(): string | undefined {
        const settings = this.settingsService.settings();
        const gamePath = this.getGamePath();
        return settings.rwrmiTargetPath || gamePath;
    }

    /**
     * Clear error state
     */
    clearError(): void {
        this.errorState.set(null);
    }
}
