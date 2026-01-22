import { Routes } from '@angular/router';
import { pathDetectedGuard } from './shared/guards/path-detected.guard';

export const routes: Routes = [
    // Legacy redirect
    {
        path: 'home',
        redirectTo: '/dashboard',
        pathMatch: 'full',
    },

    // Dashboard
    {
        path: '',
        redirectTo: '/dashboard',
        pathMatch: 'full',
    },
    {
        path: 'dashboard',
        loadComponent: () =>
            import('./features/dashboard/dashboard.component').then(
                (m) => m.DashboardComponent,
            ),
        data: {
            title: 'Dashboard',
            icon: 'layout-dashboard',
            description: 'Overview and quick access',
        },
    },

    // Servers
    {
        path: 'servers',
        loadComponent: () =>
            import('./features/servers/servers.component').then(
                (m) => m.ServersComponent,
            ),
        data: {
            title: 'Servers',
            icon: 'server',
            description: 'Browse and manage servers',
        },
    },

    // Players
    {
        path: 'players',
        loadComponent: () =>
            import('./features/players/players.component').then(
                (m) => m.PlayersComponent,
            ),
        data: {
            title: 'Players',
            icon: 'users',
            description: 'Search and track players',
        },
    },

    // Data Section (Feature 001: Simplified to directly show local data with weapons/items tabs)
    {
        path: 'data',
        loadComponent: () =>
            import('./features/data/local/local.component').then(
                (m) => m.LocalComponent,
            ),
        data: {
            title: 'Data',
            icon: 'database',
            description: 'Browse game data (Weapons and Items)',
        },
    },

    // Legacy data routes for backward compatibility (accessible via direct URL)
    {
        path: 'data/local',
        redirectTo: '/data',
        pathMatch: 'full',
    },
    {
        path: 'data/extract',
        loadComponent: () =>
            import('./features/data/extract/extract.component').then(
                (m) => m.ExtractComponent,
            ),
        data: {
            title: 'Extract Data',
            icon: 'database',
            description: 'Extract and export data',
        },
    },
    {
        path: 'data/workshop',
        loadComponent: () =>
            import('./features/data/workshop/workshop.component').then(
                (m) => m.WorkshopComponent,
            ),
        canActivate: [pathDetectedGuard],
        data: {
            title: 'Workshop Data',
            icon: 'folder-open',
            description: 'View workshop content',
            requiresPathDetection: true,
        },
    },

    // Mods Section (Parent Layout)
    {
        path: 'mods',
        loadComponent: () =>
            import('./features/mods/mods-layout/mods-layout.component').then(
                (m) => m.ModsLayoutComponent,
            ),
        children: [
            {
                path: '',
                redirectTo: 'install',
                pathMatch: 'full',
            },
            {
                path: 'install',
                loadComponent: () =>
                    import('./features/mods/install/install.component').then(
                        (m) => m.InstallComponent,
                    ),
                data: {
                    title: 'Install Mods',
                    icon: 'cloud-download',
                    description: 'Install mods to game directory',
                },
            },
            {
                path: 'bundle',
                loadComponent: () =>
                    import('./features/mods/bundle/bundle.component').then(
                        (m) => m.BundleComponent,
                    ),
                data: {
                    title: 'Bundle Mods',
                    icon: 'box',
                    description: 'Package mods for distribution',
                },
            },
        ],
        data: {
            title: 'Mods',
            icon: 'package',
            description: 'Mod management tools',
        },
    },

    // Hotkeys
    {
        path: 'hotkeys',
        loadComponent: () =>
            import('./features/hotkeys/hotkeys.component').then(
                (m) => m.HotkeysComponent,
            ),
        data: {
            title: 'Hotkeys',
            icon: 'keyboard',
            description: 'Configure keyboard shortcuts',
        },
    },

    // Settings
    {
        path: 'settings',
        loadComponent: () =>
            import('./features/settings/settings.component').then(
                (m) => m.SettingsComponent,
            ),
        data: {
            title: 'Settings',
            icon: 'settings',
            description: 'Application configuration',
        },
    },

    // About
    {
        path: 'about',
        loadComponent: () =>
            import('./features/about/about.component').then(
                (m) => m.AboutComponent,
            ),
        data: {
            title: 'About',
            icon: 'info',
            description: 'About RWR Toolbox',
        },
    },

    // Global 404
    {
        path: '**',
        loadComponent: () =>
            import('./notfound/notfound.component').then(
                (m) => m.NotfoundComponent,
            ),
    },
];
