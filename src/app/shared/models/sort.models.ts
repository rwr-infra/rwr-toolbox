/**
 * Sort state types for data tables
 * Feature: 002-table-enhancements
 */

/**
 * Sorting direction
 */
export type SortDirection = 'asc' | 'desc' | null;

/**
 * Sort state for a data table
 */
export interface SortState {
    /** Column key currently being sorted */
    columnKey: string | null;
    /** Sort direction (null = no sort) */
    direction: SortDirection;
}

/**
 * Sort comparator function type
 */
export type SortComparator<T> = (a: T, b: T) => number;
