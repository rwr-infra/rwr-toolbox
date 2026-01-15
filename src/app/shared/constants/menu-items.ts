import { MenuItem } from '../interfaces/menu-item.interface';

/**
 * Main navigation menu structure for RWR Toolbox
 * Labels and descriptions are keys for Transloco translation
 */
export const MAIN_MENU_ITEMS: MenuItem[] = [
    {
        label: 'menu.dashboard',
        icon: 'layout-dashboard',
        link: '/dashboard',
        shortcut: 'Ctrl+1',
        description: 'menu.dashboard_desc',
    },
    {
        label: 'menu.servers',
        icon: 'server',
        link: '/servers',
        shortcut: 'Ctrl+2',
        description: 'menu.servers_desc',
    },
    {
        label: 'menu.players',
        icon: 'users',
        link: '/players',
        shortcut: 'Ctrl+3',
        description: 'menu.players_desc',
    },
    {
        label: 'menu.data',
        icon: 'database',
        link: '/data',
        description: 'menu.data_desc',
        children: [
            {
                label: 'menu.local_data',
                icon: 'hard-drive',
                link: '/data/local',
                description: 'menu.local_data_desc',
            },
            {
                label: 'menu.extract',
                icon: 'download',
                link: '/data/extract',
                description: 'menu.extract_desc',
            },
            {
                label: 'menu.workshop',
                icon: 'folder-open',
                link: '/data/workshop',
                description: 'menu.workshop_desc',
            },
        ],
    },
    {
        label: 'menu.mods',
        icon: 'package',
        link: '/mods',
        description: 'menu.mods_desc',
        children: [
            {
                label: 'menu.install',
                icon: 'cloud-download',
                link: '/mods/install',
                description: 'menu.install_desc',
            },
            {
                label: 'menu.bundle',
                icon: 'box',
                link: '/mods/bundle',
                description: 'menu.bundle_desc',
            },
        ],
    },
    {
        label: 'menu.hotkeys',
        icon: 'keyboard',
        link: '/hotkeys',
        shortcut: 'Ctrl+4',
        description: 'menu.hotkeys_desc',
    },
    {
        divider: true,
    },
    {
        label: 'menu.settings',
        icon: 'settings',
        link: '/settings',
        shortcut: 'Ctrl+5',
        description: 'menu.settings_desc',
    },
    {
        divider: true,
    },
    {
        label: 'menu.about',
        icon: 'info',
        link: '/about',
        shortcut: 'Ctrl+6',
        description: 'menu.about_desc',
    },
];
