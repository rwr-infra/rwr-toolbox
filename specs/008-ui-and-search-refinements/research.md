# Research: UI and Search Refinements

## Decision: Search Highlighting Implementation

- **Rationale**: The user wants consistency with the `Servers` component. The `Servers` component already has a working `highlight` method that uses regex to wrap matching text in a styled `<span>`.
- **Implementation Approach**:
    - Replicate the `highlight`, `escapeRegExp`, and `escapeHtml` methods in `WeaponsComponent` and `ItemsComponent`.
    - Update templates to use `[innerHTML]="highlight(value)"` for searchable fields.
    - Since `Weapons` and `Items` components are already refactored to use Signals, the search term signal will naturally trigger re-computation of highlighted content if it's derived from it.
- **Alternatives Considered**:
    - Using a pipe for highlighting: Rejected for now to maintain consistency with `Servers` implementation which uses a method.
    - Third-party highlight libraries: Rejected because the current regex-based approach is lightweight and already works in the project.

## Decision: Settings Layout Optimization

- **Rationale**: Redundant labels and "real-time" hints clutter the UI. Card headers already provide context.
- **Implementation Approach**:
    - In `settings.component.html`, remove the `flex` container rows for Language and Theme selection.
    - Place selection components (dropdown/toggle) directly in the card body.
    - Remove all label-text elements and instruction text related to "real-time" effects.

## Decision: Directory List Refinement

- **Rationale**: Radio buttons are unnecessary when the package information is always needed and the list is informative rather than elective.
- **Implementation Approach**:
    - Modify `DirectoryService` if needed to ensure package counts are always loaded (they are already part of `ScanDirectory` model).
    - Update `settings.component.html` to remove the radio input from directory items.
    - Ensure the "packages" info badge/text is always rendered regardless of any selection state.

## Decision: About Page Content

- **Rationale**: Project needs a formal entry point for repository access and description.
- **Implementation Approach**:
    - Update `about.component.html` with a concise description of RWR Toolbox.
    - Add a styled link to `https://github.com/Kreedzt/rwr-toolbox`.
    - Verify layout looks good on 800x600.
