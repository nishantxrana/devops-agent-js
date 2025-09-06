# Design System

## Overview
This design system defines the visual language, patterns, and components for the DevOps Agent application. It follows modern design principles with a focus on accessibility, consistency, and scalability.

## Design Tokens

### Color System
Our color system uses HSL values for consistent light/dark mode support and follows WCAG AA contrast requirements.

#### Brand Colors
- **Primary**: Azure Blue (`--primary`) - Main brand color for CTAs, links, and key UI elements
- **Secondary**: Neutral Gray (`--secondary`) - Supporting elements and backgrounds  
- **Accent**: Light Gray (`--accent`) - Highlights and interactive states

#### Semantic Colors
- **Destructive**: Red (`--destructive`) - Errors, warnings, and destructive actions
- **Success**: Green (custom) - Success states and positive feedback
- **Warning**: Orange (custom) - Warnings and caution states
- **Info**: Blue (custom) - Informational content and neutral feedback

#### Neutral Colors
- **Background**: (`--background`) - Main background color
- **Foreground**: (`--foreground`) - Primary text color
- **Muted**: (`--muted`) - Secondary text and subtle backgrounds
- **Border**: (`--border`) - Dividers and outline elements
- **Input**: (`--input`) - Form input backgrounds

#### Light Mode Values
```css
:root {
  --background: 0 0% 100%;          /* Pure white */
  --foreground: 0 0% 3.9%;          /* Near black */
  --primary: 214 95% 52%;           /* Azure blue */
  --primary-foreground: 0 0% 98%;   /* White text on primary */
  --secondary: 0 0% 96.1%;          /* Light gray */
  --muted: 0 0% 45.1%;              /* Medium gray */
  --border: 0 0% 89.8%;             /* Light border */
  --destructive: 0 84.2% 60.2%;     /* Red */
}
```

#### Dark Mode Values
```css
.dark {
  --background: 0 0% 3.9%;          /* Near black */
  --foreground: 0 0% 98%;           /* Near white */
  --primary: 214 95% 52%;           /* Same azure blue */
  --primary-foreground: 0 0% 9%;    /* Dark text on primary */
  --secondary: 0 0% 14.9%;          /* Dark gray */
  --muted: 0 0% 63.9%;              /* Light gray for dark mode */
  --border: 0 0% 14.9%;             /* Dark border */
}
```

### Typography Scale
Based on a modular scale with web-safe font stack and Inter as primary.

#### Font Family
```css
font-family: Inter, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
```

#### Type Scale
- **xs**: 0.75rem (12px) - Small labels, captions
- **sm**: 0.875rem (14px) - Body text, form inputs
- **base**: 1rem (16px) - Default body text
- **lg**: 1.125rem (18px) - Large body text, small headings
- **xl**: 1.25rem (20px) - H4 headings
- **2xl**: 1.5rem (24px) - H3 headings
- **3xl**: 1.875rem (30px) - H2 headings
- **4xl**: 2.25rem (36px) - H1 headings
- **5xl**: 3rem (48px) - Display headings

#### Font Weights
- **normal**: 400 - Regular body text
- **medium**: 500 - Emphasis, labels
- **semibold**: 600 - Subheadings, important text
- **bold**: 700 - Headings, strong emphasis

### Spacing Scale (8pt Grid)
All spacing follows an 8-point grid system for consistent rhythm.

```css
0: 0px
0.5: 2px   (0.125rem)
1: 4px     (0.25rem)
1.5: 6px   (0.375rem)
2: 8px     (0.5rem)
2.5: 10px  (0.625rem)
3: 12px    (0.75rem)
3.5: 14px  (0.875rem)
4: 16px    (1rem)
5: 20px    (1.25rem)
6: 24px    (1.5rem)
8: 32px    (2rem)
10: 40px   (2.5rem)
12: 48px   (3rem)
16: 64px   (4rem)
20: 80px   (5rem)
24: 96px   (6rem)
```

### Border Radius
Consistent rounded corners using CSS custom properties.

```css
--radius: 0.5rem (8px) - Default radius
sm: calc(var(--radius) - 4px) - Small radius (4px)
md: calc(var(--radius) - 2px) - Medium radius (6px)
lg: var(--radius) - Large radius (8px)
xl: calc(var(--radius) + 4px) - Extra large radius (12px)
```

### Elevation & Shadows
Subtle shadows for depth and hierarchy.

```css
/* Card shadows */
shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05)
shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)
shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)
shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)
```

### Motion & Animation
Consistent timing and easing for micro-interactions.

#### Duration
- **Fast**: 100-150ms - Micro-interactions (hover, focus)
- **Standard**: 200-250ms - Standard transitions
- **Slow**: 300-400ms - Complex animations, page transitions

#### Easing
- **Ease-out**: Most UI transitions (elements entering)
- **Ease-in**: Elements exiting
- **Ease-in-out**: Bidirectional animations

```css
transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1); /* ease-out */
```

## Component Patterns

### Buttons
- Primary: Main CTAs, important actions
- Secondary: Secondary actions, cancel buttons
- Destructive: Delete, remove, dangerous actions
- Ghost: Subtle actions, toolbar buttons
- Outline: Alternative secondary style

### Form Controls
- Consistent height and padding
- Clear focus states with ring
- Proper labeling and helper text
- Error states with descriptive messages

### Cards
- Clean container for grouped content
- Consistent padding and spacing
- Subtle borders and shadows
- Hover states for interactive cards

### Navigation
- Clear hierarchy and active states
- Consistent spacing and alignment
- Accessible focus management
- Responsive behavior

## Accessibility Guidelines

### Color Contrast
- All text meets WCAG AA standards (4.5:1 for normal text, 3:1 for large text)
- Interactive elements have sufficient contrast in all states
- Color is never the only way to convey information

### Keyboard Navigation
- All interactive elements are keyboard accessible
- Visible focus indicators on all focusable elements
- Logical tab order throughout the interface
- Skip links for main content areas

### Screen Readers
- Proper semantic HTML structure
- ARIA labels and descriptions where needed
- Hidden content properly excluded from screen readers
- Form inputs properly associated with labels

### Motion & Animation
- Respects `prefers-reduced-motion` setting
- Animations can be disabled globally
- No auto-playing content that could trigger seizures
- Animation serves a functional purpose

## Implementation Notes
- Use shadcn/ui components as base building blocks
- Apply design tokens through CSS custom properties
- Follow component composition patterns
- Maintain design system consistency across all pages