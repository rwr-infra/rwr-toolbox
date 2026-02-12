# rwr-toolbox Development Guidelines

Auto-generated from all feature plans. Last updated: 2026-01-14

## Active Technologies
- TypeScript 5.8.3（Angular 20.3.15）+ Rust（edition 2021；Tauri 2.x） (001-weapons-directory-scanner)
- File-based configuration (Tauri settings store) (001-multi-directory-support)
- TypeScript 5.8.3 (Angular 20.3.15 frontend), Rust edition 2021 (Tauri 2.x backend) + Angular Signals, Transloco i18n, DaisyUI 5.5.14, Tailwind CSS 4.1.18, Tauri plugin-store (003-ux-improvements)
- Tauri plugin-store (file-based key-value persistence) (003-ux-improvements)
- TypeScript 5.8.3 (Angular 20.3.15) + Rust (edition 2021; Tauri 2.x) + Angular Signals, quick-xml (Rust), Transloco (i18n), DaisyUI 5.5.14, Tailwind CSS 4.1.18 (003-ux-improvements)
- Tauri plugin-store (settings), File-based XML (game data) (003-ux-improvements)
- TypeScript 5.8.3 (Angular 20.3.15) + Rust (edition 2021; Tauri 2.x) + Angular CDK 20.2.14 (virtual scrolling), Tauri 2.x (desktop framework), quick-xml (Rust XML parsing), Transloco (i18n), Tailwind CSS 4.x + DaisyUI 5.x (003-ux-improvements)
- Tauri plugin-store (file-based configuration) (003-ux-improvements)
- TypeScript 5.8.3 (Angular 20.3.15) + @angular/core, @angular/cdk (for virtual scrolling fallback), Transloco, Lucide Angular (003-ux-improvements)
- In-memory signals pattern (WeaponService, ItemService) (003-ux-improvements)
- TypeScript 5.8.3 (strict mode) + Angular v20.3.15, Transloco (i18n), DaisyUI v5.5.14, Lucide Angular v0.562.0 (001-page-size-selector)
- N/A (client-side state in Signals, localStorage for persistence) (001-page-size-selector)
- TypeScript 5.8.3 (frontend), Rust edition 2021 (backend via Tauri 2.x) + Angular 20.3.15, Tauri 2.x, Transloco 8.x, Tailwind CSS 4.x, DaisyUI 5.x (004-image-class-settings)
- Tauri plugin-store for persistent settings (004-image-class-settings)
- TypeScript 5.8.3 (Angular 20.3.15), Rust edition 2021 + Angular v20.3.15, Tauri 2.x, serde (Rust), Signals (Angular) (005-005-tag-column)
- localStorage for column visibility preferences (005-005-tag-column)
- Rust edition 2021 (backend), TypeScript 5.8.3 (frontend) + quick-xml 0.37 (XML parsing), serde 1 (serialization), Angular Signals v20 (state management), Transloco (i18n) (006-carry-items-full-parsing)
- File-based XML game data, in-memory signals for runtime state (006-carry-items-full-parsing)
- TypeScript 5.8.3 (Angular 20.3.15 frontend), Rust edition 2021 (Tauri 2.x backend) + Angular v20.3.15, Tauri 2.x, quick-xml (Rust), Transloco 8.x (i18n), Tailwind CSS 4.1.18, DaisyUI 5.5.14, Tauri plugin-store (006-carry-items-full-parsing)
- File-based XML (game data) + Tauri plugin-store (settings persistence) (006-carry-items-full-parsing)
- TypeScript 5.8.3 (frontend), Rust edition 2021 (backend) + Angular v20.3.15, Tauri 2.x, Transloco 8.x, DaisyUI 5.5.14, Tailwind CSS 4.1.18 (007-settings-persistence-detail-ux)
- Tauri plugin-store (cross-platform key-value persistence) (007-settings-persistence-detail-ux)
- TypeScript 5.8.3 (strict), Angular v20.3.15, Rust edition 2021 (007-settings-persistence-detail-ux)
- Tauri plugin-store (file-based key-value storage, `settings.json`) (007-settings-persistence-detail-ux)
- TypeScript 5.8.3 (frontend), Rust edition 2021 (backend) + Angular v20.3.15, Tauri 2.x, DaisyUI v5.5.14, Tailwind CSS v4.1.18, Transloco 8.x (007-settings-persistence-detail-ux)
- Tauri plugin-store (file-based key-value storage in `settings.json`) (007-settings-persistence-detail-ux)
- TypeScript 5.8.3 (Angular 20.3.15), Rust edition 2021 (Tauri 2.x) + Angular Signals, Tauri plugin-store (007-settings-persistence-detail-ux)
- Tauri plugin-store (settings.json) (007-settings-persistence-detail-ux)
- YAML (GitHub Actions), Rust edition 2021, Node.js LTS + auri-apps/tauri-action@v1, actions/checkout@v4, actions/setup-node@v4, dtolnay/rust-toolchain@stable (001-tauri-ci-release)
- GitHub Releases (artifact distribution) (001-tauri-ci-release)
- Rust edition 2021 (backend), TypeScript 5.8.3 (frontend) + quick-xml 0.37, walkdir 2.5, serde 1, rayon 1.10 (NEW), Angular v20.3.15, Tauri 2.x (001-fix-data-scanning)
- Tauri plugin-store (settings.json), localStorage (UI preferences) (001-fix-data-scanning)
- TypeScript 5.8.3 (Angular 20.3.15 frontend), Rust edition 2021 (Tauri 2.x backend) + Angular v20.3.15, Tauri 2.x, quick-xml 0.37 (Rust XML parsing), Transloco 8.x (i18n), DaisyUI 5.5.14, Tailwind CSS 4.1.18 (001-fix-data-scanning)
- File-based XML game data + Tauri plugin-store (settings.json) (001-fix-data-scanning)
- TypeScript 5.8.3 + Angular v20.3.15 (frontend), Rust edition 2021 + Tauri 2.x (backend) + Lucide Angular v0.562.0, Transloco v8.x, Tailwind CSS v4.1.18, DaisyUI v5.5.14, Angular CDK v20.2.14 (for virtual scrolling fallback) (001-ui-layout-optimization)
- Tauri plugin-store (settings.json for preferences) (001-ui-layout-optimization)
- TypeScript 5.8.3 (strict mode) + Angular v20.3.15 (frontend), Rust edition 2021 + Tauri 2.x (backend) (001-ui-layout-optimization)
- Tauri plugin-store (file-based key-value persistence in `settings.json` for user preferences) (001-ui-layout-optimization)
- TypeScript 5.8.3 (strict mode), Angular v20.3.15 + Tailwind CSS v4.1.18, DaisyUI v5.5.14, Lucide Angular v0.562.0, Transloco v8.x (001-ui-layout-optimization)
- Tauri plugin-store (settings.json for user preferences) (001-ui-layout-optimization)
- TypeScript 5.8.3 (Angular 20.3.15 frontend), Rust edition 2021 (Tauri 2.x backend) + Angular v20.3.15, Angular CDK v20.2.14 (virtual scrolling), Tailwind CSS v4.1.18, DaisyUI v5.5.14, Lucide Angular v0.562.0 (012-table-drawer-ux-fixes)
- TypeScript 5.8.3 (Angular 20.3.15 frontend), Rust edition 2021 (Tauri 2.x backend) + Angular v20.3.15, Tauri 2.x, Transloco 8.x (i18n), DaisyUI v5.5.14, Tailwind CSS v4.1.18, Lucide Angular v0.562.0 (013-pagination-prev-next)
- N/A (client-side state in Signals) (013-pagination-prev-next)

- TypeScript 5.8.3 (frontend), Rust (backend via Tauri 2.x) + Angular 20.3.15, Tauri 2.x, quick-xml (Rust), Transloco 8.x, Tailwind CSS 4.x, DaisyUI 5.x (001-weapons-directory-scanner)

## Project Structure

```text
src/
tests/
```

## Commands

cargo test [ONLY COMMANDS FOR ACTIVE TECHNOLOGIES][ONLY COMMANDS FOR ACTIVE TECHNOLOGIES] cargo clippy

## Code Style

TypeScript 5.8.3 (frontend), Rust (backend via Tauri 2.x): Follow standard conventions

## Recent Changes
- 013-pagination-prev-next: Added TypeScript 5.8.3 (Angular 20.3.15 frontend), Rust edition 2021 (Tauri 2.x backend) + Angular v20.3.15, Tauri 2.x, Transloco 8.x (i18n), DaisyUI v5.5.14, Tailwind CSS v4.1.18, Lucide Angular v0.562.0
- 012-table-drawer-ux-fixes: Added TypeScript 5.8.3 (Angular 20.3.15 frontend), Rust edition 2021 (Tauri 2.x backend) + Angular v20.3.15, Angular CDK v20.2.14 (virtual scrolling), Tailwind CSS v4.1.18, DaisyUI v5.5.14, Lucide Angular v0.562.0
- 001-ui-layout-optimization: Added TypeScript 5.8.3 (strict mode), Angular v20.3.15 + Tailwind CSS v4.1.18, DaisyUI v5.5.14, Lucide Angular v0.562.0, Transloco v8.x


<!-- MANUAL ADDITIONS START -->
## Icon Usage

All icons MUST use lucide-angular components. Manual SVG tags (`<svg>`, `<path>`, etc.) are PROHIBITED.

All Lucide icons MUST be registered in `src/app/shared/icons/index.ts` before use:

1. Import icon from `lucide-angular`
2. Add icon to the `APP_ICONS` export object
3. Use icon in templates via registered name

This follows lucide-angular's official best practices for tree-shaking and on-demand imports, and ensures consistent styling, automatic theme adaptation, and maintainability.

## CSS/Styling Guidelines

**Tailwind-First Approach**: Prefer Tailwind CSS utility classes over custom CSS classes.

For repeated styling patterns:
1. Use Tailwind utility classes directly in templates (e.g., `class="flex items-center gap-2 p-4"`)
2. Use DaisyUI component classes (e.g., `class="btn btn-primary"`)
3. Use Angular `@HostBinding` for dynamic style bindings
4. Custom CSS classes ONLY for complex animations, pseudo-elements, or styles not expressible with Tailwind

**Prohibited**:
- Custom CSS classes that replicate Tailwind utilities
- Classes with many standard CSS properties (margin, padding, flexbox, grid)
- `styles: []` arrays in component decorators for standard styling

<!-- MANUAL ADDITIONS END -->
