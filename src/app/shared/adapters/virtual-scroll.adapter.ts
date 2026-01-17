/**
 * Virtual Scroll Adapter
 * Feature: 003-ux-improvements
 *
 * Converts Angular Signals to Observables for CDK virtual scrolling integration.
 * Uses toObservable() from @angular/core/rxjs-interop.
 */

import { Injectable, Signal } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { Observable } from 'rxjs';

/**
 * Virtual scrolling viewport configuration
 * Based on CDK ScrollingModule requirements
 */
export interface VirtualScrollConfig {
    /** Fixed height of each row in pixels (required for CDK) */
    itemSize: number;
    /** Number of extra rows to render outside viewport (default: 10) */
    bufferSize?: number;
    /** Minimum buffer size in pixels (default: 100) */
    minBufferPx?: number;
    /** Maximum buffer size in pixels (default: 1000) */
    maxBufferPx?: number;
}

/**
 * Default virtual scrolling configuration
 */
export const DEFAULT_SCROLL_CONFIG: VirtualScrollConfig = {
    itemSize: 50, // 50px per row
    bufferSize: 10, // Render 10 extra rows
    minBufferPx: 100, // Minimum 100px buffer
    maxBufferPx: 1000, // Maximum 1000px buffer
};

/**
 * Adapter service for converting Angular Signals to Observables
 * Enables CDK virtual scrolling with Signal-based data sources
 *
 * @usage
 * const adapter = inject(VirtualScrollAdapter);
 * const weapons$ = adapter.toObservable(weaponsService.filteredWeapons);
 *
 * // In template:
 * <cdk-virtual-scroll-viewport [itemSize]="50" [dataSource]="weapons$">
 */
@Injectable({
    providedIn: 'root',
})
export class VirtualScrollAdapter {
    /**
     * Convert an Angular Signal to Observable for CDK DataSource
     *
     * @param signal - Angular Signal containing array data
     * @returns Observable that emits whenever the signal changes
     *
     * @example
     * const weapons = signal<Weapon[]>([]);
     * const weapons$ = this.toObservable(weapons);
     */
    toObservable<T>(signal: Signal<T>): Observable<T> {
        return toObservable(signal);
    }

    /**
     * Create a virtual scroll configuration object
     *
     * @param config - Partial configuration to override defaults
     * @returns Complete virtual scroll configuration
     *
     * @example
     * const config = this.createConfig({ itemSize: 60 });
     */
    createConfig(
        config: Partial<VirtualScrollConfig> = {},
    ): VirtualScrollConfig {
        return {
            ...DEFAULT_SCROLL_CONFIG,
            ...config,
        };
    }

    /**
     * Calculate appropriate item size based on content density
     *
     * @param hasImages - Whether items include images (requires more height)
     * @param compactMode - Whether to use compact spacing
     * @returns Recommended item size in pixels
     *
     * @example
     * const itemSize = this.calculateItemSize(true, false); // 60px for images
     */
    calculateItemSize(
        hasImages: boolean,
        compactMode: boolean = false,
    ): number {
        const baseSize = compactMode ? 40 : 50;
        return hasImages ? baseSize + 10 : baseSize;
    }
}
