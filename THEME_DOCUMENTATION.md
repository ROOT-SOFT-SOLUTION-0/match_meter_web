# SaaS UI Theme Documentation

## Overview
This is a professional SaaS UI theme with full light/dark mode support, built with Tailwind CSS and React. The theme is designed for sports management applications with a modern, clean aesthetic.

## Theme Architecture

### 1. Color Palette

#### Primary Colors (Green - Sports Brand)
- **50**: `#f0fdf4` - Lightest tint
- **500**: `#22c55e` - Main primary color
- **600**: `#16a34a` - Darker variant for hover/active states
- **700**: `#15803d` - Darkest variant

#### Secondary Colors (Slate - Professional)
- **50**: `#f8fafc` - Lightest background
- **100**: `#f1f5f9` - Light surface
- **600**: `#475569` - Dark text
- **900**: `#0f172a` - Darkest text

#### Status Colors
- **Success**: `#10b981` (Emerald)
- **Warning**: `#f59e0b` (Amber)
- **Error**: `#ef4444` (Red)
- **Info**: `#06b6d4` (Cyan)

### 2. Theme Provider

The theme is managed through **ThemeProvider** context which handles:
- Automatic theme detection (system preference or localStorage)
- Smooth transitions between themes
- CSS class management (`dark` class on `<html>` element)
- Persistent storage of user preference

**Usage:**
```tsx
// Inside main.tsx or your app wrapper
import { ThemeProvider } from './providers/ThemeProvider';

<ThemeProvider>
  <App />
</ThemeProvider>
```

**Hook Usage:**
```tsx
import { useTheme } from './providers/ThemeProvider';

function MyComponent() {
  const { isDark, toggleTheme, setTheme } = useTheme();

  return (
    <button onClick={toggleTheme}>
      {isDark ? 'Light Mode' : 'Dark Mode'}
    </button>
  );
}
```

### 3. Character Library

Pre-built component classes for consistent styling:

#### Buttons
```
.btn              // Base button styles
.btn-primary      // Green background, white text
.btn-secondary    // Gray background
.btn-ghost        // Transparent, hover effect
.btn-danger       // Red background for destructive actions
```

#### Cards & Containers
```
.card             // Padded container with border and shadow
.container-primary // Card-like container
```

#### Badges
```
.badge-primary    // Green badge
.badge-success    // Emerald badge
.badge-warning    // Amber badge
.badge-error      // Red badge
.badge-info       // Cyan badge
```

#### Forms
```
.form-group       // Margin wrapper for form fields
.form-label       // Styled form labels
.form-input       // Full-width form inputs
.form-textarea    // Textarea with form-input styles
```

#### Alerts
```
.alert-success    // Green alert box
.alert-warning    // Amber alert box
.alert-error      // Red alert box
.alert-info       // Cyan alert box
```

#### Typography
```
.heading-1 to .heading-4  // Responsive headings
.text-primary             // Green accent text
.text-secondary           // Secondary gray text
.text-tertiary            // Tertiary gray text
.text-muted               // Muted text
```

### 4. CSS Variables

All theme colors are available as CSS variables for dynamic styling:

**Light Mode Variables:**
```css
--bg-primary: #ffffff
--surface-primary: #ffffff
--text-primary: #0f172a
--color-primary: #22c55e
--border-color: #e2e8f0
--shadow-soft: 0 2px 8px rgba(0, 0, 0, 0.08)
```

**Dark Mode Variables:**
```css
--bg-primary: #0f172a
--surface-primary: #111a2e
--text-primary: #f1f5f9
--color-primary: #10b981
--border-color: #334155
--shadow-soft: 0 2px 8px rgba(0, 0, 0, 0.2)
```

### 5. Component Examples

#### Button
```tsx
<button className="btn-primary">
  Click Me
</button>
```

#### Card
```tsx
<div className="card">
  <h3 className="heading-4">Card Title</h3>
  <p className="text-secondary">Card content</p>
</div>
```

#### Form
```tsx
<div className="form-group">
  <label className="form-label">Email</label>
  <input type="email" className="form-input" />
</div>
```

#### Alert
```tsx
<div className="alert-success">
  <p>Success message goes here</p>
</div>
```

#### Table
```tsx
<table className="w-full">
  <thead className="table-header">
    <tr>
      <th className="table-cell">Column</th>
    </tr>
  </thead>
  <tbody>
    <tr className="table-row">
      <td className="table-cell">Data</td>
    </tr>
  </tbody>
</table>
```

### 6. Dark Mode Usage

Dark mode is automatically applied when:
1. User toggles the theme using `useTheme()` hook
2. User's system preference is dark
3. `dark` class exists on `<html>` element

**Manual dark mode in Tailwind:**
```tsx
<div className="bg-white dark:bg-slate-900">
  Content that changes with theme
</div>
```

### 7. Animations

Pre-built animations:
```
.animate-pulse      // Shimmer effect with color gradient
.animate-fade-in    // Fade in animation
.animate-slide-down // Slide and fade down
.animate-spin       // Rotation animation
```

### 8. Spacing System

Consistent spacing values:
- **xs**: 4px
- **sm**: 8px
- **md**: 12px
- **lg**: 16px
- **xl**: 24px
- **2xl**: 32px
- **3xl**: 48px

### 9. Shadow System

Predefined shadows for depth:
- **shadow-xs**: Subtle, 1px shadow
- **shadow-sm**: Light shadow
- **shadow-base**: Default shadow
- **shadow-md**: Medium shadow
- **shadow-lg**: Large shadow
- **shadow-soft**: Soft, diffused shadow

### 10. Customization

To customize the theme:

1. **Update Tailwind Config** (`tailwind.config.js`)
   - Modify color values
   - Add new colors or shadows
   - Adjust spacing

2. **Update CSS Variables** (`src/index.css`)
   - Edit `:root` and `.dark` selectors
   - Keep both light and dark modes in sync

3. **Update Component Classes** (`src/index.css`)
   - Modify `@layer components` for new component styles
   - Add new component utilities

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile browsers (iOS Safari 14+, Chrome Mobile 90+)

## Performance

- No JavaScript overhead for theme switching
- CSS variables provide instant theme updates
- Dark mode uses CSS classes (no JavaScript polling)
- Optimized animations with GPU acceleration

## Accessibility

- Focus states on all interactive elements
- Color contrast ratios meet WCAG AA standards
- Smooth transitions don't interfere with prefers-reduced-motion
- Keyboard navigation support built-in

## Files Modified

- `src/index.css` - Theme variables and component styles
- `tailwind.config.js` - Extended Tailwind configuration
- `src/main.tsx` - ThemeProvider wrapper
- `src/components/layout/Header.tsx` - Updated theme toggle

## Files Created

- `src/providers/ThemeProvider.tsx` - Context provider for theme management
- `src/components/ThemeToggle.tsx` - Standalone theme toggle component
