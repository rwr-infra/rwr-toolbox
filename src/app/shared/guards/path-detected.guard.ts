import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { DirectoryService } from '../../features/settings/services/directory.service';
import { invoke } from '@tauri-apps/api/core';

/**
 * Route guard that checks if RWR installation path has been detected.
 * Redirects to settings page if no valid path is configured.
 *
 * @returns True if path is detected, UrlTree for redirect otherwise
 */
export const pathDetectedGuard: CanActivateFn = async (route, state) => {
    const router = inject(Router);
    const directoryService = inject(DirectoryService);

    // 1. Check in-memory signal state first (Fastest)
    const validDirectories = directoryService.getValidDirectories();

    if (validDirectories.length === 0) {
        console.warn('[Guard] No valid directories configured, redirecting...');
        return router.createUrlTree(['/settings'], {
            queryParams: { returnUrl: state.url, reason: 'no_path' },
        });
    }

    // 2. Perform a physical check on at least one path to handle external deletions
    // We only check the first one for performance
    try {
        const pathExists = await invoke<boolean>('check_path_exists', {
            path: validDirectories[0].path,
        });

        if (!pathExists) {
            console.error(
                '[Guard] Configured path no longer exists on disk:',
                validDirectories[0].path,
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
