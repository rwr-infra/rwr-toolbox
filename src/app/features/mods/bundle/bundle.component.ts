import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { TranslocoDirective } from '@jsverse/transloco';
import { toSignal } from '@angular/core/rxjs-interop';
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
    styleUrl: './bundle.component.css',
})
export class BundleComponent {
    private modService = inject(ModService);

    // Signals
    readonly loading = toSignal(this.modService.loading$, {
        initialValue: false,
    });
    readonly error = toSignal(this.modService.error$, { initialValue: null });

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
