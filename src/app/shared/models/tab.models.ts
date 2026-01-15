/**
 * Tab state types for data browser
 * Feature: 002-table-enhancements
 */

/**
 * Data tab type
 */
export type DataTab = 'weapons' | 'items';

/**
 * Per-tab state for filters, search, sort, and column visibility
 */
export interface TabState {
    /** Active tab */
    activeTab: DataTab;
    /** Weapons tab state */
    weapons: {
        searchTerm: string;
        filters: any; // AdvancedFilters type
        sort: import('./sort.models').SortState;
        columnVisibility: import('./column.models').ColumnVisibility[];
    };
    /** Items tab state */
    items: {
        searchTerm: string;
        filters: any; // ItemFilters type (to be defined)
        sort: import('./sort.models').SortState;
        columnVisibility: import('./column.models').ColumnVisibility[];
    };
}
