import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { TranslocoDirective } from '@jsverse/transloco';
import { ModService } from '../services/mod.service';
import { SettingsService } from '../../../core/services/settings.service';
import { ModArchiveEntry, ModReadInfo } from '../../../shared/models/mod.models';

@Component({
    selector: 'app-assets',
    imports: [CommonModule, RouterLink, LucideAngularModule, TranslocoDirective],
    templateUrl: './assets.component.html',
})
export class AssetsComponent implements OnInit {
    private modService = inject(ModService);
    private settingsService = inject(SettingsService);
    private router = inject(Router);

    readonly archiveEnabled = this.settingsService.modArchiveEnabledSig;
    readonly archiveDirectory = this.settingsService.modArchiveDirectorySig;
    readonly archiveEntries = this.settingsService.modArchiveEntriesSig;

    private loadingState = signal(false);
    readonly loading = this.loadingState.asReadonly();

    private errorState = signal<string | null>(null);
    readonly error = this.errorState.asReadonly();

    // Detail modal state
    detailEntry: ModArchiveEntry | null = null;
    detailInfo: ModReadInfo | null = null;
    showDetail = false;

    // Confirm delete modal
    deleteTarget: ModArchiveEntry | null = null;
    showDeleteConfirm = false;

    ngOnInit(): void {
        if (this.archiveEnabled() && this.archiveDirectory()) {
            this.refreshList();
        }
    }

    refreshList(): void {
        this.loadingState.set(true);
        this.errorState.set(null);
        this.modService.refreshArchiveEntries().subscribe({
            next: () => {
                this.loadingState.set(false);
            },
            error: (err) => {
                this.errorState.set(String(err));
                this.loadingState.set(false);
            },
        });
    }

    onReinstall(entry: ModArchiveEntry): void {
        const targetPath = this.modService.getTargetPath();
        if (!targetPath) {
            alert('Game path not configured. Please set it in Settings first.');
            return;
        }
        this.modService.setPendingReinstallPath(entry.filePath);
        void this.router.navigate(['/mods/install']);
    }

    onDelete(entry: ModArchiveEntry): void {
        this.deleteTarget = entry;
        this.showDeleteConfirm = true;
    }

    confirmDelete(): void {
        if (!this.deleteTarget) return;
        this.loadingState.set(true);
        this.modService.deleteModArchive(this.deleteTarget.filePath).subscribe({
            next: () => {
                this.loadingState.set(false);
                this.closeDeleteModal();
            },
            error: (err) => {
                this.errorState.set(String(err));
                this.loadingState.set(false);
                this.closeDeleteModal();
            },
        });
    }

    closeDeleteModal(): void {
        this.showDeleteConfirm = false;
        this.deleteTarget = null;
    }

    openDetail(entry: ModArchiveEntry): void {
        this.detailEntry = entry;
        this.detailInfo = null;
        this.showDetail = true;
        this.modService.readModInfo(entry.filePath).subscribe({
            next: (info) => {
                this.detailInfo = info;
            },
            error: () => {
                this.detailInfo = null;
            },
        });
    }

    closeDetail(): void {
        this.showDetail = false;
        this.detailEntry = null;
        this.detailInfo = null;
    }

    get hasEntries(): boolean {
        return this.archiveEntries().length > 0;
    }
}
