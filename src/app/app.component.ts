import { Component, HostListener, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterOutlet, Router } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { TranslocoDirective } from '@jsverse/transloco';
import { MAIN_MENU_ITEMS } from './shared/constants/menu-items';

@Component({
    selector: 'app-root',
    imports: [CommonModule, RouterOutlet, RouterLink, LucideAngularModule, TranslocoDirective],
    templateUrl: './app.component.html',
    styleUrl: './app.component.css'
})
export class AppComponent {
    private router = inject(Router);

    menuItems = MAIN_MENU_ITEMS;
    currentYear = new Date().getFullYear();

    // UI state
    showStatusPanel = signal(false);
    showShortcutsModal = signal(false);

    isActive(link: string | any[]): boolean {
        const linkStr = typeof link === 'string' ? link : link.join('/');
        // 精确匹配或前缀匹配
        return this.router.isActive(linkStr, false) || this.router.url.startsWith(linkStr + '/');
    }

    showShortcuts(): void {
        this.showShortcutsModal.set(true);
    }

    closeShortcuts(): void {
        this.showShortcutsModal.set(false);
    }

    toggleStatusPanel(): void {
        this.showStatusPanel.set(!this.showStatusPanel());
    }

    @HostListener('window:keydown', ['$event'])
    handleKeyboard(event: KeyboardEvent): void {
        // Ctrl+K: Quick search
        if ((event.ctrlKey || event.metaKey) && event.key === 'k') {
            event.preventDefault();
            const searchInput = document.querySelector('input[placeholder="Ctrl+K"]') as HTMLInputElement;
            if (searchInput) {
                searchInput.focus();
            }
        }

        // Ctrl+S: Toggle status panel
        if ((event.ctrlKey || event.metaKey) && event.key === 's') {
            event.preventDefault();
            this.toggleStatusPanel();
        }

        // Ctrl+1-9: Navigate to menu items
        if ((event.ctrlKey || event.metaKey) && /^[1-9]$/.test(event.key)) {
            event.preventDefault();
            const index = parseInt(event.key) - 1;
            const topLevelItems = this.menuItems.filter(item => !item.divider && item.link);
            if (topLevelItems[index]) {
                this.router.navigate([topLevelItems[index].link]);
            }
        }

        // Ctrl+/: Show keyboard shortcuts
        if ((event.ctrlKey || event.metaKey) && event.key === '/') {
            event.preventDefault();
            this.showShortcuts();
        }

        // Escape: Close modals
        if (event.key === 'Escape') {
            if (this.showShortcutsModal()) {
                this.closeShortcuts();
            }
            if (this.showStatusPanel()) {
                this.toggleStatusPanel();
            }
        }
    }

    // Get menu items with shortcuts for display
    getShortcutItems(): { label: string; shortcut: string }[] {
        return this.menuItems
            .filter(item => !item.divider && item.link && item.shortcut)
            .map(item => ({ label: item.label!, shortcut: item.shortcut! }));
    }
}
