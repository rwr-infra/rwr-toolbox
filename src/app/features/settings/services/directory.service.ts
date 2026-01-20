import { Injectable, signal, computed, inject } from '@angular/core';
import { invoke } from '@tauri-apps/api/core';
import { Store } from '@tauri-apps/plugin-store';
import {
    ScanDirectory,
    DirectoryStatus,
    ValidationResult,
    ScanProgress,
    ScanState,
    DirectoryErrorCode,
} from '../../../shared/models/directory.models';
import { SettingsService } from '../../../core/services/settings.service';
import { WeaponService } from '../../data/weapons/services/weapon.service';
import { ItemService } from '../../data/items/services/item.service';

const SCAN_DIRECTORIES_KEY = 'scan_directories';

/**
 * Default scan directories (empty for multi-directory support)
 */
const DEFAULT_SCAN_DIRECTORIES: ScanDirectory[] = [];

/**
 * Directory management service for multi-directory scanning support.
 * Feature: 001-multi-directory-support
 *
 * Manages user-configured scan directories with validation and progress tracking.
 * Uses Angular v20 Signals pattern for reactive state management.
 */
@Injectable({
    providedIn: 'root',
})
export class DirectoryService {
    private settingsService: SettingsService = inject(SettingsService);
    private weaponService = inject(WeaponService);
    private itemService = inject(ItemService);
    private store: Store | null = null;

    // T016: Private writable signals
    private directoriesState = signal<ScanDirectory[]>(
        DEFAULT_SCAN_DIRECTORIES,
    );
    private validatingState = signal<Record<string, boolean>>({});
    private scanProgressState = signal<ScanProgress>({
        total: 0,
        completed: 0,
        currentPath: null,
        state: 'idle',
        errors: {},
    });
    private loadingState = signal<boolean>(false);
    private errorState = signal<string | null>(null);

    // T017: Public readonly signals
    readonly directoriesSig = this.directoriesState.asReadonly();
    readonly validatingSig = this.validatingState.asReadonly();
    readonly scanProgressSig = this.scanProgressState.asReadonly();
    readonly loadingSig = this.loadingState.asReadonly();
    readonly errorSig = this.errorState.asReadonly();

    /**
     * T004: Computed signal: Get selected directory object from SettingsService
     */
    readonly selectedDirectorySig = computed(() => {
        const selectedId = this.settingsService.settings().selectedDirectoryId;
        if (!selectedId) return null;
        return this.directoriesState().find(d => d.id === selectedId) || null;
    });

    /**
     * Computed signal: Is any directory currently being validated?
     */
    readonly isAnyValidatingSig = computed(() => {
        const validating = this.validatingState();
        return Object.values(validating).some((v) => v);
    });

    /**
     * T057: Computed signal: Validation progress percentage (0-100)
     */
    readonly validationProgressSig = computed(() => {
        const validating = this.validatingState();
        const activeCount = Object.values(validating).filter((v) => v).length;
        if (activeCount === 0) return 0;

        const totalToValidate = Object.keys(validating).length;
        return ((totalToValidate - activeCount) / totalToValidate) * 100;
    });

    /**
     * T026: Initialize service by loading scanDirectories from plugin-store
     */
    async initialize(): Promise<void> {
        // Load from plugin-store first (persisted settings)
        await this.loadDirectories();

        // Check if we have any directories configured (status will be 'pending' until revalidated)
        const hasAnyDirectories = this.directoriesState().length > 0;

        // T065: Initial revalidation of all directories to detect external changes
        await this.revalidateAll();

        // Auto-scan if we have any directories (triggers data loading on startup)
        // After revalidation, directories will be marked as 'valid' or 'invalid'
        if (hasAnyDirectories) {
            // Run scan in background without blocking initialization
            this.scanAllDirectories().catch((e) =>
                console.error('Auto-scan failed on startup:', e),
            );
        }
    }

    /**
     * Revalidate all directories
     */
    async revalidateAll(): Promise<void> {
        const directories = this.directoriesState();
        for (const dir of directories) {
            // Run revalidation in background, don't await all to not block initialization
            this.revalidateDirectory(dir.id).catch((e) =>
                console.error(`Failed to revalidate ${dir.path}:`, e),
            );
        }
    }

    /**
     * T018: Add a new directory with validation
     * @param path Directory path to add
     */
    async addDirectory(path: string): Promise<void> {
        // Check for duplicate directory
        if (this.hasPath(path)) {
            const errorMsg = this.getErrorMessage('duplicate_directory');
            this.errorState.set(errorMsg);
            throw new Error(errorMsg);
        }

        this.loadingState.set(true);
        this.errorState.set(null);

        try {
            // Validate directory
            const result = await this.validateDirectory(path);

            if (!result.valid) {
                const errorMsg = result.message;
                this.errorState.set(errorMsg);
                throw new Error(errorMsg);
            }

            // Create new ScanDirectory entry
            const newDirectory: ScanDirectory = {
                id: this.generateId(),
                path,
                status: 'valid',
                displayName: this.extractDisplayName(path),
                addedAt: Date.now(),
                lastScannedAt: 0,
                itemCount: 0,
                weaponCount: 0,
            };

            // Update state
            const updated = [...this.directoriesState(), newDirectory];
            this.directoriesState.set(updated);

            // Persist to plugin-store
            await this.saveScanDirs(updated);
        } finally {
            this.loadingState.set(false);
        }
    }

    /**
     * T019: Remove a directory by ID
     * @param directoryId ID of directory to remove
     */
    async removeDirectory(directoryId: string): Promise<void> {
        const updated = this.directoriesState().filter(
            (d) => d.id !== directoryId,
        );
        this.directoriesState.set(updated);
        await this.saveScanDirs(updated);
    }

    /**
     * T020: Validate a directory path using Tauri command
     * @param path Directory path to validate
     * @returns Validation result with error code and message
     */
    async validateDirectory(path: string): Promise<ValidationResult> {
        try {
            const result = await invoke<any>('validate_directory', { path });

            // Map Rust result to TypeScript ValidationResult
            return {
                valid: result.valid,
                errorCode: result.errorCode || null,
                message: result.message,
                details: result.details || undefined,
            };
        } catch (e) {
            return {
                valid: false,
                errorCode: 'access_denied' as DirectoryErrorCode,
                message: String(e),
            };
        }
    }

    /**
     * T021: Revalidate an existing directory
     * @param directoryId ID of directory to revalidate
     */
    async revalidateDirectory(directoryId: string): Promise<void> {
        const dir = this.getDirectory(directoryId);
        if (!dir) {
            throw new Error(`Directory not found: ${directoryId}`);
        }

        this.validatingState.update((v) => ({ ...v, [directoryId]: true }));

        try {
            const result = await this.validateDirectory(dir.path);

            // Update directory status
            const updated = this.directoriesState().map((d) =>
                d.id === directoryId
                    ? {
                          ...d,
                          status: (result.valid
                              ? 'valid'
                              : 'invalid') as DirectoryStatus,
                          lastError: result.valid ? undefined : result,
                      }
                    : d,
            );
            this.directoriesState.set(updated);

            if (!result.valid) {
                this.errorState.set(result.message);
            }

            // Persist to settings
            await this.settingsService.updateScanDirectories(updated);
        } finally {
            this.validatingState.update((v) => ({
                ...v,
                [directoryId]: false,
            }));
        }
    }

    /**
     * T022: Scan all configured directories sequentially
     */
    async scanAllDirectories(): Promise<void> {
        const directories = this.getValidDirectories();
        if (directories.length === 0) {
            this.errorState.set('No valid directories to scan');
            return;
        }

        // Clear existing data before multi-directory scan
        this.weaponService.clearWeapons();
        this.itemService.clearItems();

        this.scanProgressState.set({
            total: directories.length,
            completed: 0,
            currentPath: directories[0].path,
            state: 'scanning',
            errors: {},
        });

        const errors: Record<string, string> = {};

        for (const dir of directories) {
            this.scanProgressState.update((p) => ({
                ...p,
                currentPath: dir.path,
            }));

            try {
                // Scan weapons and items for this directory, appending to results
                const weapons = await this.weaponService.scanWeapons(
                    dir.path,
                    dir.path,
                    true,
                );
                const items = await this.itemService.scanItems(
                    dir.path,
                    dir.path,
                    true,
                );

                // Update directory metadata with scan results
                const updated = this.directoriesState().map((d) =>
                    d.id === dir.id
                        ? {
                              ...d,
                              lastScannedAt: Date.now(),
                              weaponCount: weapons.length,
                              itemCount: items.length,
                          }
                        : d,
                );
                this.directoriesState.set(updated);
                await this.settingsService.updateScanDirectories(updated);
            } catch (e) {
                errors[dir.path] = String(e);
            }

            this.scanProgressState.update((p) => ({
                ...p,
                completed: p.completed + 1,
            }));
        }

        const finalState: ScanState =
            Object.keys(errors).length > 0 ? 'partial' : 'completed';
        this.scanProgressState.update((p) => ({
            ...p,
            state: finalState,
            errors,
            currentPath: null,
        }));
    }

    /**
     * T023: Scan a single directory by ID
     * @param directoryId ID of directory to scan
     */
    async scanDirectory(directoryId: string): Promise<void> {
        const dir = this.getDirectory(directoryId);
        if (!dir) {
            throw new Error(`Directory not found: ${directoryId}`);
        }

        // Single directory scan (usually for refresh)
        // Note: This replaces results if append=false
        const weapons = await this.weaponService.scanWeapons(
            dir.path,
            dir.path,
        );
        const items = await this.itemService.scanItems(dir.path, dir.path);

        const updated = this.directoriesState().map((d) =>
            d.id === directoryId
                ? {
                      ...d,
                      lastScannedAt: Date.now(),
                      weaponCount: weapons.length,
                      itemCount: items.length,
                  }
                : d,
        );
        this.directoriesState.set(updated);
        await this.settingsService.updateScanDirectories(updated);
    }

    /**
     * T024: Cancel ongoing scan
     */
    cancelScan(): void {
        this.scanProgressState.update((p) => ({
            ...p,
            state: 'idle',
            currentPath: null,
        }));
    }

    /**
     * Query methods for directory information
     */
    getDirectory(directoryId: string): ScanDirectory | undefined {
        return this.directoriesState().find((d) => d.id === directoryId);
    }

    hasDirectory(directoryId: string): boolean {
        return this.directoriesState().some((d) => d.id === directoryId);
    }

    getValidDirectories(): ScanDirectory[] {
        return this.directoriesState().filter((d) => d.status === 'valid');
    }

    getTotalItemCount(): number {
        return this.directoriesState().reduce(
            (sum, d) => sum + (d.itemCount || 0),
            0,
        );
    }

    getTotalWeaponCount(): number {
        return this.directoriesState().reduce(
            (sum, d) => sum + (d.weaponCount || 0),
            0,
        );
    }

    /**
     * Load scan directories from Tauri plugin-store
     * Used for persistence across application sessions
     * Converts stored string[] paths to ScanDirectory[] objects
     */
    async loadDirectories(): Promise<void> {
        this.loadingState.set(true);
        try {
            if (!this.store) {
                this.store = await Store.load('settings.json');
            }
            const dirs = await this.store.get<string[]>(SCAN_DIRECTORIES_KEY);
            if (dirs) {
                const scanDirs: ScanDirectory[] = dirs.map((path) => ({
                    id: this.generateId(),
                    path,
                    status: 'pending',
                    displayName: this.extractDisplayName(path),
                    addedAt: Date.now(),
                    lastScannedAt: 0,
                    itemCount: 0,
                    weaponCount: 0,
                }));
                this.directoriesState.set(scanDirs);
            } else {
                // No persisted settings found, use default (empty array)
                this.directoriesState.set(DEFAULT_SCAN_DIRECTORIES);
            }
        } catch (error) {
            console.error('Failed to load scan directories:', error);
            // Graceful fallback - use empty array on corrupted settings
            this.directoriesState.set(DEFAULT_SCAN_DIRECTORIES);
        } finally {
            this.loadingState.set(false);
        }
    }

    /**
     * Save scan directories to Tauri plugin-store
     * Used for persistence across application sessions
     * Extracts paths from ScanDirectory[] and saves to Tauri store
     */
    async saveScanDirs(directories: ScanDirectory[]): Promise<void> {
        try {
            if (!this.store) {
                this.store = await Store.load('settings.json');
            }
            const paths = directories.map((d) => d.path);
            await this.store.set(SCAN_DIRECTORIES_KEY, paths);
            await this.store.save();
            await this.settingsService.updateScanDirectories(directories);
        } catch (error) {
            console.error('Failed to save scan directories:', error);
            throw error;
        }
    }

    /**
     * Check if a path already exists in directories
     */
    private hasPath(path: string): boolean {
        return this.directoriesState().some((d) => d.path === path);
    }

    /**
     * Generate unique ID for new directory
     */
    private generateId(): string {
        return `dir_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
    }

    /**
     * Extract display name from path
     */
    private extractDisplayName(path: string): string {
        const parts = path.split(/[/\\]/);
        return parts[parts.length - 1] || path;
    }

    /**
     * Get localized error message for error code
     */
    private getErrorMessage(errorCode: DirectoryErrorCode): string {
        const messages: Record<DirectoryErrorCode, string> = {
            path_not_found: 'settings.errors.pathNotFound',
            not_a_directory: 'settings.errors.notADirectory',
            access_denied: 'settings.errors.accessDenied',
            missing_media_subdirectory:
                'settings.errors.missingMediaSubdirectory',
            duplicate_directory: 'settings.errors.duplicateDirectory',
        };
        return messages[errorCode] || 'settings.errors.unknown';
    }

    /**
     * T004: Set the selected directory ID
     * @param directoryId Directory ID to select, or null to clear selection
     */
    async setSelectedDirectory(directoryId: string | null): Promise<void> {
        await this.settingsService.updateSettings({ selectedDirectoryId: directoryId });
    }

    /**
     * T004: Get the currently selected directory
     * @returns Selected ScanDirectory or null
     */
    getSelectedDirectory(): ScanDirectory | null {
        return this.selectedDirectorySig();
    }

    /**
     * T004: Get the first valid directory as a fallback
     * @returns First valid ScanDirectory or null
     */
    getFirstValidDirectory(): ScanDirectory | null {
        return this.getValidDirectories()[0] || null;
    }
}
