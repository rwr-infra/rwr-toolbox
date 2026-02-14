import { Component, inject, OnInit } from '@angular/core';
import { invoke } from '@tauri-apps/api/core';
import { LucideAngularModule } from 'lucide-angular';
import { VersionCheckService } from '../services/version-check.service';

@Component({
    selector: 'app-update-prompt',
    standalone: true,
    imports: [LucideAngularModule],
    template: `
        @if (isChecking()) {
            <div class="flex items-center gap-2 text-base-content/60">
                <span class="loading loading-spinner loading-xs"></span>
                <span class="text-xs">Checking...</span>
            </div>
        } @else if (updateStatus().isAvailable) {
            <div class="flex items-center gap-2">
                <button
                    class="btn btn-ghost btn-xs gap-1 text-warning px-1 min-h-0 h-auto"
                    (click)="openReleasesPage()"
                    type="button"
                >
                    <i-lucide name="alert-triangle" class="h-3 w-3"></i-lucide>
                    <span class="truncate max-w-32"
                        >v{{ updateStatus().availableVersion }}</span
                    >
                </button>
                <button
                    class="btn btn-ghost btn-xs btn-square text-base-content/50 hover:text-error min-h-0 h-auto"
                    (click)="dismissUpdate()"
                    type="button"
                    title="Dismiss"
                >
                    ×
                </button>
            </div>
        } @else if (updateStatus().error) {
            <button
                class="btn btn-ghost btn-xs btn-square text-error min-h-0 h-auto"
                type="button"
                [title]="updateStatus().error || ''"
                (click)="retryCheck()"
            >
                <i-lucide name="alert-circle" class="h-3 w-3"></i-lucide>
            </button>
        }
    `,
})
export class UpdatePromptComponent implements OnInit {
    private versionCheckService = inject(VersionCheckService);

    updateStatus = this.versionCheckService.updateStatus;
    isChecking = this.versionCheckService.isChecking;

    async ngOnInit() {
        await this.versionCheckService.initialize();
        await this.checkUpdates();
    }

    async checkUpdates() {
        await this.versionCheckService.checkForUpdates();
    }

    async openReleasesPage() {
        const url = this.updateStatus().releaseUrl;
        if (url) {
            try {
                await invoke('open_releases_url', { url });
            } catch (error) {
                console.error('Failed to open releases page:', error);
            }
        }
    }

    async dismissUpdate() {
        const version = this.updateStatus().availableVersion;
        if (version) {
            try {
                await this.versionCheckService.dismiss_update(version);
            } catch (error) {
                console.error('Failed to dismiss update:', error);
            }
        }
    }

    async retryCheck() {
        await this.versionCheckService.checkForUpdates();
    }
}
