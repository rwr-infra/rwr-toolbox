import { Component, signal, inject } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { WeaponsComponent } from '../weapons/weapons.component';
import { ItemsComponent } from '../items/items.component';
import { SettingsService } from '../../../core/services/settings.service';

/**
 * Local data component with Weapons and Items tabs
 * Feature: 002-table-enhancements
 * Uses DaisyUI tabs for navigation
 */
@Component({
    selector: 'app-local',
    imports: [TranslocoPipe, WeaponsComponent, ItemsComponent],
    templateUrl: './local.component.html',
    styleUrl: './local.component.css',
})
export class LocalComponent {
    private settingsService = inject(SettingsService);

    readonly activeTab = signal<'weapons' | 'items'>('weapons');

    readonly tabs = [
        { key: 'weapons' as const, label: 'weapons.title' },
        { key: 'items' as const, label: 'items.title' },
    ] as const;

    readonly gamePath = this.settingsService.getGamePath();
}
