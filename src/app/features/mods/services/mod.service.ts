import { Injectable, inject, signal } from '@angular/core';
import { Observable, from, of, throwError, forkJoin } from 'rxjs';
import { catchError, finalize, switchMap, map } from 'rxjs/operators';
import { invoke } from '@tauri-apps/api/core';
import { open } from '@tauri-apps/plugin-dialog';
import {
    ModReadInfo,
    ModInstallOptions,
    ModArchiveEntry,
} from '../../../shared/models/mod.models';
import { SettingsService } from '../../../core/services/settings.service';

export interface SelectModResult {
    path: string;
    info: ModReadInfo;
}

@Injectable({
    providedIn: 'root',
})
export class ModService {
    private settingsService = inject(SettingsService);

    private loadingState = signal<boolean>(false);
    private errorState = signal<string | null>(null);
    private pendingReinstallPathState = signal<string | null>(null);

    readonly loadingSig = this.loadingState.asReadonly();
    readonly errorSig = this.errorState.asReadonly();
    readonly pendingReinstallPathSig = this.pendingReinstallPathState.asReadonly();

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

    selectAndReadModFile(): Observable<SelectModResult> {
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
                const path = filePath as string;
                return this.readModInfo(path).pipe(
                    map((info) => ({ path, info })),
                );
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

    installMod(
        filePath: string,
        targetPath: string,
        options: ModInstallOptions,
        skipArchive = false,
    ): Observable<void> {
        this.loadingState.set(true);
        this.errorState.set(null);

        const doInstall = (): Observable<void> => {
            return from(
                invoke('install_mod', {
                    path: filePath,
                    targetPath,
                    selectedFiles:
                        options.selectedFiles.length > 0
                            ? options.selectedFiles
                            : null,
                }),
            ).pipe(map(() => undefined));
        };

        const doArchive = (): Observable<void> => {
            if (skipArchive) {
                return of(undefined);
            }
            const settings = this.settingsService.settings();
            if (!settings.modArchiveEnabled || !settings.modArchiveDirectory) {
                return of(undefined);
            }
            return from(
                invoke<string>('archive_mod', {
                    path: filePath,
                    archiveDir: settings.modArchiveDirectory,
                }),
            ).pipe(
                switchMap(() => this.refreshArchiveEntries()),
                map(() => undefined),
                catchError((err) => {
                    console.error('Failed to archive mod:', err);
                    return of(undefined);
                }),
            );
        };

        let pipeline: Observable<void>;

        if (options.backup) {
            pipeline = from(this.readModInfo(filePath)).pipe(
                switchMap((modInfo) => {
                    return this.makeBackup(
                        filePath,
                        modInfo.file_path_list,
                        targetPath,
                    );
                }),
                switchMap(() => doInstall()),
            );
        } else {
            pipeline = doInstall();
        }

        return pipeline.pipe(
            switchMap(() => doArchive()),
            catchError((error) => {
                this.errorState.set(`Failed to install mod: ${error}`);
                return throwError(() => error);
            }),
            finalize(() => {
                this.loadingState.set(false);
            }),
        );
    }

    archiveMod(filePath: string): Observable<string> {
        const settings = this.settingsService.settings();
        if (!settings.modArchiveEnabled || !settings.modArchiveDirectory) {
            return throwError(() => 'Mod archive is not configured');
        }
        return from(
            invoke<string>('archive_mod', {
                path: filePath,
                archiveDir: settings.modArchiveDirectory,
            }),
        ).pipe(
            switchMap((archivedPath) =>
                this.refreshArchiveEntries().pipe(map(() => archivedPath)),
            ),
            catchError((error) => {
                this.errorState.set(`Failed to archive mod: ${error}`);
                return throwError(() => error);
            }),
        );
    }

    refreshArchiveEntries(): Observable<void> {
        const settings = this.settingsService.settings();
        const archiveDir = settings.modArchiveDirectory;
        if (!archiveDir) {
            return of(undefined);
        }
        return from(
            invoke<string[]>('list_mod_archives', { archiveDir }),
        ).pipe(
            switchMap((paths) => {
                if (paths.length === 0) {
                    return of([]);
                }
                const reads = paths.map((p) =>
                    from(invoke<string>('read_info', { path: p })).pipe(
                        map((json) => {
                            const info = JSON.parse(json) as ModReadInfo;
                            const entry: ModArchiveEntry = {
                                id: p,
                                filePath: p,
                                fileName: p.split(/[\\/]/).pop() || p,
                                archivedAt: 0,
                                title: info.title,
                                description: info.description,
                                version: info.version,
                                gameVersion: info.game_version,
                                authors: info.authors,
                            };
                            return entry;
                        }),
                        catchError(() => {
                            const entry: ModArchiveEntry = {
                                id: p,
                                filePath: p,
                                fileName: p.split(/[\\/]/).pop() || p,
                                archivedAt: 0,
                            };
                            return of(entry);
                        }),
                    ),
                );
                return forkJoin(reads).pipe(
                    map((entries) => entries.filter((e): e is ModArchiveEntry => !!e)),
                );
            }),
            switchMap((entries) => {
                return this.settingsService
                    .setModArchiveEntries(entries)
                    .then(() => undefined);
            }),
            catchError((error) => {
                console.error('Failed to refresh archive entries:', error);
                return of(undefined);
            }),
        );
    }

    deleteModArchive(filePath: string): Observable<void> {
        return from(invoke('delete_mod_archive', { path: filePath })).pipe(
            switchMap(() => this.refreshArchiveEntries()),
            catchError((error) => {
                this.errorState.set(`Failed to delete archive: ${error}`);
                return throwError(() => error);
            }),
        );
    }

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

    getGamePath(): string | undefined {
        return this.settingsService.getGameInstallDirectory() ?? undefined;
    }

    getTargetPath(): string | undefined {
        const settings = this.settingsService.settings();
        const gamePath = this.getGamePath();
        return settings.rwrmiTargetPath || gamePath;
    }

    clearError(): void {
        this.errorState.set(null);
    }

    setPendingReinstallPath(path: string | null): void {
        this.pendingReinstallPathState.set(path);
    }
}
