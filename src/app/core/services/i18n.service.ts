import { Injectable, signal, effect, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, of, tap } from 'rxjs';
import { firstValueFrom } from 'rxjs';
import { SupportedLocale } from '../../../i18n/locales';

/**
 * Translation messages structure
 * Allows nested objects for organizing translations
 */
export interface I18nMessages {
  [key: string]: string | I18nMessages;
}

/**
 * Internationalization service
 * Handles loading translations and providing translated strings
 */
@Injectable({
  providedIn: 'root'
})
export class I18nService {
  private readonly http = inject(HttpClient);

  private currentLocale = signal<SupportedLocale>('en');
  private messages = signal<I18nMessages>({});
  private isLoading = signal(false);

  /** Current locale signal (readonly) */
  readonly locale = this.currentLocale.asReadonly();

  /** Loading state signal (readonly) */
  readonly loading = this.isLoading.asReadonly();

  constructor() {
    // Restore locale from localStorage on init
    const saved = localStorage.getItem('locale') as SupportedLocale;
    if (saved && (saved === 'en' || saved === 'zh')) {
      this.currentLocale.set(saved);
    }

    // Load messages for current locale
    this.loadMessagesForLocale(this.currentLocale());
  }

  /**
   * Load translation messages for a locale
   * @param locale Locale to load
   * @returns Observable of translation messages
   */
  loadMessages(locale: SupportedLocale): Observable<I18nMessages> {
    return this.http.get<I18nMessages>(`/i18n/${locale}.json`).pipe(
      catchError((error) => {
        console.error(`Failed to load translations for locale "${locale}":`, error);
        // Return empty object on error to prevent app crash
        return of({});
      })
    );
  }

  /**
   * Load and set messages for a locale (internal)
   */
  private loadMessagesForLocale(locale: SupportedLocale): void {
    if (this.isLoading()) {
      return; // Prevent concurrent loads
    }

    this.isLoading.set(true);
    firstValueFrom(this.loadMessages(locale)).then((messages) => {
      this.messages.set(messages);
      this.isLoading.set(false);
    });
  }

  /**
   * Set current locale and load messages
   * @param locale Locale to switch to
   */
  async setLocale(locale: SupportedLocale): Promise<void> {
    if (this.currentLocale() === locale) {
      return; // Already using this locale
    }

    this.currentLocale.set(locale);
    localStorage.setItem('locale', locale);
    this.loadMessagesForLocale(locale);
  }

  /**
   * Get translation message by key
   * Supports nested keys with dot notation (e.g., 'menu.dashboard')
   * @param key Translation key (supports dot notation for nested keys)
   * @param params Optional parameters to replace in the translation string
   * @returns Translated string or the key if not found
   */
  translate(key: string, params?: Record<string, string | number>): string {
    const keys = key.split('.');
    let value: any = this.messages();

    // Traverse nested object
    for (const k of keys) {
      value = value?.[k];
    }

    // Return key if translation not found
    if (typeof value !== 'string') {
      return key;
    }

    // Replace {{param}} placeholders with actual values
    if (params) {
      return value.replace(/\{\{(\w+)\}\}/g, (_, match) => {
        return params[match]?.toString() || `{{${match}}}`;
      });
    }

    return value;
  }

  /**
   * Get the current locale
   */
  getLocale(): SupportedLocale {
    return this.currentLocale();
  }

  /**
   * Check if a translation key exists
   * @param key Translation key to check
   * @returns true if the key exists in current translations
   */
  has(key: string): boolean {
    const keys = key.split('.');
    let value: any = this.messages();

    for (const k of keys) {
      value = value?.[k];
      if (value === undefined) {
        return false;
      }
    }

    return typeof value === 'string';
  }

  /**
   * Initialize locale from storage or browser language
   * Call this method on app startup
   */
  async initialize(): Promise<void> {
    const saved = localStorage.getItem('locale') as SupportedLocale;
    const browserLang = navigator.language.startsWith('zh') ? 'zh' : 'en';
    const locale = saved || browserLang;

    await this.setLocale(locale);
  }
}
