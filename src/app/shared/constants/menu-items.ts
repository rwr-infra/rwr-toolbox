import { MenuItem } from '../interfaces/menu-item.interface';

/**
 * Main navigation menu structure for RWR Toolbox
 * Labels and descriptions use i18n keys that will be translated by the i18n pipe
 */
export const MAIN_MENU_ITEMS: MenuItem[] = [
    {
        label: 'menu.dashboard',
        icon: 'layout-dashboard',
        link: '/dashboard',
        shortcut: 'Ctrl+1',
        description: 'menu.dashboardDescription'
    },
    {
        label: 'menu.servers',
        icon: 'server',
        link: '/servers',
        shortcut: 'Ctrl+2',
        description: 'menu.serversDescription'
    },
    {
        label: 'menu.players',
        icon: 'users',
        link: '/players',
        shortcut: 'Ctrl+3',
        description: 'menu.playersDescription'
    },
    {
        label: 'menu.data',
        icon: 'database',
        link: '/data',
        description: 'menu.dataDescription',
        children: [
            {
                label: 'data.localData',
                icon: 'hard-drive',
                link: '/data/local',
                description: 'data.browseLocalData'
            },
            {
                label: 'data.extract',
                icon: 'download',
                link: '/data/extract',
                description: 'data.extractResources'
            },
            {
                label: 'data.workshop',
                icon: 'folder-open',
                link: '/data/workshop',
                description: 'data.viewWorkshopContent'
            }
        ]
    },
    {
        label: 'menu.mods',
        icon: 'package',
        link: '/mods',
        description: 'menu.modsDescription',
        children: [
            {
                label: 'mods.install',
                icon: 'cloud-download',
                link: '/mods/install',
                description: 'mods.installToGame'
            },
            {
                label: 'mods.bundle',
                icon: 'box',
                link: '/mods/bundle',
                description: 'mods.packageForDistribution'
            }
        ]
    },
    {
        label: 'menu.hotkeys',
        icon: 'keyboard',
        link: '/hotkeys',
        shortcut: 'Ctrl+4',
        description: 'menu.configureHotkeys'
    },
    {
        divider: true
    },
    {
        label: 'menu.settings',
        icon: 'settings',
        link: '/settings',
        shortcut: 'Ctrl+5',
        description: 'menu.settingsDescription'
    },
    {
        divider: true
    },
    {
        label: 'menu.about',
        icon: 'info',
        link: '/about',
        shortcut: 'Ctrl+6',
        description: 'menu.aboutDescription'
    }
];
