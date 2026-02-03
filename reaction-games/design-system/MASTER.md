# Reaction Games Hub - Design System (MASTER)

**Style**: Neubrutalism (American Comic Book Aesthetic)  
**Generated**: 2026-02-03

---

## Color Palette

### Primary Colors

```css
:root {
  /* Main Colors */
  --primary: #4F46E5;        /* Indigo - Primary elements */
  --secondary: #818CF8;      /* Light Indigo - Secondary elements */
  --accent: #F97316;         /* Orange - CTA & actions */
  --background: #EEF2FF;     /* Light Blue - Page background */
  --text: #1E1B4B;           /* Dark Blue - Body text */
  
  /* Neubrutalism Core */
  --border-color: #000000;   /* Black borders (always 3px) */
  --shadow-color: #000000;   /* Black shadows (hard, no blur) */
  
  /* Semantic Colors */
  --success: #22C55E;        /* Green */
  --error: #EF4444;          /* Red */
  --warning: #F59E0B;        /* Amber */
  --info: #3B82F6;           /* Blue */
  
  /* Surface Colors */
  --surface: #FFFFFF;        /* Card backgrounds */
  --surface-alt: #F8FAFC;    /* Alternative surface */
}
```

### Color Usage Rules

- **Primary**: Main UI elements (headers, key buttons)
- **Secondary**: Supporting elements, badges
- **Accent/CTA**: Call-to-action buttons, links, active states
- **Background**: Page background only
- **Text**: All body text (ensure 4.5:1 contrast)

---

## Typography

### Font Families

```css
@import url('https://fonts.googleapis.com/css2?family=Fredoka:wght@400;500;600;700&family=Nunito:wght@300;400;500;600;700&display=swap');

:root {
  --font-display: 'Fredoka', sans-serif;  /* Headings, display text */
  --font-body: 'Nunito', sans-serif;      /* Body, paragraphs */
}
```

### Type Scale

```css
:root {
  /* Font Sizes */
  --text-xs: 0.75rem;    /* 12px */
  --text-sm: 0.875rem;   /* 14px */
  --text-base: 1rem;     /* 16px */
  --text-lg: 1.125rem;   /* 18px */
  --text-xl: 1.25rem;    /* 20px */
  --text-2xl: 1.5rem;    /* 24px */
  --text-3xl: 1.875rem;  /* 30px */
  --text-4xl: 2.25rem;   /* 36px */
  --text-5xl: 3rem;      /* 48px */
  
  /* Font Weights */
  --font-light: 300;
  --font-normal: 400;
  --font-medium: 500;
  --font-semibold: 600;
  --font-bold: 700;
}
```

### Typography Rules

- **Headings**: Fredoka, font-weight: 700
- **Body**: Nunito, font-weight: 400
- **Buttons**: Fredoka, font-weight: 700
- **Line height**: 1.5 for body, 1.2 for headings

---

## Neubrutalism Visual Effects

### Borders

**All elements use hard black borders:**

```css
.neubrutalism-border {
  border: 3px solid var(--border-color);
}
```

### Shadows

**Hard offset shadows (no blur):**

```css
.shadow-sm {
  box-shadow: 2px 2px 0 var(--shadow-color);
}

.shadow-md {
  box-shadow: 4px 4px 0 var(--shadow-color);
}

.shadow-lg {
  box-shadow: 8px 8px 0 var(--shadow-color);
}
```

### Transitions

**Smooth but quick (150-300ms):**

```css
.transition-standard {
  transition: all 200ms ease;
}

.transition-fast {
  transition: all 150ms ease;
}
```

### Hover Effects

**Button press effect:**

```css
.btn:hover {
  transform: translate(2px, 2px);
  box-shadow: 2px 2px 0 #000;
}

.btn:active {
  transform: translate(4px, 4px);
  box-shadow: 0 0 0 #000;
}
```

---

## Spacing System

```css
:root {
  --space-1: 0.25rem;   /* 4px */
  --space-2: 0.5rem;    /* 8px */
  --space-3: 0.75rem;   /* 12px */
  --space-4: 1rem;      /* 16px */
  --space-5: 1.25rem;   /* 20px */
  --space-6: 1.5rem;    /* 24px */
  --space-8: 2rem;      /* 32px */
  --space-10: 2.5rem;   /* 40px */
  --space-12: 3rem;     /* 48px */
  --space-16: 4rem;     /* 64px */
}
```

---

## Component Styles

### Buttons

```css
.btn-primary {
  background: var(--accent);
  color: white;
  border: 3px solid var(--border-color);
  box-shadow: 4px 4px 0 var(--shadow-color);
  padding: var(--space-4) var(--space-8);
  font-family: var(--font-display);
  font-weight: var(--font-bold);
  font-size: var(--text-lg);
  cursor: pointer;
  transition: transform 150ms ease, box-shadow 150ms ease;
}

.btn-primary:hover {
  transform: translate(2px, 2px);
  box-shadow: 2px 2px 0 var(--shadow-color);
}

.btn-primary:active {
  transform: translate(4px, 4px);
  box-shadow: 0 0 0 var(--shadow-color);
}

.btn-secondary {
  background: var(--secondary);
  /* Same structure as primary */
}
```

### Cards

```css
.card {
  background: var(--surface);
  border: 3px solid var(--border-color);
  box-shadow: 8px 8px 0 var(--shadow-color);
  padding: var(--space-8);
  border-radius: 0; /* No rounded corners in Neubrutalism */
}

.card-hover {
  cursor: pointer;
  transition: transform 200ms ease, box-shadow 200ms ease;
}

.card-hover:hover {
  transform: translate(4px, 4px);
  box-shadow: 4px 4px 0 var(--shadow-color);
}
```

### Inputs

```css
.input {
  background: var(--surface);
  border: 3px solid var(--border-color);
  padding: var(--space-4);
  font-family: var(--font-body);
  font-size: var(--text-base);
  color: var(--text);
}

.input:focus {
  outline: none;
  border-color: var(--primary);
  box-shadow: 0 0 0 3px var(--primary);
}
```

---

## Responsive Breakpoints

```css
:root {
  --breakpoint-sm: 375px;   /* Mobile */
  --breakpoint-md: 768px;   /* Tablet */
  --breakpoint-lg: 1024px;  /* Desktop */
  --breakpoint-xl: 1440px;  /* Large */
}
```

### Mobile-First Approach

```css
/* Mobile (default) */
.container {
  padding: var(--space-4);
}

/* Tablet and up */
@media (min-width: 768px) {
  .container {
    padding: var(--space-8);
  }
}

/* Desktop and up */
@media (min-width: 1024px) {
  .container {
    max-width: 1200px;
    margin: 0 auto;
  }
}
```

---

## Accessibility

### Text Contrast

- **Body text**: 4.5:1 minimum (WCAG AA)
- **Large text (18px+)**: 3:1 minimum
- All current colors meet WCAG AAA

### Interactive States

```css
/* All clickable elements */
.clickable {
  cursor: pointer;
}

/* Keyboard focus */
*:focus-visible {
  outline: 3px solid var(--primary);
  outline-offset: 2px;
}

/* Reduced motion */
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## Anti-Patterns (Avoid)

❌ **Never use:**
- Gradients
- Soft shadows (blur)
- Rounded corners (use sharp edges)
- Emojis as icons (use SVG)
- Minimalist/flat design without borders
- Low contrast colors

✅ **Always use:**
- 3px solid black borders
- Hard shadows (no blur)
- Sharp corners
- Bold typography
- High contrast colors
- SVG icons (Heroicons, Lucide)

---

## Implementation Checklist

Before delivering any page/component:

- [ ] All borders are 3px solid black
- [ ] Shadows are hard (4px 4px 0 or 8px 8px 0)
- [ ] No gradients used anywhere
- [ ] Typography uses Fredoka (headings) / Nunito (body)
- [ ] Font weights are bold for headings (700)
- [ ] All interactive elements have `cursor: pointer`
- [ ] Hover states have smooth transitions (150-300ms)
- [ ] Text contrast ≥ 4.5:1 (check with DevTools)
- [ ] Keyboard navigation works (Tab, Enter)
- [ ] Focus states are visible (3px outline)
- [ ] `prefers-reduced-motion` is respected
- [ ] Responsive at 375px, 768px, 1024px, 1440px
- [ ] No horizontal scroll on mobile

---

## References

- **Style Origin**: Neubrutalism (UI UX Pro Max)
- **Color Source**: Educational App palette
- **Typography**: Fredoka + Nunito (playful, friendly)
- **Accessibility**: WCAG AAA compliant
