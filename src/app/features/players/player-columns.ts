import {
    PlayerColumn,
    PlayerColumnVisibility,
} from '../../shared/models/player.models';

/**
 * All available player columns configuration
 */
export const PLAYER_COLUMNS: PlayerColumn[] = [
    {
        key: 'rowNumber',
        label: '#',
        i18nKey: 'players.column.rowNumber',
        alignment: 'center',
        alwaysVisible: true,
    },
    {
        key: 'username',
        label: 'Username',
        i18nKey: 'players.column.username',
        alignment: 'left',
        alwaysVisible: true,
    },
    {
        key: 'action',
        label: 'Action',
        i18nKey: 'players.column.action',
        alignment: 'center',
        alwaysVisible: true,
    },
    {
        key: 'kills',
        label: 'Kills',
        i18nKey: 'players.column.kills',
        alignment: 'right',
    },
    {
        key: 'deaths',
        label: 'Deaths',
        i18nKey: 'players.column.deaths',
        alignment: 'right',
    },
    {
        key: 'kd',
        label: 'K/D',
        i18nKey: 'players.column.kd',
        alignment: 'right',
    },
    {
        key: 'score',
        label: 'Score',
        i18nKey: 'players.column.score',
        alignment: 'right',
    },
    {
        key: 'timePlayed',
        label: 'Time',
        i18nKey: 'players.column.timePlayed',
        alignment: 'right',
    },
    {
        key: 'longestKillStreak',
        label: 'Streak',
        i18nKey: 'players.column.longestKillStreak',
        alignment: 'right',
    },
    {
        key: 'targetsDestroyed',
        label: 'Targets',
        i18nKey: 'players.column.targetsDestroyed',
        alignment: 'right',
    },
    {
        key: 'vehiclesDestroyed',
        label: 'Vehicles',
        i18nKey: 'players.column.vehiclesDestroyed',
        alignment: 'right',
    },
    {
        key: 'soldiersHealed',
        label: 'Heals',
        i18nKey: 'players.column.soldiersHealed',
        alignment: 'right',
    },
    {
        key: 'teamkills',
        label: "TK's",
        i18nKey: 'players.column.teamkills',
        alignment: 'right',
    },
    {
        key: 'distanceMoved',
        label: 'Distance',
        i18nKey: 'players.column.distanceMoved',
        alignment: 'right',
    },
    {
        key: 'shotsFired',
        label: 'Shots',
        i18nKey: 'players.column.shotsFired',
        alignment: 'right',
    },
    {
        key: 'throwablesThrown',
        label: 'Throws',
        i18nKey: 'players.column.throwablesThrown',
        alignment: 'right',
    },
    {
        key: 'rankProgression',
        label: 'XP',
        i18nKey: 'players.column.rankProgression',
        alignment: 'right',
    },
    {
        key: 'rankName',
        label: 'Rank',
        i18nKey: 'players.column.rankName',
        alignment: 'left',
    },
];

/**
 * Default column visibility settings
 */
export const DEFAULT_COLUMN_VISIBILITY: PlayerColumnVisibility = {
    rowNumber: true,
    username: true,
    action: true,
    kills: true,
    deaths: true,
    score: true,
    kd: true,
    timePlayed: true,
    rankProgression: true,
    rankName: true,
    longestKillStreak: false,
    targetsDestroyed: false,
    vehiclesDestroyed: false,
    soldiersHealed: false,
    teamkills: false,
    distanceMoved: false,
    shotsFired: false,
    throwablesThrown: false,
};
