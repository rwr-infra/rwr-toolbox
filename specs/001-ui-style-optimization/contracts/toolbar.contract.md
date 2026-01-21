# UI Contract: Standard Toolbar

This contract defines the expected HTML structure for the unified query toolbar used across data feature pages.

## Layout Schema (Conceptual)

```html
<div class="control-area flex flex-wrap items-end gap-4 bg-base-200 p-4 rounded-box mb-4">
  <!-- Search & Filters -->
  <div class="flex flex-1 gap-2 min-w-[300px]">
    <!-- Search -->
    <!-- Filter -->
  </div>

  <!-- Tools (Page Size, Columns) -->
  <div class="flex items-end gap-2">
    <!-- Tools -->
  </div>

  <!-- Actions (Refresh) -->
  <div class="flex items-end gap-2">
    <!-- Buttons -->
  </div>
</div>
```

## Constraints
- **Responsiveness**: Must not overflow at 800px width.
- **Alignment**: Vertical alignment should be `items-end` to align labels and inputs correctly.
- **Theming**: Must use `bg-base-200` or `bg-base-300` to distinguish from the white/dark table background.
