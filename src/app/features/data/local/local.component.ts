import { Component, signal, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslocoPipe } from '@jsverse/transloco';
import { WeaponsComponent } from '../weapons/weapons.component';
import { ItemsComponent } from '../items/items.component';
import { DirectoryService } from '../../settings/services/directory.service';

/**
 * Local data component with Weapons and Items tabs
 * Feature: 002-table-enhancements
 * Uses DaisyUI tabs for navigation
 */
@Component({
    selector: 'app-local',
    imports: [TranslocoPipe, WeaponsComponent, ItemsComponent, RouterLink],
    templateUrl: './local.component.html',
    styleUrl: './local.component.css',
})
export class LocalComponent {
    private directoryService = inject(DirectoryService);

    readonly activeTab = signal<'weapons' | 'items'>('weapons');
    readonly scanProgressSig = this.directoryService.scanProgressSig;

    readonly tabs = [
        { key: 'weapons' as const, label: 'weapons.title' },
        { key: 'items' as const, label: 'items.title' },
    ] as const;

    /** T042: Check if no directories are configured */
    hasNoDirectories(): boolean {
        const dirs = this.directoryService.directoriesSig();
        const progress = this.directoryService.scanProgressSig();
        const initialized = this.directoryService.initializedSig();
        // Only show empty state if service is initialized AND truly no directories AND not currently scanning
        return initialized && dirs.length === 0 && progress.state === 'idle';
    }

    /**
     * T066: Rescan all directories
     */
    async onRescanAll(): Promise<void> {
        await this.directoryService.scanAllDirectories();
    }
}
