# Data Model: UI Layout Structure

## Control Area (Toolbar) Entity

The "Control Area" is a visual and structural container for all data manipulation controls.

### Structure
- **Container**: `div.bg-base-200.p-4.rounded-box.mb-4`
- **Search Group**:
  - Search Input (with Lucide Search icon)
  - Tag/Type Filter (Select)
- **Settings Group**:
  - Page Size Selector
  - Column Toggle
  - Scrolling Mode Toggle
- **Action Group**:
  - Refresh Button
  - (Future: Export/Import)

### Spacing Rules
- **Inter-Group**: `gap-4`
- **Intra-Group (buttons)**: `gap-2`
- **Mobile wrapping**: `flex-wrap` is mandatory to support window resizing down to 800px.

## Settings Card Entity

Standardized card for application configuration.

### Structure
- **Container**: `div.card.bg-base-100.shadow-sm.border.border-base-300`
- **Body**: `div.card-body`
- **Header**: `h2.card-title.text-sm`
- **Content**: Form controls with `label` and `select/input`.
