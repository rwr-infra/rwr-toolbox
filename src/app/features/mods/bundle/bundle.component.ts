import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { TranslocoDirective } from '@jsverse/transloco';
import { ModService } from '../services/mod.service';
import { ModBundleInfo } from '../../../shared/models/mod.models';

/**
 * Example config for display
 */
const CONFIG_EXAMPLE: ModBundleInfo = {
    title: 'Mod 标题',
    description: 'Mod 描述',
    authors: ['Annoymous'],
    version: '0.1.0',
    game_version: '1.95',
};

@Component({
    selector: 'app-bundle',
    imports: [
        CommonModule,
        FormsModule,
        LucideAngularModule,
        TranslocoDirective,
    ],
    templateUrl: './bundle.component.html',
})
export class BundleComponent {
    private modService = inject(ModService);

    // Use signals directly from service (refactored to Signal pattern)
    readonly loading = this.modService.loadingSig;
    readonly error = this.modService.errorSig;

    // Example config for display
    readonly configExample = CONFIG_EXAMPLE;

    /**
     * Bundle a mod folder
     */
    onBundle(): void {
        this.modService.selectAndBundleFolder().subscribe({
            next: (outputFileName) => {
                alert(`Bundle successful: ${outputFileName}`);
            },
            error: (err) => {
                console.error('Bundle failed:', err);
            },
        });
    }

    /**
     * Generate default config files
     */
    onGenerateConfig(): void {
        this.modService.selectAndGenerateConfig().subscribe({
            next: (folderPath) => {
                alert(`Default config generated for: ${folderPath}`);
            },
            error: (err) => {
                console.error('Generate config failed:', err);
            },
        });
    }
}
