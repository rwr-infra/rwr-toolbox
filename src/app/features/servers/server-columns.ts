import {
    ServerColumn,
    ServerColumnVisibility,
} from '../../shared/models/server.models';

/**
 * All available server columns configuration
 */
export const SERVER_COLUMNS: ServerColumn[] = [
    {
        key: 'name',
        label: 'Name',
        i18nKey: 'servers.column.name',
        alignment: 'left',
        alwaysVisible: true,
    },
    {
        key: 'address',
        label: 'IP Address',
        i18nKey: 'servers.column.address',
        alignment: 'left',
    },
    {
        key: 'port',
        label: 'Port',
        i18nKey: 'servers.column.port',
        alignment: 'center',
    },
    {
        key: 'botCount',
        label: 'Bots',
        i18nKey: 'servers.column.bots',
        alignment: 'center',
    },
    {
        key: 'country',
        label: 'Country',
        i18nKey: 'servers.column.country',
        alignment: 'left',
    },
    {
        key: 'mode',
        label: 'Mode',
        i18nKey: 'servers.column.mode',
        alignment: 'left',
    },
    {
        key: 'realm',
        label: 'Realm',
        i18nKey: 'servers.column.realm',
        alignment: 'left',
    },
    {
        key: 'map',
        label: 'Map',
        i18nKey: 'servers.column.map',
        alignment: 'left',
    },
    {
        key: 'mapId',
        label: 'Map ID',
        i18nKey: 'servers.column.mapId',
        alignment: 'left',
    },
    {
        key: 'playerCount',
        label: 'Players',
        i18nKey: 'servers.column.playerCount',
        alignment: 'center',
    },
    {
        key: 'playerNames',
        label: 'Player List',
        i18nKey: 'servers.column.playerList',
        alignment: 'left',
    },
    {
        key: 'comment',
        label: 'Comment',
        i18nKey: 'servers.column.comment',
        alignment: 'left',
    },
    {
        key: 'dedicated',
        label: 'Dedicated',
        i18nKey: 'servers.column.dedicated',
        alignment: 'center',
    },
    {
        key: 'mod',
        label: 'Mod',
        i18nKey: 'servers.column.mod',
        alignment: 'center',
    },
    {
        key: 'steamLink',
        label: 'URL',
        i18nKey: 'servers.column.url',
        alignment: 'left',
    },
    {
        key: 'version',
        label: 'Version',
        i18nKey: 'servers.column.version',
        alignment: 'left',
    },
    {
        key: 'ping',
        label: 'Ping',
        i18nKey: 'servers.column.ping',
        alignment: 'center',
    },
    {
        key: 'action',
        label: 'Action',
        i18nKey: 'servers.column.action',
        alignment: 'center',
        alwaysVisible: true,
    },
];

/**
 * Default server column visibility settings
 * (Align with the reference defaults: focus on name/map/playerCount/playerList/action)
 */
export const DEFAULT_SERVER_COLUMN_VISIBILITY: ServerColumnVisibility = {
    name: true,
    address: false,
    port: false,
    botCount: false,
    country: false,
    mode: false,
    realm: false,
    map: true,
    mapId: false,
    playerCount: true,
    playerNames: true,
    comment: false,
    dedicated: false,
    mod: false,
    steamLink: false,
    version: false,
    ping: false,
    action: true,
};
