import {
    ApplicationConfig,
    isDevMode,
    provideAppInitializer,
    inject,
} from '@angular/core';
import { provideRouter } from '@angular/router';
import {
    provideHttpClient,
    withInterceptorsFromDi,
} from '@angular/common/http';
import { LUCIDE_ICONS, LucideIconProvider } from 'lucide-angular';
import { provideAnimations } from '@angular/platform-browser/animations';

import { routes } from './app.routes';
import { APP_ICONS } from './shared/icons';
import { TranslocoHttpLoader } from './transloco-loader';
import { provideTransloco } from '@jsverse/transloco';
import { SettingsService } from './core/services/settings.service';

export const appConfig: ApplicationConfig = {
    providers: [
        provideAppInitializer(async () => {
            await inject(SettingsService).initialize();
        }),
        provideRouter(routes),
        provideHttpClient(withInterceptorsFromDi()),
        provideAnimations(),
        {
            provide: LUCIDE_ICONS,
            multi: true,
            useValue: new LucideIconProvider(APP_ICONS),
        },
        provideTransloco({
            config: {
                availableLangs: ['en', 'zh'],
                defaultLang: localStorage.getItem('locale') || 'en',
                reRenderOnLangChange: true,
                prodMode: !isDevMode(),
            },
            loader: TranslocoHttpLoader,
        }),
    ],
};
