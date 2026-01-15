import {
  Component,
  inject,
  computed,
  signal,
  OnInit,
} from '@angular/core';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { invoke } from '@tauri-apps/api/core';
import { WeaponService } from './services/weapon.service';
import { SettingsService } from '../../../core/services/settings.service';
import { Weapon, AdvancedFilters } from '../../../shared/models/weapons.models';
import { WEAPON_COLUMNS } from './weapon-columns';

/**
 * Weapons table component with search, filters, and column visibility
 * Feature: 001-weapons-directory-scanner
 * Uses Angular v20 Signals pattern
 */
@Component({
  selector: 'app-weapons',
  imports: [TranslocoPipe],
  templateUrl: './weapons.component.html',
  styleUrl: './weapons.component.scss',
})
export class WeaponsComponent implements OnInit {
  private weaponService = inject(WeaponService);
  private settingsService = inject(SettingsService);
  private transloco = inject(TranslocoService);

  // Readonly signals from service
  readonly weapons = this.weaponService.filteredWeapons;
  readonly loading = this.weaponService.loadingSig;
  readonly error = this.weaponService.errorSig;
  readonly visibleColumns = this.weaponService.visibleColumnsSig;

  // UI state signals
  readonly searchTerm = signal<string>('');
  readonly showAdvancedSearch = signal<boolean>(false);
  readonly advancedFilters = signal<AdvancedFilters>({});

  // Table columns
  readonly columns = WEAPON_COLUMNS;

  // Computed signals
  readonly weaponCount = computed(() => this.weapons().length);
  readonly hasError = computed(() => this.error() !== null);

  constructor() {
    // Load column visibility from localStorage on init
    this.weaponService.setColumnVisibility(this.weaponService.getColumnVisibility());
  }

  ngOnInit(): void {
    // Load weapons on component init
    this.loadWeapons();
  }

  /** Load weapons from game directory */
  async loadWeapons(): Promise<void> {
    const gamePath = this.settingsService.getGamePath();
    if (!gamePath) {
      const errorMsg = this.transloco.translate('weapons.errors.noGamePath');
      this.weaponService['error'].set(errorMsg);
      return;
    }
    await this.weaponService.scanWeapons(gamePath);
  }

  /** Handle search input */
  onSearch(term: string): void {
    this.searchTerm.set(term);
    this.weaponService.setSearchTerm(term);
  }

  /** Toggle advanced search panel */
  toggleAdvancedSearch(): void {
    this.showAdvancedSearch.update((v) => !v);
  }

  /** Handle advanced filters change */
  onAdvancedFiltersChange(filters: AdvancedFilters): void {
    this.advancedFilters.set(filters);
    this.weaponService.setAdvancedFilters(filters);
  }

  /** Clear all filters */
  onClearFilters(): void {
    this.searchTerm.set('');
    this.advancedFilters.set({});
    this.weaponService.clearFilters();
  }

  /** Toggle column visibility */
  onColumnToggle(columnId: string): void {
    const current = this.visibleColumns();
    const updated = current.map((col) =>
      col.columnId === columnId ? { ...col, visible: !col.visible } : col
    );
    this.weaponService.setColumnVisibility(updated);
  }

  /** Refresh weapons from game directory */
  async onRefresh(): Promise<void> {
    const gamePath = this.settingsService.getGamePath();
    if (!gamePath) {
      const errorMsg = this.transloco.translate('weapons.errors.noGamePath');
      this.weaponService['error'].set(errorMsg);
      return;
    }
    await this.weaponService.refreshWeapons(gamePath);
  }

  /** Handle weapon row click - show details */
  onRowClick(weapon: Weapon): void {
    // TODO: Open weapon detail modal
    console.log('Show weapon details:', weapon);
  }

  /** Open weapon file in default editor */
  async onOpenInEditor(weapon: Weapon): Promise<void> {
    try {
      await invoke('open_file_in_editor', {
        filePath: weapon.sourceFile,
      });
    } catch (error) {
      console.error('Failed to open file:', error);
      const errorMsg = this.transloco.translate('weapons.errors.openFileFailed', {
        file: weapon.filePath,
      });
      this.weaponService['error'].set(errorMsg);
    }
  }

  /** Copy file path to clipboard */
  async onCopyPath(weapon: Weapon): Promise<void> {
    try {
      await navigator.clipboard.writeText(weapon.sourceFile);
      // Show success feedback (optional - could add a toast notification)
      console.log('Copied path:', weapon.sourceFile);
    } catch (error) {
      console.error('Failed to copy path:', error);
      const errorMsg = this.transloco.translate('weapons.errors.copyPathFailed', {
        file: weapon.filePath,
      });
      this.weaponService['error'].set(errorMsg);
    }
  }

  /** Get visible columns for display */
  getVisibleColumns() {
    const visibilityMap = new Map(
      this.visibleColumns().map((c) => [c.columnId, c.visible])
    );
    return this.columns.filter((col) => visibilityMap.get(col.key) !== false);
  }
}
