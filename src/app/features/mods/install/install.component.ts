import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { TranslocoDirective } from '@jsverse/transloco';
import { ModService } from '../services/mod.service';
import {
    ModReadInfo,
    ModInstallOptions,
} from '../../../shared/models/mod.models';
import { SettingsService } from '../../../core/services/settings.service';
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
    private settingsService = inject(SettingsService);

    // Use signals directly from service (refactored to Signal pattern)
    readonly loading = this.modService.loadingSig;
    readonly error = this.modService.errorSig;

    // Component state
    activeStep = 0;
    selectedFilePath: string | null = null;
    modInfo: ModReadInfo | null = null;

    // Stepper steps
    readonly steps = [0, 1, 2] as const;

    // Install options
    installOptions: ModInstallOptions = {
        backup: true,
        overwrite: false,
    };

    // UI state for step 2
    showFileList = false;
    showReadme = false;
    showChangelog = false;

    ngOnInit(): void {
        // Check if game path is configured
        if (!this.modService.getGamePath()) {
            // Could redirect to settings or show a warning
        }
    }

    /**
     * Step 1: Select mod file
     */
    onSelectFile(): void {
        this.modService.selectAndReadModFile().subscribe({
            next: (info) => {
                this.modInfo = info;
                this.selectedFilePath = info as any; // File path is returned with info
                this.activeStep = 1;
            },
            error: (err) => {
                console.error('Failed to select file:', err);
            },
        });
    }

    /**
     * Step 3: Install mod
     */
    onInstall(): void {
        if (!this.selectedFilePath) {
            return;
        }

        const targetPath = this.modService.getTargetPath();
        if (!targetPath) {
            alert('Game path not configured. Please set it in Settings first.');
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

    /**
     * Step 3: Create backup only
     */
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
                this.modInfo.file_path_list,
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

    /**
     * Step 3: Recover from backup
     */
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

    /**
     * Navigation: Next step
     */
    onNext(): void {
        if (this.activeStep < this.steps.length - 1) {
            this.activeStep++;
        }
    }

    /**
     * Navigation: Previous step
     */
    onPrev(): void {
        if (this.activeStep > 0) {
            this.activeStep--;
        }
    }

    /**
     * Navigation: Reset to step 0
     */
    reset(): void {
        this.activeStep = 0;
        this.selectedFilePath = null;
        this.modInfo = null;
        this.showFileList = false;
        this.showReadme = false;
        this.showChangelog = false;
        this.modService.clearError();
    }

    /**
     * Toggle file list modal
     */
    toggleFileList(): void {
        this.showFileList = !this.showFileList;
        if (this.showFileList) {
            this.showReadme = false;
            this.showChangelog = false;
        }
    }

    /**
     * Toggle readme modal
     */
    toggleReadme(): void {
        this.showReadme = !this.showReadme;
        if (this.showReadme) {
            this.showFileList = false;
            this.showChangelog = false;
        }
    }

    /**
     * Toggle changelog modal
     */
    toggleChangelog(): void {
        this.showChangelog = !this.showChangelog;
        if (this.showChangelog) {
            this.showFileList = false;
            this.showReadme = false;
        }
    }

    /**
     * Close all modals
     */
    closeModals(): void {
        this.showFileList = false;
        this.showReadme = false;
        this.showChangelog = false;
    }

    /**
     * Get game path for display
     */
    get gamePath(): string | undefined {
        return this.modService.getGamePath();
    }

    /**
     * Check if game path is configured
     */
    get isGamePathConfigured(): boolean {
        return !!this.modService.getGamePath();
    }
}
