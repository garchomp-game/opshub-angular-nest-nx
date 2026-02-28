import { ApplicationConfig, ErrorHandler, provideZoneChangeDetection } from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import {
    provideHttpClient, withInterceptors, withFetch,
} from '@angular/common/http';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { registerLocaleData } from '@angular/common';
import ja from '@angular/common/locales/ja';

import { providePrimeNG } from 'primeng/config';
import { MessageService, ConfirmationService } from 'primeng/api';
import Aura from '@primeuix/themes/aura';

import { APP_ROUTES } from './app.routes';
import { authInterceptor } from './core/interceptors/auth.interceptor';
import { errorInterceptor } from './core/interceptors/error.interceptor';
import { GlobalErrorHandler } from './core/services/global-error-handler';

registerLocaleData(ja);

export const appConfig: ApplicationConfig = {
    providers: [
        provideZoneChangeDetection({ eventCoalescing: true }),
        provideRouter(APP_ROUTES, withComponentInputBinding()),
        provideHttpClient(
            withFetch(),
            withInterceptors([authInterceptor, errorInterceptor]),
        ),
        provideAnimationsAsync(),
        providePrimeNG({
            theme: {
                preset: Aura,
                options: {
                    darkModeSelector: '.dark',
                },
            },
        }),
        MessageService,
        ConfirmationService,
        { provide: ErrorHandler, useClass: GlobalErrorHandler },
    ],
};
