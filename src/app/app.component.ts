import { Component, HostListener, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterOutlet, Router } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { MAIN_MENU_ITEMS } from './shared/constants/menu-items';
import { I18nService } from './core/services/i18n.service';
import { I18nPipe } from './shared/pipes/i18n.pipe';

@Component({
    selector: 'app-root',
    imports: [CommonModule, RouterOutlet, RouterLink, LucideAngularModule, I18nPipe],
    templateUrl: './app.component.html',
    styleUrl: './app.component.css'
})
export class AppComponent implements OnInit {
    private router = inject(Router);
    private i18n = inject(I18nService);

    menuItems = MAIN_MENU_ITEMS;
    currentYear = new Date().getFullYear();

    // UI state
    showStatusPanel = signal(false);
    showShortcutsModal = signal(false);

    async ngOnInit(): Promise<void> {
        // Initialize i18n on app startup
        await this.i18n.initialize();
    }

    isActive(link: string | any[]): boolean {
        return this.router.isActive(typeof link === 'string' ? link : link.join('/'), true);
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
