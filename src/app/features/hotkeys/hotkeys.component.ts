import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';
import { HotkeyService } from './services/hotkey.service';
import { IHotkeyConfigItem } from '../../shared/models/hotkeys.models';

@Component({
    selector: 'app-hotkeys',
    imports: [
        CommonModule,
        FormsModule,
        LucideAngularModule,
        TranslocoDirective,
    ],
    templateUrl: './hotkeys.component.html',
})
export class HotkeysComponent implements OnInit {
    private hotkeyService = inject(HotkeyService);
    private transloco = inject(TranslocoService);

    // Use signals directly from service (refactored to Signal pattern)
    readonly loading = this.hotkeyService.loadingSig;
    readonly error = this.hotkeyService.errorSig;
    readonly profiles = this.hotkeyService.profilesSig;
    readonly currentConfig = this.hotkeyService.currentConfigSig;
    readonly activeProfile = this.hotkeyService.activeProfileSig;

    // UI State
    activeTab: 'read' | 'profiles' = 'read';
    showCreateModal = false;
    showDeleteConfirm = false;
    profileToDelete: string | null = null;
    showImportFromClipboardModal = false;
    showCreateDefaultHotkeysModal = false;
    clipboardImportError: string | null = null;
    clipboardImportSuccess = false;
    showShareSuccessModal = false;
    shareError: string | null = null;

    // New/Edit Profile Form
    newProfileTitle = '';
    newProfileConfig: IHotkeyConfigItem[] = [];
    editingProfileId: string | null = null;

    ngOnInit(): void {
        this.hotkeyService.initialize().subscribe();
    }

    /**
     * Read hotkeys from game
     */
    onReadFromGame(): void {
        this.hotkeyService.readFromGame().subscribe({
            next: () => {
                // Preview is now automatically available via currentConfig signal
                this.showCreateDefaultHotkeysModal = false;
            },
            error: (err) => {
                const message =
                    typeof err === 'string'
                        ? err
                        : err instanceof Error
                          ? err.message
                          : String(err);

                if (
                    message === 'hotkeys.hotkeys_file_missing' ||
                    message.includes('hotkeys.xml not found')
                ) {
                    this.showCreateDefaultHotkeysModal = true;
                }
                console.error('Failed to read:', err);
            },
        });
    }

    onCreateDefaultHotkeys(): void {
        this.hotkeyService.createDefaultHotkeys().subscribe({
            next: () => {
                this.showCreateDefaultHotkeysModal = false;
                this.onReadFromGame();
            },
            error: (err) =>
                console.error('Failed to create default hotkeys:', err),
        });
    }

    /**
     * Create or update profile
     */
    onCreateProfile(): void {
        if (!this.newProfileTitle.trim()) {
            return;
        }

        if (this.editingProfileId) {
            // Update existing profile
            this.hotkeyService
                .updateProfile(this.editingProfileId, {
                    title: this.newProfileTitle,
                    config: this.newProfileConfig,
                })
                .subscribe({
                    next: () => {
                        this.closeModal();
                    },
                    error: (err) =>
                        console.error('Failed to update profile:', err),
                });
        } else {
            // Create new profile
            this.hotkeyService
                .createProfile({
                    title: this.newProfileTitle,
                    config: this.newProfileConfig,
                })
                .subscribe({
                    next: () => {
                        this.closeModal();
                    },
                    error: (err) =>
                        console.error('Failed to create profile:', err),
                });
        }
    }

    /**
     * Close modal and reset form
     */
    closeModal(): void {
        this.newProfileTitle = '';
        this.newProfileConfig = [];
        this.editingProfileId = null;
        this.showCreateModal = false;
    }

    /**
     * Open create modal with optional initial config
     */
    openCreateModal(initialConfig?: IHotkeyConfigItem[]): void {
        this.editingProfileId = null;
        this.newProfileTitle = '';
        this.newProfileConfig = initialConfig ? [...initialConfig] : [];
        this.showCreateModal = true;
    }

    /**
     * Open edit modal for existing profile
     */
    openEditProfileModal(id: string): void {
        const profile = this.profiles()?.profiles.find((p) => p.id === id);
        if (!profile) {
            console.error('Profile not found:', id);
            return;
        }

        this.editingProfileId = id;
        this.newProfileTitle = profile.title;
        this.newProfileConfig = [...profile.config];
        this.showCreateModal = true;
    }

    /**
     * Add new hotkey to new profile
     */
    onAddHotkey(): void {
        this.newProfileConfig.push({ label: '', value: '' });
    }

    /**
     * Remove hotkey from new profile
     */
    onRemoveHotkey(index: number): void {
        this.newProfileConfig.splice(index, 1);
    }

    /**
     * Delete profile
     */
    onDeleteProfile(id: string): void {
        this.profileToDelete = id;
        this.showDeleteConfirm = true;
    }

    confirmDelete(): void {
        if (this.profileToDelete) {
            this.hotkeyService.deleteProfile(this.profileToDelete).subscribe({
                next: () => {
                    this.showDeleteConfirm = false;
                    this.profileToDelete = null;
                },
                error: (err) => console.error('Failed to delete:', err),
            });
        }
    }

    /**
     * Apply profile to game
     */
    onApplyProfile(id: string): void {
        this.hotkeyService.applyProfile(id).subscribe({
            next: () => {
                alert('Profile applied successfully!');
            },
            error: (err) => console.error('Failed to apply:', err),
        });
    }

    /**
     * Export profile
     */
    async onExportProfile(id: string): Promise<void> {
        try {
            await this.hotkeyService.exportProfile(id);
        } catch (err) {
            console.error('Failed to export:', err);
        }
    }

    /**
     * Import profile
     */
    async onImportProfile(): Promise<void> {
        try {
            await this.hotkeyService.importProfile();
        } catch (err) {
            console.error('Failed to import:', err);
        }
    }

    /**
     * Open hotkeys.xml in external editor
     */
    async onOpenInEditor(): Promise<void> {
        try {
            await this.hotkeyService.openInEditor();
        } catch (err) {
            console.error('Failed to open editor:', err);
        }
    }

    /**
     * Switch tab
     */
    switchTab(tab: 'read' | 'profiles'): void {
        this.activeTab = tab;
    }

    /**
     * Get game path (first valid scan directory)
     */
    get gamePath(): string | undefined {
        return this.hotkeyService.getConfiguredGamePath() ?? undefined;
    }

    /**
     * Check if game path is configured
     */
    get isGamePathConfigured(): boolean {
        return !!this.gamePath;
    }

    /**
     * Share profile to clipboard
     */
    async onShareProfile(id: string): Promise<void> {
        this.shareError = null;
        this.showShareSuccessModal = false;

        try {
            await this.hotkeyService.shareProfile(id);
            this.showShareSuccessModal = true;
            setTimeout(() => (this.showShareSuccessModal = false), 2000);
        } catch (err) {
            this.shareError = typeof err === 'string' ? err : 'Failed to copy';
        }
    }

    /**
     * Import profile from clipboard
     */
    async onImportFromClipboard(): Promise<void> {
        this.clipboardImportError = null;
        this.clipboardImportSuccess = false;

        try {
            const isValid = await this.hotkeyService.validateClipboard();
            if (!isValid) {
                this.clipboardImportError = 'hotkeys.import_invalid_format';
                this.showImportFromClipboardModal = true;
                return;
            }

            await this.hotkeyService.importProfileFromClipboard();
            this.clipboardImportSuccess = true;
            this.showImportFromClipboardModal = true;

            setTimeout(() => (this.showImportFromClipboardModal = false), 2000);
        } catch (err) {
            this.clipboardImportError = this.mapClipboardErrorToKey(err);
            this.showImportFromClipboardModal = true;
        }
    }

    getDisplayText(message: string | null): string {
        if (!message) {
            return '';
        }

        const looksLikeI18nKey = /^[A-Za-z0-9_.-]+$/.test(message);
        return looksLikeI18nKey ? this.transloco.translate(message) : message;
    }

    private mapClipboardErrorToKey(error: unknown): string {
        const rawMessage =
            typeof error === 'string'
                ? error
                : error instanceof Error
                  ? error.message
                  : '';

        switch (rawMessage) {
            case 'Invalid format':
            case 'Invalid share format':
                return 'hotkeys.import_invalid_format';
            case 'Clipboard is empty':
                return 'hotkeys.clipboard_empty';
            default:
                return rawMessage.startsWith('hotkeys.')
                    ? rawMessage
                    : 'hotkeys.import_failed';
        }
    }

    /**
     * Close clipboard modal
     */
    closeClipboardModal(): void {
        this.showImportFromClipboardModal = false;
        this.clipboardImportError = null;
        this.clipboardImportSuccess = false;
    }

    /**
     * Format timestamp to readable date string
     */
    formatDate(timestamp: number): string {
        const date = new Date(timestamp);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) {
            return 'just now';
        } else if (diffMins < 60) {
            return `${diffMins}m ago`;
        } else if (diffHours < 24) {
            return `${diffHours}h ago`;
        } else if (diffDays < 7) {
            return `${diffDays}d ago`;
        } else {
            return date.toLocaleDateString();
        }
    }
}
