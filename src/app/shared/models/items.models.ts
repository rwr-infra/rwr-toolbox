/**
 * Item data models for RWR game items
 * Feature: 002-table-enhancements
 */

/**
 * Generic item structure (all item types)
 */
export interface GameItem {
    /** Unique identifier for tracking (generated backend) */
    id: string;
    key?: string;
    name: string;
    itemType: string;
    encumbrance?: number;
    price?: number;
    canRespawnWith?: boolean;
    inStock?: boolean;
    filePath: string;
    sourceFile: string;
    packageName: string;
    /** Directory path where this item was scanned from (multi-directory support) */
    sourceDirectory: string;
    /** Extended attributes (Feature 006) - typically only for carry_item */
    capacity?: ItemCapacity;
    commonness?: ItemCommonness;
    modifiers?: ItemModifier[];
}

/**
 * Carry item specific fields
 */
export interface CarryItem extends GameItem {
    itemType: 'carry_item';
    slot?: string;
    transformOnConsume?: string;
    timeToLive?: number;
    draggable?: boolean;
    modifiers?: ItemModifier[];
    hudIcon?: string;
    modelFilename?: string;
    capacity?: ItemCapacity;
    commonness?: ItemCommonness;
}

/**
 * Visual item specific fields
 */
export interface VisualItem extends GameItem {
    itemType: 'visual_item';
    meshFilenames?: string[];
    effectRef?: string;
}

/**
 * Generic item union type
 */
export type GenericItem = CarryItem | VisualItem;

/**
 * Type guard to check if item is a CarryItem
 */
export function isCarryItem(item: GenericItem): item is CarryItem {
    return item.itemType === 'carry_item';
}

/**
 * Type guard to check if item is a VisualItem
 */
export function isVisualItem(item: GenericItem): item is VisualItem {
    return item.itemType === 'visual_item';
}

/**
 * Helper to get slot from item (returns undefined for VisualItem)
 */
export function getItemSlot(item: GenericItem): string | undefined {
    return isCarryItem(item) ? item.slot : undefined;
}

/**
 * Item modifier
 */
export interface ItemModifier {
    /** Unique identifier for tracking (generated frontend) */
    _id?: string;
    modifierClass: string;
    value?: number;
    inputCharacterState?: string;
    outputCharacterState?: string;
    consumesItem?: boolean;
}

/**
 * Item capacity/spawn requirements
 */
export interface ItemCapacity {
    value?: number;
    source?: string;
    sourceValue?: number;
}

/**
 * Item spawn frequency settings
 */
export interface ItemCommonness {
    value?: number;
    inStock?: boolean;
    canRespawnWith?: boolean;
}

/**
 * Item scan result from backend
 */
export interface ItemScanResult {
    items: GenericItem[];
    errors: ItemScanError[];
    duplicateKeys: string[];
    scanTime: number;
}

/**
 * Error during item scanning
 */
export interface ItemScanError {
    file: string;
    error: string;
    severity: string;
}
