import { Component, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { I18nService } from '../../core/services/i18n.service';
import { I18nPipe } from '../../shared/pipes/i18n.pipe';
import { SupportedLocale, LOCALES } from '../../../i18n/locales';

@Component({
  selector: 'app-settings',
  imports: [CommonModule, I18nPipe],
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.css',
})
export class SettingsComponent {
  private readonly i18n = inject(I18nService);

  /** Current locale signal */
  readonly currentLocale = this.i18n.locale;

  /** Available locales */
  readonly locales = LOCALES;

  /**
   * Get the current locale value
   */
  get localeValue(): SupportedLocale {
    return this.currentLocale();
  }

  /**
   * Change the application language from select change event
   * @param event Change event from select element
   */
  async onLocaleChange(event: Event): Promise<void> {
    const target = event.target as HTMLSelectElement;
    if (target?.value) {
      await this.i18n.setLocale(target.value as SupportedLocale);
    }
  }

  /**
   * Change the application language
   * @param locale New locale to set
   */
  async changeLocale(locale: SupportedLocale): Promise<void> {
    await this.i18n.setLocale(locale);
  }
}
