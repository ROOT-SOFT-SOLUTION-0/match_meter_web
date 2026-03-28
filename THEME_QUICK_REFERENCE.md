# SaaS Theme - Quick Reference Guide

## Widget Classes Quick Look

### Buttons
```html
<!-- Green button (CTA) -->
<button class="btn-primary">Save</button>

<!-- Gray button (Secondary action) -->
<button class="btn-secondary">Cancel</button>

<!-- Ghost button (Transparent) -->
<button class="btn-ghost">Learn More</button>

<!-- Danger button (Delete) -->
<button class="btn-danger">Delete</button>
```

### Cards & Containers
```html
<!-- Main card container -->
<div class="card">
  <h3 class="heading-4">Title</h3>
  <p>Content here</p>
</div>

<!-- Container with padding -->
<div class="container-primary">Content</div>
```

### Badges & Status
```html
<!-- Success badge (green) -->
<span class="badge-success">Active</span>

<!-- Warning badge (amber) -->
<span class="badge-warning">Pending</span>

<!-- Error badge (red) -->
<span class="badge-error">Failed</span>

<!-- Informational badge (cyan) -->
<span class="badge-info">Info</span>
```

### Forms
```html
<div class="form-group">
  <label class="form-label">Your Email</label>
  <input type="email" class="form-input" placeholder="email@example.com" />
</div>

<div class="form-group">
  <label class="form-label">Description</label>
  <textarea class="form-textarea" rows="4"></textarea>
</div>
```

### Alerts
```html
<!-- Success alert -->
<div class="alert-success">
  ✓ Operation completed successfully
</div>

<!-- Warning alert -->
<div class="alert-warning">
  ⚠ Please review before continuing
</div>

<!-- Error alert -->
<div class="alert-error">
  ✗ Something went wrong
</div>

<!-- Info alert -->
<div class="alert-info">
  ℹ Additional information
</div>
```

### Typography
```html
<h1 class="heading-1">Main Heading</h1>
<h2 class="heading-2">Section Heading</h2>
<h3 class="heading-3">Subsection</h3>
<h4 class="heading-4">Small Heading</h4>

<p class="text-primary">Primary text (green)</p>
<p class="text-secondary">Secondary text (gray)</p>
<p class="text-tertiary">Tertiary text (lighter gray)</p>
<p class="text-muted">Muted text</p>
```

### Tables
```html
<table class="w-full border-light">
  <thead class="table-header">
    <tr>
      <th class="table-cell">Column Name</th>
    </tr>
  </thead>
  <tbody>
    <tr class="table-row">
      <td class="table-cell">Data</td>
    </tr>
  </tbody>
</table>
```

### Dividers & Spacing
```html
<!-- Divider line -->
<div class="divider"></div>

<!-- Surface background -->
<div class="surface">Light background</div>

<!-- Border styling -->
<div class="border-light border p-4">Content</div>
```

## Dark Mode Override

### Automatic Dark Mode
```html
<!-- Automatically changes with theme -->
<div class="bg-white dark:bg-slate-900">
  I change with theme
</div>
```

### Text Colors in Dark Mode
```html
<p class="text-slate-900 dark:text-slate-50">Dark mode text</p>
```

### Borders in Dark Mode
```html
<div class="border-gray-200 dark:border-slate-700">
  Border adapts to theme
</div>
```

## Using Theme Hook

```tsx
import { useTheme } from './providers/ThemeProvider';

export function MyComponent() {
  const { isDark, toggleTheme, setTheme } = useTheme();

  return (
    <>
      <button onClick={toggleTheme}>
        Toggle Theme
      </button>

      <button onClick={() => setTheme('dark')}>
        Dark Mode
      </button>

      <button onClick={() => setTheme('light')}>
        Light Mode
      </button>

      {isDark && <p>Dark mode is active</p>}
    </>
  );
}
```

## CSS Variables (Direct Usage)

```css
.my-custom-class {
  background-color: var(--bg-primary);
  color: var(--text-primary);
  border: 1px solid var(--border-color);
  box-shadow: var(--shadow-soft);
}
```

## Color Instances

### Tailwind Colors
```
Green: green-50 to green-950
Slate: slate-50 to slate-950
Red: red-50 to red-950
Amber: amber-50 to amber-950
Cyan: cyan-50 to cyan-950
Emerald: emerald-50 to emerald-950
```

### Direct Usage
```html
<!-- Text colors -->
<p class="text-green-600 dark:text-green-500">Green text</p>
<p class="text-slate-600 dark:text-slate-400">Slate text</p>

<!-- Backgrounds -->
<div class="bg-green-50 dark:bg-green-950">Light green bg</div>
<div class="bg-slate-100 dark:bg-slate-800">Light slate bg</div>

<!-- Borders -->
<div class="border border-green-200 dark:border-green-900">Border</div>
```

## Common Patterns

### Loading Card
```html
<div class="card animate-pulse">
  <div class="skeleton h-4 w-32 mb-4"></div>
  <div class="skeleton h-3 w-48"></div>
</div>
```

### Modal Dialog
```html
<div class="modal-overlay">
  <div class="modal-content">
    <h2 class="heading-3">Modal Title</h2>
    <p>Modal content</p>
  </div>
</div>
```

### Navigation Link
```html
<a href="#" class="text-gray-600 hover:text-primary dark:text-gray-300 dark:hover:text-green-500 transition-theme">
  Link
</a>
```

### Badge Group
```html
<div class="flex gap-2">
  <span class="badge-primary">Badge 1</span>
  <span class="badge-success">Badge 2</span>
  <span class="badge-warning">Badge 3</span>
</div>
```

## Animation Classes

```html
<!-- Pulse/shimmer effect -->
<div class="animate-pulse">Loading...</div>

<!-- Fade in -->
<div class="animate-fade-in">Content</div>

<!-- Slide down -->
<div class="animate-slide-down">Dropdown</div>

<!-- Spin -->
<div class="animate-spin">⏳</div>
```

## Testing the Theme

1. **Toggle Theme**: Click the sun/moon icon in the header
2. **Check Persistence**: Refresh page - theme should remain
3. **Dark Mode**: All text should remain readable
4. **Light Mode**: Colors should be vibrant but not harsh
5. **Transitions**: Should be smooth (not instant)
