# Design System

## Color System

### HSL Color Palettes

#### Light Theme
```css
/* Primary - Azure Blue */
--color-primary-50: 240 100% 98%;   /* hsl(240, 100%, 98%) */
--color-primary-100: 240 100% 96%;  /* hsl(240, 100%, 96%) */
--color-primary-200: 240 96% 89%;   /* hsl(240, 96%, 89%) */
--color-primary-300: 240 86% 82%;   /* hsl(240, 86%, 82%) */
--color-primary-400: 240 75% 70%;   /* hsl(240, 75%, 70%) */
--color-primary-500: 240 57% 62%;   /* hsl(240, 57%, 62%) */
--color-primary-600: 240 51% 53%;   /* hsl(240, 51%, 53%) */
--color-primary-700: 240 57% 44%;   /* hsl(240, 57%, 44%) */
--color-primary-800: 240 56% 36%;   /* hsl(240, 56%, 36%) */
--color-primary-900: 240 54% 29%;   /* hsl(240, 54%, 29%) */

/* Neutral - Cool Grays */
--color-neutral-50: 210 20% 98%;    /* hsl(210, 20%, 98%) */
--color-neutral-100: 210 20% 95%;   /* hsl(210, 20%, 95%) */
--color-neutral-200: 210 16% 88%;   /* hsl(210, 16%, 88%) */
--color-neutral-300: 210 14% 76%;   /* hsl(210, 14%, 76%) */
--color-neutral-400: 210 14% 53%;   /* hsl(210, 14%, 53%) */
--color-neutral-500: 210 11% 43%;   /* hsl(210, 11%, 43%) */
--color-neutral-600: 210 12% 35%;   /* hsl(210, 12%, 35%) */
--color-neutral-700: 210 15% 25%;   /* hsl(210, 15%, 25%) */
--color-neutral-800: 210 16% 16%;   /* hsl(210, 16%, 16%) */
--color-neutral-900: 210 20% 9%;    /* hsl(210, 20%, 9%) */

/* Success */
--color-success-50: 142 76% 96%;    /* hsl(142, 76%, 96%) */
--color-success-500: 142 71% 45%;   /* hsl(142, 71%, 45%) */
--color-success-600: 142 76% 36%;   /* hsl(142, 76%, 36%) */

/* Warning */
--color-warning-50: 48 100% 96%;    /* hsl(48, 100%, 96%) */
--color-warning-500: 48 96% 53%;    /* hsl(48, 96%, 53%) */
--color-warning-600: 48 100% 42%;   /* hsl(48, 100%, 42%) */

/* Error */
--color-error-50: 0 86% 97%;        /* hsl(0, 86%, 97%) */
--color-error-500: 0 72% 51%;       /* hsl(0, 72%, 51%) */
--color-error-600: 0 79% 44%;       /* hsl(0, 79%, 44%) */

/* Info */
--color-info-50: 214 100% 97%;      /* hsl(214, 100%, 97%) */
--color-info-500: 214 84% 56%;      /* hsl(214, 84%, 56%) */
--color-info-600: 214 91% 45%;      /* hsl(214, 91%, 45%) */
```

#### Dark Theme
```css
/* Primary - Azure Blue (adjusted for dark) */
--color-primary-50: 240 54% 7%;     /* hsl(240, 54%, 7%) */
--color-primary-100: 240 56% 10%;   /* hsl(240, 56%, 10%) */
--color-primary-200: 240 57% 16%;   /* hsl(240, 57%, 16%) */
--color-primary-300: 240 51% 24%;   /* hsl(240, 51%, 24%) */
--color-primary-400: 240 57% 35%;   /* hsl(240, 57%, 35%) */
--color-primary-500: 240 75% 55%;   /* hsl(240, 75%, 55%) */
--color-primary-600: 240 86% 70%;   /* hsl(240, 86%, 70%) */
--color-primary-700: 240 96% 82%;   /* hsl(240, 96%, 82%) */
--color-primary-800: 240 100% 91%;  /* hsl(240, 100%, 91%) */
--color-primary-900: 240 100% 96%;  /* hsl(240, 100%, 96%) */

/* Neutral - Dark mode optimized */
--color-neutral-50: 210 20% 2%;     /* hsl(210, 20%, 2%) */
--color-neutral-100: 210 20% 4%;    /* hsl(210, 20%, 4%) */
--color-neutral-200: 210 16% 8%;    /* hsl(210, 16%, 8%) */
--color-neutral-300: 210 14% 12%;   /* hsl(210, 14%, 12%) */
--color-neutral-400: 210 14% 20%;   /* hsl(210, 14%, 20%) */
--color-neutral-500: 210 11% 32%;   /* hsl(210, 11%, 32%) */
--color-neutral-600: 210 12% 45%;   /* hsl(210, 12%, 45%) */
--color-neutral-700: 210 15% 65%;   /* hsl(210, 15%, 65%) */
--color-neutral-800: 210 16% 82%;   /* hsl(210, 16%, 82%) */
--color-neutral-900: 210 20% 95%;   /* hsl(210, 20%, 95%) */
```

## Typography Scale

Web-safe font stack: `'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', sans-serif`

### Scale (1.125 - Major Second)
- **Display**: 48px / 3rem (line-height: 1.1)  
- **Headline 1**: 36px / 2.25rem (line-height: 1.15)
- **Headline 2**: 32px / 2rem (line-height: 1.2) 
- **Headline 3**: 24px / 1.5rem (line-height: 1.25)
- **Headline 4**: 20px / 1.25rem (line-height: 1.3)
- **Body Large**: 18px / 1.125rem (line-height: 1.5)
- **Body**: 16px / 1rem (line-height: 1.5) 
- **Body Small**: 14px / 0.875rem (line-height: 1.5)
- **Caption**: 12px / 0.75rem (line-height: 1.4)
- **Label**: 11px / 0.6875rem (line-height: 1.4)

### Font Weights
- **Light**: 300
- **Regular**: 400  
- **Medium**: 500
- **Semibold**: 600
- **Bold**: 700

## Spacing System (8pt Grid)

```css
--spacing-0: 0;
--spacing-1: 2px;    /* 0.125rem */
--spacing-2: 4px;    /* 0.25rem */
--spacing-3: 8px;    /* 0.5rem */
--spacing-4: 12px;   /* 0.75rem */
--spacing-5: 16px;   /* 1rem */
--spacing-6: 20px;   /* 1.25rem */
--spacing-7: 24px;   /* 1.5rem */
--spacing-8: 32px;   /* 2rem */
--spacing-9: 40px;   /* 2.5rem */
--spacing-10: 48px;  /* 3rem */
--spacing-11: 56px;  /* 3.5rem */
--spacing-12: 64px;  /* 4rem */
--spacing-16: 128px; /* 8rem */
--spacing-20: 160px; /* 10rem */
```

## Border Radius

```css
--radius-none: 0;
--radius-xs: 2px;     /* 0.125rem */
--radius-sm: 4px;     /* 0.25rem */
--radius-md: 6px;     /* 0.375rem */
--radius-lg: 8px;     /* 0.5rem */
--radius-xl: 12px;    /* 0.75rem */
--radius-2xl: 16px;   /* 1rem */
--radius-full: 9999px;
```

## Shadows & Elevation

```css
/* Subtle elevation system */
--shadow-sm: 0 1px 2px 0 hsl(210 15% 25% / 0.05);
--shadow-md: 0 4px 6px -1px hsl(210 15% 25% / 0.1), 0 2px 4px -2px hsl(210 15% 25% / 0.1);
--shadow-lg: 0 10px 15px -3px hsl(210 15% 25% / 0.1), 0 4px 6px -4px hsl(210 15% 25% / 0.1);
--shadow-xl: 0 20px 25px -5px hsl(210 15% 25% / 0.1), 0 8px 10px -6px hsl(210 15% 25% / 0.1);
--shadow-2xl: 0 25px 50px -12px hsl(210 15% 25% / 0.25);

/* Focus rings */
--shadow-focus: 0 0 0 3px hsl(var(--color-primary-500) / 0.15);
--shadow-focus-error: 0 0 0 3px hsl(var(--color-error-500) / 0.15);
```

## Motion & Animation

```css
/* Timing functions */
--ease-linear: linear;
--ease-out: cubic-bezier(0, 0, 0.2, 1);
--ease-in: cubic-bezier(0.4, 0, 1, 1);
--ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);

/* Duration */
--duration-75: 75ms;
--duration-100: 100ms;
--duration-150: 150ms;
--duration-200: 200ms;
--duration-250: 250ms;
--duration-300: 300ms;
--duration-500: 500ms;
```

### Reduced Motion Support
```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

## Component Patterns

### Interactive States
- **Hover**: Subtle color shift or elevation change
- **Active**: Slightly more pronounced than hover
- **Focus**: Visible focus ring with high contrast
- **Disabled**: 50% opacity with cursor not-allowed

### Layout Containers  
- **Page**: max-width with centered content
- **Card**: Elevated surface with rounded corners
- **Section**: Logical content grouping with spacing

## Accessibility Guidelines

- **Color Contrast**: WCAG AA compliance (4.5:1 normal text, 3:1 large text)
- **Focus Management**: Visible focus indicators, logical tab order
- **ARIA**: Proper roles, labels, and descriptions
- **Keyboard Navigation**: Full keyboard accessibility
- **Screen Readers**: Semantic HTML and ARIA support

## Usage Rules

1. **Color**: Use semantic color tokens, avoid hardcoded values
2. **Spacing**: Follow 8pt grid system for consistency  
3. **Typography**: Use defined scale and font weights
4. **Motion**: Keep animations under 250ms, respect reduced motion
5. **Elevation**: Use shadow system for visual hierarchy
6. **Accessibility**: Test with keyboard and screen readers