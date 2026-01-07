import { Pipe, PipeTransform, inject, ChangeDetectorRef, OnDestroy, NgModule, effect, DestroyRef, signal } from '@angular/core';
import { I18nService } from '../../core/services/i18n.service';

/**
 * i18n translation pipe
 * Usage: {{ 'menu.dashboard' | i18n }} or {{ 'status.lastUpdate' | i18n: { time: 'Just now' } }}
 *
 * This pipe is impure (pure: false) to automatically update when locale changes
 */
@Pipe({
  name: 'i18n',
  pure: false,
  standalone: true
})
export class I18nPipe implements PipeTransform, OnDestroy {
  private readonly i18n = inject(I18nService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroyRef = inject(DestroyRef);

  // Trigger signal for locale changes
  private readonly localeTrigger = signal(0);

  // Cache for last computed values to avoid unnecessary re-renders
  private lastValue?: string;
  private lastKey?: string;
  private lastParams?: Record<string, string | number>;
  private lastLocale?: string;

  constructor() {
    // Use effect to react to locale signal changes
    effect(() => {
      // Read the locale signal to establish dependency
      this.i18n.locale();
      // Trigger pipe re-evaluation by updating trigger
      this.localeTrigger.update(v => v + 1);
      // Mark for check to update template
      this.cdr.markForCheck();
    });
  }

  transform(key: string, params?: Record<string, string | number>): string {
    const currentLocale = this.i18n.getLocale();

    // Check if we can return cached value
    if (
      this.lastKey === key &&
      this.lastParams === params &&
      this.lastLocale === currentLocale &&
      this.lastValue !== undefined
    ) {
      return this.lastValue;
    }

    // Get new translation
    const value = this.i18n.translate(key, params);

    // Update cache
    this.lastKey = key;
    this.lastParams = params;
    this.lastLocale = currentLocale;
    this.lastValue = value;

    return value;
  }

  ngOnDestroy(): void {
    // Cleanup is handled by destroyRef
  }
}

/**
 * Module for i18n pipe (for compatibility with non-standalone components)
 */
@NgModule({
  imports: [I18nPipe],
  exports: [I18nPipe]
})
export class I18nPipeModule {}
