/**
 * Supported locales for the application
 */
export type SupportedLocale = 'en' | 'zh';

/**
 * List of all supported locales with their display names
 */
export const LOCALES: ReadonlyArray<{ value: SupportedLocale; label: string }> =
    [
        { value: 'en', label: 'English' },
        { value: 'zh', label: '中文' },
    ] as const;

/**
 * Default locale
 */
export const DEFAULT_LOCALE: SupportedLocale = 'en';
