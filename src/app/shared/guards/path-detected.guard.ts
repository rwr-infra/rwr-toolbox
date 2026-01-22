import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { SettingsService } from '../../core/services/settings.service';
import { invoke } from '@tauri-apps/api/core';

/**
 * Route guard that checks if RWR installation path has been detected.
 * Redirects to settings page if no valid path is configured.
 *
 * @returns True if path is detected, UrlTree for redirect otherwise
 */
export const pathDetectedGuard: CanActivateFn = async (route, state) => {
    const router = inject(Router);
    const settingsService = inject(SettingsService);

    // 1. Check in-memory settings first
    const gameDir = settingsService.getGameInstallDirectory();

    if (!gameDir) {
        console.warn(
            '[Guard] Game install directory not configured, redirecting...',
        );
        return router.createUrlTree(['/settings'], {
            queryParams: { returnUrl: state.url, reason: 'no_game_dir' },
        });
    }

    // 2. Physical existence check to handle external deletions
    try {
        const pathExists = await invoke<boolean>('check_path_exists', {
            path: gameDir,
        });

        if (!pathExists) {
            console.error(
                '[Guard] Configured game install directory no longer exists on disk:',
                gameDir,
            );
            return router.createUrlTree(['/settings'], {
                queryParams: { returnUrl: state.url, reason: 'path_missing' },
            });
        }
    } catch (error) {
        console.error('[Guard] Path verification failed:', error);
        // Fallback to true if backend call fails to avoid blocking users unnecessarily
        return true;
    }

    return true;
};
