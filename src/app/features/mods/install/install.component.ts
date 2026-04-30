import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { TranslocoDirective } from '@jsverse/transloco';
import { ModService } from '../services/mod.service';
import {
    ModReadInfo,
    ModInstallOptions,
    ModFileEntry,
} from '../../../shared/models/mod.models';
import { MarkdownPipe } from '../../../shared/pipes/markdown.pipe';

@Component({
    selector: 'app-install',
    imports: [
        CommonModule,
        FormsModule,
        LucideAngularModule,
        TranslocoDirective,
        MarkdownPipe,
    ],
    templateUrl: './install.component.html',
})
export class InstallComponent implements OnInit {
    private modService = inject(ModService);

    readonly loading = this.modService.loadingSig;
    readonly error = this.modService.errorSig;

    activeStep = 0;
    selectedFilePath: string | null = null;
    modInfo: ModReadInfo | null = null;

    readonly steps = [0, 1, 2] as const;

    installOptions: ModInstallOptions = {
        backup: true,
        overwrite: false,
        selectedFiles: [],
    };

    showFileList = false;
    showReadme = false;
    showChangelog = false;

    ngOnInit(): void {
        const pendingPath = this.modService.pendingReinstallPathSig();
        if (pendingPath) {
            this.modService.setPendingReinstallPath(null);
            this.modService.readModInfo(pendingPath).subscribe({
                next: (info) => {
                    this.modInfo = info;
                    this.selectedFilePath = pendingPath;
                    this.initFileSelection();
                    this.activeStep = 1;
                },
                error: (err) => {
                    console.error('Failed to read pending reinstall mod:', err);
                },
            });
            return;
        }

        if (!this.modService.getGamePath()) {
            // Could redirect to settings or show a warning
        }
    }

    /**
     * Initialize file selection after reading mod info.
     * Default: select all non-txt files.
     */
    initFileSelection(): void {
        if (!this.modInfo) return;
        this.installOptions.selectedFiles = this.modInfo.file_entries
            .filter((entry) => !entry.path.toLowerCase().endsWith('.txt'))
            .map((entry) => entry.path);
    }

    /** Toggle selection of a single file */
    toggleFileSelection(path: string): void {
        const idx = this.installOptions.selectedFiles.indexOf(path);
        if (idx >= 0) {
            this.installOptions.selectedFiles.splice(idx, 1);
        } else {
            this.installOptions.selectedFiles.push(path);
        }
    }

    /** Check if a file is selected */
    isFileSelected(path: string): boolean {
        return this.installOptions.selectedFiles.includes(path);
    }

    /** Select all files */
    selectAllFiles(): void {
        if (!this.modInfo) return;
        this.installOptions.selectedFiles = this.modInfo.file_entries.map(
            (entry) => entry.path,
        );
    }

    /** Invert selection */
    invertSelection(): void {
        if (!this.modInfo) return;
        const allPaths = new Set(this.modInfo.file_entries.map((e) => e.path));
        const selected = new Set(this.installOptions.selectedFiles);
        this.installOptions.selectedFiles = this.modInfo.file_entries
            .filter((e) => !selected.has(e.path))
            .map((e) => e.path);
    }

    /** Calculate total size of selected files */
    get selectedSize(): number {
        if (!this.modInfo) return 0;
        const selected = new Set(this.installOptions.selectedFiles);
        return this.modInfo.file_entries
            .filter((e) => selected.has(e.path))
            .reduce((sum, e) => sum + e.size, 0);
    }

    /** Format bytes to human-readable string */
    formatBytes(bytes: number): string {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    onSelectFile(): void {
        this.modService.selectAndReadModFile().subscribe({
            next: (result) => {
                this.modInfo = result.info;
                this.selectedFilePath = result.path;
                this.initFileSelection();
                this.activeStep = 1;
            },
            error: (err) => {
                console.error('Failed to select file:', err);
            },
        });
    }

    onInstall(): void {
        if (!this.selectedFilePath) {
            return;
        }

        const targetPath = this.modService.getTargetPath();
        if (!targetPath) {
            alert('Game path not configured. Please set it in Settings first.');
            return;
        }

        if (this.installOptions.selectedFiles.length === 0) {
            alert('Please select at least one file to install.');
            return;
        }

        this.modService
            .installMod(this.selectedFilePath, targetPath, this.installOptions)
            .subscribe({
                next: () => {
                    alert('Mod installed successfully!');
                    this.reset();
                },
                error: (err) => {
                    console.error('Installation failed:', err);
                },
            });
    }

    onBackup(): void {
        if (!this.selectedFilePath || !this.modInfo) {
            return;
        }

        const targetPath = this.modService.getTargetPath();
        if (!targetPath) {
            alert('Game path not configured. Please set it in Settings first.');
            return;
        }

        this.modService
            .makeBackup(
                this.selectedFilePath,
                this.installOptions.selectedFiles.length > 0
                    ? this.installOptions.selectedFiles
                    : this.modInfo.file_path_list,
                targetPath,
            )
            .subscribe({
                next: (backupPath) => {
                    alert(`Backup created at: ${backupPath}`);
                },
                error: (err) => {
                    console.error('Backup failed:', err);
                },
            });
    }

    onRecover(): void {
        const targetPath = this.modService.getTargetPath();
        if (!targetPath) {
            alert('Game path not configured. Please set it in Settings first.');
            return;
        }

        if (
            !confirm('This will replace current files with backup. Continue?')
        ) {
            return;
        }

        this.modService.recoverBackup(targetPath).subscribe({
            next: () => {
                alert('Backup recovered successfully!');
            },
            error: (err) => {
                console.error('Recover failed:', err);
            },
        });
    }

    onNext(): void {
        if (this.activeStep < this.steps.length - 1) {
            this.activeStep++;
        }
    }

    onPrev(): void {
        if (this.activeStep > 0) {
            this.activeStep--;
        }
    }

    reset(): void {
        this.activeStep = 0;
        this.selectedFilePath = null;
        this.modInfo = null;
        this.installOptions = {
            backup: true,
            overwrite: false,
            selectedFiles: [],
        };
        this.showFileList = false;
        this.showReadme = false;
        this.showChangelog = false;
        this.modService.clearError();
    }

    toggleFileList(): void {
        this.showFileList = !this.showFileList;
        if (this.showFileList) {
            this.showReadme = false;
            this.showChangelog = false;
        }
    }

    toggleReadme(): void {
        this.showReadme = !this.showReadme;
        if (this.showReadme) {
            this.showFileList = false;
            this.showChangelog = false;
        }
    }

    toggleChangelog(): void {
        this.showChangelog = !this.showChangelog;
        if (this.showChangelog) {
            this.showFileList = false;
            this.showReadme = false;
        }
    }

    closeModals(): void {
        this.showFileList = false;
        this.showReadme = false;
        this.showChangelog = false;
    }

    get gamePath(): string | undefined {
        return this.modService.getGamePath();
    }

    get isGamePathConfigured(): boolean {
        return !!this.modService.getGamePath();
    }
}
