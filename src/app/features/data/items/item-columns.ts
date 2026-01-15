/**
 * Column definitions for Items table
 * Feature: 002-table-enhancements
 */

import { ColumnConfig } from '../../../shared/models/column.models';

/**
 * Items table column definitions
 * Matches the columns defined in the Rust backend Item struct
 */
export const ITEM_COLUMNS: ColumnConfig[] = [
    {
        key: 'key',
        field: 'key',
        label: 'Key',
        i18nKey: 'items.columns.key',
        alignment: 'left',
        alwaysVisible: false,
        dataType: 'string',
    },
    {
        key: 'name',
        field: 'name',
        label: 'Name',
        i18nKey: 'items.columns.name',
        alignment: 'left',
        alwaysVisible: true,
        dataType: 'string',
    },
    {
        key: 'itemType',
        field: 'itemType',
        label: 'Type',
        i18nKey: 'items.columns.itemType',
        alignment: 'center',
        alwaysVisible: false,
        dataType: 'string',
    },
    {
        key: 'slot',
        field: 'slot',
        label: 'Slot',
        i18nKey: 'items.columns.slot',
        alignment: 'center',
        alwaysVisible: false,
        dataType: 'string',
    },
    {
        key: 'encumbrance',
        field: 'encumbrance',
        label: 'Weight',
        i18nKey: 'items.columns.encumbrance',
        alignment: 'right',
        alwaysVisible: false,
        dataType: 'number',
    },
    {
        key: 'price',
        field: 'price',
        label: 'Price',
        i18nKey: 'items.columns.price',
        alignment: 'right',
        alwaysVisible: false,
        dataType: 'number',
    },
    {
        key: 'filePath',
        field: 'filePath',
        label: 'File Path',
        i18nKey: 'items.columns.filePath',
        alignment: 'left',
        alwaysVisible: true,
        dataType: 'string',
    },
];
