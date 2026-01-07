import { RouterLink } from '@angular/router';

/**
 * Navigation menu item interface
 */
export interface MenuItem {
    /** Display label for the menu item */
    label?: string;

    /** Lucide icon name */
    icon?: string;

    /** Router link path or link parameters array */
    link?: string | any[];

    /** Optional child menu items for nested menus */
    children?: MenuItem[];

    /** Whether to show a divider above this item */
    divider?: boolean;

    /** Optional badge text or number to display */
    badge?: string | number;

    /** Keyboard shortcut hint (e.g., "Ctrl+1") */
    shortcut?: string;

    /** Tooltip description for accessibility */
    description?: string;
}
