/**
 * Column definitions for Items table
 * Feature: 002-table-enhancements
 * Extended: 006-carry-items-full-parsing (capacity, commonness, modifiers)
 */

import { ColumnConfig } from '../../../shared/models/column.models';

/**
 * Items table column definitions
 * Matches the columns defined in the Rust backend Item struct
 * + IMAGE_COLUMN for item thumbnails (T019: Phase 4 - US2)
 */
export const ITEM_COLUMNS: ColumnConfig[] = [
    {
        key: 'image',
        field: 'key',
        label: 'Image',
        i18nKey: 'items.columns.image',
        alignment: 'center',
        alwaysVisible: true,
        dataType: 'string',
    },
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
    // Extended attributes (Feature 006)
    {
        key: 'capacityValue',
        field: 'capacity.value',
        label: 'Capacity',
        i18nKey: 'items.columns.capacityValue',
        alignment: 'right',
        alwaysVisible: false,
        dataType: 'number',
    },
    {
        key: 'capacitySource',
        field: 'capacity.source',
        label: 'Source',
        i18nKey: 'items.columns.capacitySource',
        alignment: 'left',
        alwaysVisible: false,
        dataType: 'string',
    },
    {
        key: 'commonnessValue',
        field: 'commonness.value',
        label: 'Spawn Rate',
        i18nKey: 'items.columns.commonnessValue',
        alignment: 'right',
        alwaysVisible: false,
        dataType: 'number',
    },
    {
        key: 'inStock',
        field: 'commonness.inStock',
        label: 'In Stock',
        i18nKey: 'items.columns.inStock',
        alignment: 'center',
        alwaysVisible: false,
        dataType: 'boolean',
    },
    {
        key: 'canRespawnWith',
        field: 'commonness.canRespawnWith',
        label: 'Respawn',
        i18nKey: 'items.columns.canRespawnWith',
        alignment: 'center',
        alwaysVisible: false,
        dataType: 'boolean',
    },
    // Additional attributes (Feature 006 - Clarifications 2025-01-19)
    {
        key: 'transformOnConsume',
        field: 'transformOnConsume',
        label: 'Transform On Consume',
        i18nKey: 'items.columns.transformOnConsume',
        alignment: 'left',
        alwaysVisible: false,
        dataType: 'string',
    },
    {
        key: 'timeToLive',
        field: 'timeToLive',
        label: 'Time To Live',
        i18nKey: 'items.columns.timeToLive',
        alignment: 'right',
        alwaysVisible: false,
        dataType: 'number',
    },
    {
        key: 'draggable',
        field: 'draggable',
        label: 'Draggable',
        i18nKey: 'items.columns.draggable',
        alignment: 'center',
        alwaysVisible: false,
        dataType: 'boolean',
    },
    // {
    //     key: 'modifiers',
    //     field: 'modifiers',
    //     label: 'Modifiers',
    //     i18nKey: 'items.columns.modifiers',
    //     alignment: 'left',
    //     alwaysVisible: false,
    //     dataType: 'string',
    // },
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
