/**
 * Generic column configuration for data tables
 * Feature: 002-table-enhancements
 */

/**
 * Generic column configuration for data tables
 */
export interface ColumnConfig<T = any> {
    /** Column key (unique identifier) */
    key: string;
    /** Field name in data entity */
    field: keyof T | string;
    /** Default label (fallback) */
    label: string;
    /** i18n key for translation */
    i18nKey: string;
    /** Text alignment */
    alignment: 'left' | 'center' | 'right';
    /** Always visible (cannot be toggled off) */
    alwaysVisible?: boolean;
    /** Data type for sorting */
    dataType?: 'string' | 'number' | 'boolean' | 'date';
}

/**
 * Column visibility preference (per-tab)
 */
export interface ColumnVisibility {
    /** Column identifier */
    columnId: string;
    /** Is column currently shown */
    visible: boolean;
    /** Display order (optional) */
    order?: number;
}
