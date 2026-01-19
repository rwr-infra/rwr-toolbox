import { Injectable, signal, computed } from '@angular/core';
import { Store } from '@tauri-apps/plugin-store';

export type ScrollingMode = 'table-only' | 'full-page';

const SCROLLING_MODE_KEY = 'scrolling_mode';

@Injectable({ providedIn: 'root' })
export class ScrollingModeService {
    readonly mode = signal<ScrollingMode>('table-only');
    readonly isTableOnlyMode = computed(() => this.mode() === 'table-only');
    private store: Store | null = null;

    async loadMode(): Promise<void> {
        try {
            if (!this.store) {
                this.store = await Store.load('settings.json');
            }
            const saved = await this.store.get<ScrollingMode>(SCROLLING_MODE_KEY);
            this.mode.set(saved || 'table-only');
        } catch (error) {
            console.error('Failed to load scrolling mode:', error);
            this.mode.set('table-only');
        }
    }

    async setMode(mode: ScrollingMode): Promise<void> {
        try {
            if (!this.store) {
                this.store = await Store.load('settings.json');
            }
            await this.store.set(SCROLLING_MODE_KEY, mode);
            await this.store.save();
            this.mode.set(mode);
        } catch (error) {
            console.error('Failed to save scrolling mode:', error);
            throw error;
        }
    }
}
