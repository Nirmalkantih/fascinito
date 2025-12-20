# Fascinito Design System

## 1. Overview

Fascinito is a custom-designed e-commerce and POS system built with a modern, cohesive design language. The UI is fully custom-built using Material-UI (MUI) as a component foundation with extensive customization, not template-based.

**Design Status:** Production Ready
**Last Updated:** December 2025
**Version:** 1.0

---

## 2. Design Philosophy

Our design follows these core principles:

- **Modern & Clean**: Minimalist approach with modern gradients and smooth transitions
- **Accessible**: WCAG 2.1 AA compliant color contrasts and interactive elements
- **Performant**: Optimized animations and lazy-loaded images
- **Consistent**: Unified design language across all user roles (Customer, Admin, Staff)
- **Intuitive**: Clear information hierarchy and user flows

---

## 3. Color Palette

### Primary Colors
- **Primary**: `#6366f1` (Indigo)
  - Light: `#818cf8`
  - Dark: `#4f46e5`
  - Contrast Text: `#ffffff`
- **Secondary**: `#ec4899` (Pink)
  - Light: `#f472b6`
  - Dark: `#db2777`
  - Contrast Text: `#ffffff`

### Semantic Colors
- **Success**: `#10b981` (Green)
  - Light: `#34d399`
  - Dark: `#059669`
- **Warning**: `#f59e0b` (Amber)
  - Light: `#fbbf24`
  - Dark: `#d97706`
- **Error**: `#ef4444` (Red)
  - Light: `#f87171`
  - Dark: `#dc2626`

### Neutral Colors
- **Background Default**: `#f8fafc`
- **Background Paper**: `#ffffff`
- **Text Primary**: `#1e293b`
- **Text Secondary**: `#64748b`

### Usage Guidelines
- **Primary** - Main actions, CTAs, brand elements
- **Secondary** - Accent highlights, favorites, secondary actions
- **Success** - Confirmations, approved states, positive actions
- **Warning** - Cautions, reviews needed, alerts
- **Error** - Errors, cancellations, negative actions

---

## 4. Typography

### Font Family
- **Primary**: Inter (modern, clean, highly legible)
- **Fallback Stack**: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif

### Heading Styles

| Level | Font | Size | Weight | Line Height | Letter Spacing |
|-------|------|------|--------|-------------|----------------|
| H1 | Euphoria Script | 3rem (48px) | 400 | 1.2 | -0.02em |
| H2 | Euphoria Script | 2.25rem (36px) | 400 | 1.3 | -0.01em |
| H3 | Euphoria Script | 1.875rem (30px) | 400 | 1.4 | — |
| H4 | Inter | 1.5rem (24px) | 600 | 1.4 | — |
| H5 | Inter | 1.25rem (20px) | 600 | 1.5 | — |
| H6 | Inter | 1rem (16px) | 600 | 1.5 | — |

### Body Text
- **Body1**: 1rem (16px), weight 400, line-height 1.5
- **Body2**: 0.875rem (14px), weight 400, line-height 1.5
- **Caption**: 0.75rem (12px), weight 400, line-height 1.4
- **Overline**: 0.75rem (12px), weight 600, line-height 1.6, uppercase

### Button Text
- **Default**: 0.875rem (14px), weight 600, text-transform: none

---

## 5. Spacing & Layout

### Spacing Scale (8px base)
```
0 → 0px
1 → 8px
2 → 16px
3 → 24px
4 → 32px
5 → 40px
6 → 48px
```

### Layout System
- **Container Max Width**: 1280px (lg)
- **Grid**: 12-column responsive grid
- **Breakpoints**:
  - xs: 0px (mobile)
  - sm: 600px (tablet)
  - md: 960px (desktop)
  - lg: 1280px (wide desktop)
  - xl: 1920px (ultra-wide)

### Default Padding/Margin
- **Page Container**: `padding: 32px` (4 units)
- **Section Spacing**: `margin-bottom: 48px` (6 units)
- **Component Spacing**: `padding: 16px` (2 units)
- **Small Component Padding**: `padding: 8px` (1 unit)

---

## 6. Border Radius

- **Button**: `10px`
- **Card/Paper**: `16px`
- **TextField**: `10px`
- **Small Components**: `8px`
- **Default (shape.borderRadius)**: `12px`

---

## 7. Shadow System (Elevation)

| Level | Box Shadow | Use Case |
|-------|-----------|----------|
| 1 | `0 1px 2px 0 rgb(0 0 0 / 0.05)` | Subtle elevation, dividers |
| 2 | `0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)` | Standard card shadow |
| 3 | `0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)` | Floating elements |
| 4 | `0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)` | Modals, dropdowns |
| 5+ | `0 20px 25px -5px rgb(0 0 0 / 0.1)` | Emphasized floating elements |
| 20 | `0 20px 25px -5px rgb(0 0 0 / 0.1)` | Card hover state |

---

## 8. Component Styles

### Buttons

#### Contained Button (Primary)
- **Background**: Linear gradient `#667eea 0%, #764ba2 100%`
- **Color**: White
- **Padding**: `10px 24px`
- **Font Size**: `0.875rem`
- **Font Weight**: `600`
- **Border Radius**: `10px`
- **Hover State**: Darker gradient + shadow elevation
- **Transform**: `translateY(-1px)` on hover

#### Outlined Button
- **Border**: `2px solid` (primary color)
- **Color**: Primary
- **Padding**: `10px 24px`
- **Hover**: Border width maintained at `2px`

#### Text Button
- **No background**
- **Color**: Primary
- **Padding**: `10px 24px`

### Cards
- **Border Radius**: `16px`
- **Box Shadow**: Level 2 (default), Level 20 (hover)
- **Transition**: `all 0.3s ease-in-out`
- **Hover Transform**: `translateY(-4px)`

### Text Fields
- **Border Radius**: `10px`
- **Hover Border Color**: Primary `#6366f1`
- **Focused Border Color**: Primary
- **Background**: White (default)

### Paper/Surface
- **Border Radius**: `16px`
- **Elevation Shadow**: Level 1 (default)

### AppBar
- **Background**: Linear gradient `#667eea 0%, #764ba2 100%`
- **Box Shadow**: Level 2
- **Height**: 64px

---

## 9. Interactive States

### Hover States
- **Subtle Scale**: `scale(1.02)` or `scale(1.05)` for prominent elements
- **Shadow Elevation**: Increase shadow depth
- **Color Shift**: Slightly darker/lighter shade of base color
- **Transition Duration**: `0.2s - 0.3s ease-in-out`

### Active States
- **Opacity**: `0.8` or darker shade
- **Transition Duration**: `0.1s`

### Disabled States
- **Opacity**: `0.5`
- **Cursor**: `not-allowed`
- **Color**: `text.disabled` or grayed out

### Focus States
- **Outline**: 2px solid primary color with 2px offset
- **Transition**: `0.2s ease`

---

## 10. Animations & Transitions

### Standard Animations
- **Button Hover**: `all 0.2s ease-in-out`
- **Card Hover**: `all 0.3s ease-in-out`
- **Page Transitions**: `all 0.3s ease-in-out`
- **Modal Enter**: `fade in 0.3s ease-out`
- **Modal Exit**: `fade out 0.2s ease-out`

### Keyframe Animations
```css
/* Fade in on load */
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}
animation: fadeIn 0.3s ease-in-out;

/* Slide up on load */
@keyframes slideUp {
  from { transform: translateY(20px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}
animation: slideUp 0.3s ease-out;
```

---

## 11. Product Card Component

### Desktop (lg breakpoint)
- **Width**: 25% (1 of 4 columns)
- **Aspect Ratio**: 1:1.25 (image), rest flexible
- **Image Height**: 200px
- **Card Min Height**: 380px

### Tablet (md breakpoint)
- **Width**: 33.33% (1 of 3 columns)

### Mobile (sm breakpoint)
- **Width**: 50% (1 of 2 columns)

### XS Mobile
- **Width**: 100% (full width)

### Product Card Structure
```
┌─────────────────┐
│   [❤️ Favorite] │ ← Absolute positioned top-right
│                 │
│  [Product Image]│ ← 200px height, overflow hidden
│   with scale    │   scale: 1.05 on hover
│                 │
├─────────────────┤
│  Product Title  │ ← H6 style, truncated
│  [Category Chip]│ ← Small chip with accent bg
│                 │
│  Short Desc...  │ ← Body2, 2-line clamp
│                 │
│  Price Display  │ ← H6 style, with strike-through
│                 │
├─────────────────┤
│ [Add to Cart]   │ ← Full-width contained button
└─────────────────┘
```

### Product Card Hover State
- **Card**: Translate Y -8px, shadow elevation 20
- **Image**: Scale 1.05
- **Transition**: `all 0.3s ease-in-out`

---

## 12. Forms

### Input Fields
- **Label**: Body2, weight 600, `margin-bottom: 8px`
- **Input Height**: 40px (small), 48px (normal)
- **Border Radius**: `10px`
- **Border**: 1px solid `rgba(primary, 0.2)`
- **Padding**: `12px 16px`
- **Font Size**: `0.875rem`
- **Placeholder Color**: `text.secondary`

### Validation States
- **Error**: Border color `error.main`, error text `error.main`, font-size 12px
- **Success**: Border color `success.main`, checkmark icon
- **Warning**: Border color `warning.main`, warning text

### Form Spacing
- **Between Fields**: `margin-bottom: 24px`
- **Label to Input**: `margin-bottom: 8px`
- **Helper Text to Input**: `margin-top: 4px`
- **Submit Button Top**: `margin-top: 32px`

---

## 13. Tables

### Table Header
- **Background**: `rgba(primary.main, 0.05)`
- **Font Weight**: `600`
- **Border Bottom**: 2px solid `rgba(primary.main, 0.1)`
- **Padding**: `16px`
- **Text Transform**: Capitalize

### Table Rows
- **Padding**: `16px`
- **Border Bottom**: 1px solid `rgba(primary.main, 0.08)`
- **Hover Background**: `rgba(primary.main, 0.02)`
- **Transition**: `background 0.2s ease`

### Table Data Cells
- **Font Size**: `0.875rem`
- **Line Height**: 1.5
- **Text Align**: Left (default), Right (for numbers)

---

## 14. Pagination Component

### Layout
- **Container**: Paper with gradient background and backdrop blur
- **Left Section**: Rows per page selector
- **Center Section**: Current page info (e.g., "1-10 of 100")
- **Right Section**: Navigation buttons

### Styling
- **Background**: Linear gradient with primary color at 5% opacity
- **Border**: 1px solid primary at 10% opacity
- **Backdrop Filter**: `blur(8px)` for glass-morphism
- **Border Radius**: `16px`
- **Padding**: `20px`

### Button States
- **Disabled**: Color `action.disabled`, background transparent
- **Enabled**: Color `primary.main`, background `rgba(primary, 0.08)`
- **Hover**: Background `rgba(primary, 0.15)`

---

## 15. Dialogs & Modals

### Dialog Container
- **Border Radius**: `16px`
- **Max Width**: 90vw or specified width
- **Max Height**: 90vh with scroll
- **Backdrop**: `rgba(0, 0, 0, 0.5)`

### Dialog Header
- **Padding**: `24px`
- **Border Bottom**: 1px solid `rgba(primary, 0.1)`
- **Title**: H5 style, `margin: 0`

### Dialog Content
- **Padding**: `24px`
- **Max Height**: `calc(90vh - 140px)` with overflow-y
- **Font Size**: `0.875rem`

### Dialog Actions
- **Padding**: `16px 24px`
- **Border Top**: 1px solid `rgba(primary, 0.1)`
- **Display**: Flex, justify-content: flex-end
- **Button Spacing**: `gap: 12px`

---

## 16. Notification/Toast

### Toast Notification
- **Position**: Bottom-right (default)
- **Z-Index**: 9999
- **Border Radius**: `12px`
- **Padding**: `16px 24px`
- **Min Width**: 300px
- **Max Width**: 500px
- **Font Size**: `0.875rem`
- **Transition**: Slide in from right `0.3s ease-out`

### Toast Types
| Type | Background | Icon | Text Color |
|------|-----------|------|-----------|
| Success | `success.main` | ✓ | White |
| Error | `error.main` | ✗ | White |
| Warning | `warning.main` | ⚠ | Dark |
| Info | `primary.main` | ℹ | White |

---

## 17. Responsive Design

### Breakpoint Strategy
- **Mobile-First**: Design for smallest screen first
- **Progressive Enhancement**: Add features for larger screens

### Key Breakpoints
```typescript
xs: 0px      // Mobile phones
sm: 600px    // Tablets (portrait)
md: 960px    // Tablets (landscape) / Small desktops
lg: 1280px   // Desktops
xl: 1920px   // Wide desktops
```

### Grid Behavior
- **xs**: 1 column, full-width
- **sm**: 2 columns for grids
- **md**: 3 columns for grids
- **lg**: 4 columns for products, 3 for regular items
- **xl**: 4-6 columns depending on content

### Typography Scaling
- Headings: Scale down on mobile
- Body text: Maintain 14px minimum on mobile
- Input fields: 48px height on mobile (thumb-friendly)

---

## 18. Accessibility Guidelines

### WCAG 2.1 AA Compliance
- **Color Contrast**: Minimum 4.5:1 for body text, 3:1 for large text
- **Focus Indicators**: Always visible, 2px outline minimum
- **Touch Targets**: Minimum 44x44px on mobile
- **Keyboard Navigation**: All interactive elements keyboard-accessible
- **Screen Reader**: Proper ARIA labels and semantic HTML

### Implementation
- Use semantic HTML (`<button>`, `<nav>`, `<main>`, etc.)
- Always label form inputs with `<label>` or `aria-label`
- Use `aria-live` for dynamic content updates
- Provide alt text for all images
- Test with keyboard navigation
- Test with screen readers (NVDA, VoiceOver)

---

## 19. Design Approval Process

### For UI Changes
1. **Design Spec**: Create Figma/wireframe mockup
2. **Component Review**: Document component changes
3. **Accessibility Check**: Verify WCAG compliance
4. **Responsive Test**: Check all breakpoints
5. **Approval**: Get sign-off from design lead
6. **Implementation**: Develop with specifications
7. **QA**: Verify pixel-perfect match
8. **Merge**: Approved pull request

### Approval Sign-off
- Designer: _______________
- Product Lead: _______________
- QA: _______________
- Date: _______________

---

## 20. Implementation Guidelines

### React/MUI Best Practices
1. **Use MUI Theme**: Always use `useTheme()` hook for colors
2. **Component Composition**: Build modular, reusable components
3. **CSS-in-JS**: Use `sx` prop for styling
4. **Responsive**: Use breakpoints from theme
5. **Accessibility**: Include ARIA labels and semantic HTML

### Example Component Structure
```tsx
import { Box, Button, Typography, useTheme, alpha } from '@mui/material'

export default function ExampleComponent() {
  const theme = useTheme()

  return (
    <Box sx={{
      p: 3,
      borderRadius: 2,
      bgcolor: alpha(theme.palette.primary.main, 0.02),
      transition: 'all 0.3s ease-in-out',
      '&:hover': {
        bgcolor: alpha(theme.palette.primary.main, 0.05),
        transform: 'translateY(-2px)',
        boxShadow: theme.shadows[4]
      }
    }}>
      <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
        Title
      </Typography>
      <Button variant="contained">Action</Button>
    </Box>
  )
}
```

---

## 21. Future Enhancements

- [ ] Dark mode support with theme switching
- [ ] Animation library integration (Framer Motion)
- [ ] Advanced iconography system
- [ ] Custom SVG icon library
- [ ] Enhanced micro-interactions
- [ ] Gesture support for mobile (swipe, pinch)
- [ ] Haptic feedback for mobile interactions

---

## 22. Resources

- **Theme Configuration**: [theme.ts](frontend/src/theme.ts)
- **Component Library**: Material-UI (https://mui.com)
- **Design Tool**: Figma (not yet implemented)
- **Design Specifications**: This document

---

**Document Version**: 1.0
**Last Updated**: December 2025
**Maintained By**: Design Team
