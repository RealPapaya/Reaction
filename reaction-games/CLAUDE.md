# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with this project.

## Project Overview

**Reaction Games Hub** - A collection of mini-games with American comic book aesthetic (Neubrutalism style).

**Tech Stack:**
- HTML5
- Vanilla JavaScript
- CSS3
- No frameworks/libraries (pure vanilla)

**First Game:** Red Light, Green Light reaction time tester

## Critical Rules

### 1. Code Organization

- Small focused files (200-400 lines typical, 800 max)
- Organize by feature/game
- High cohesion, low coupling
- One game = one folder with index.html, game.js, style.css

### 2. Code Style

- **No emojis** in code, comments, or documentation
- Use `const` and `let`, never `var`
- Modern ES6+ JavaScript
- Immutability preferred
- Proper error handling with try/catch
- Clear variable naming

### 3. Design System

**Visual Style:** Neubrutalism (American Comic Book)

Key characteristics:
- **Bold black borders**: `border: 3px solid #000`
- **Hard shadows**: `box-shadow: 4px 4px 0 #000`
- **Flat colors**: No gradients
- **High contrast**: WCAG AAA compliant
- **Bold typography**: Heavy font weights

**Color Palette:**
```css
--primary: #4F46E5;      /* Indigo */
--secondary: #818CF8;    /* Light Indigo */
--accent: #F97316;       /* Orange CTA */
--background: #EEF2FF;   /* Light Blue */
--text: #1E1B4B;         /* Dark Blue */
--border: #000000;       /* Black borders */
--shadow: #000000;       /* Black shadows */
```

**Typography:**
```css
--font-display: 'Fredoka', sans-serif;  /* Headings */
--font-body: 'Nunito', sans-serif;      /* Body text */
```

### 4. Accessibility

- All interactive elements have `cursor-pointer`
- Hover states with smooth transitions (150-300ms)
- Text contrast ≥ 4.5:1
- Keyboard navigation support
- Focus states visible
- Respect `prefers-reduced-motion`

### 5. Fixed-Size RWD (固定大小響應式設計)

**Critical Rule**: All game pages use fixed-size design to prevent scaling issues.

- Use fixed pixel units (px) for all dimensions
- Lock viewport: `html, body { height: 100vh; overflow: hidden; }`
- Do NOT use relative units (vw, vh, %) for scaling
- Ensure content fits viewport without scrollbars
- Objects maintain fixed size regardless of window resize
- Small screens may require layout adjustments, but object sizes remain constant

**Implementation Pattern**:
```css
/* In each game's style.css */
html, body {
    height: 100vh;
    overflow: hidden;
    margin: 0;
    padding: 0;
}

.container {
    height: 100%;
    display: flex;
    flex-direction: column;
}
```

### 6. Responsive Design

Test at breakpoints:
- Mobile: 375px
- Tablet: 768px
- Desktop: 1024px
- Large: 1440px

## File Structure

```
reaction-games/
├── CLAUDE.md
├── .gitignore
├── .claude/
│   ├── package-manager.json
│   └── skills/
│       └── ui-ux-pro-max/
├── design-system/
│   └── MASTER.md
├── index.html              # Homepage - game selection
├── css/
│   └── style.css           # Global styles
└── games/
    └── reaction-test/
        ├── index.html
        ├── game.js
        └── style.css
```

## Design System Integration

This project uses UI UX Pro Max skill for design intelligence.

To search for design recommendations:
```bash
python .claude/skills/ui-ux-pro-max/scripts/search.py "query" --domain <domain>
```

Design system is persisted in `design-system/MASTER.md`.

## Game Development Guidelines

### Adding a New Game

1. Create folder: `games/<game-name>/`
2. Create files: `index.html`, `game.js`, `style.css`
3. Follow Neubrutalism design system
4. Update homepage to link new game
5. Test across all breakpoints

### Game State Management

Use localStorage for:
- High scores
- Game history
- User preferences

```javascript
// Save
localStorage.setItem('reactionTimes', JSON.stringify(times));

// Load
const times = JSON.parse(localStorage.getItem('reactionTimes') || '[]');
```

### Performance

- Keep JavaScript vanilla (no frameworks)
- Minimize reflows/repaints
- Use CSS transforms for animations
- Optimize event listeners

## Common Patterns

### Button Style

```html
<button class="btn-primary">Click Me</button>
```

```css
.btn-primary {
  background: var(--accent);
  color: white;
  border: 3px solid #000;
  box-shadow: 4px 4px 0 #000;
  padding: 1rem 2rem;
  font-family: var(--font-display);
  font-weight: 700;
  cursor: pointer;
  transition: transform 150ms ease;
}

.btn-primary:hover {
  transform: translate(2px, 2px);
  box-shadow: 2px 2px 0 #000;
}

.btn-primary:active {
  transform: translate(4px, 4px);
  box-shadow: 0 0 0 #000;
}
```

### Card Component

```html
<div class="card">
  <h2>Title</h2>
  <p>Content</p>
</div>
```

```css
.card {
  background: white;
  border: 3px solid #000;
  box-shadow: 8px 8px 0 #000;
  padding: 2rem;
}
```

## Git Workflow

- Conventional commits: `feat:`, `fix:`, `style:`, `docs:`
- Never commit to main directly (if using git)
- Test before committing

## Testing

Manual testing checklist:
- [ ] Visual style matches Neubrutalism
- [ ] All borders are 3px solid black
- [ ] Shadows are hard (no blur)
- [ ] No gradients used
- [ ] Typography is bold and clear
- [ ] Responsive at all breakpoints
- [ ] Interactive elements have cursor-pointer
- [ ] Hover states work smoothly
- [ ] Game logic works correctly
- [ ] localStorage persists data
- [ ] Accessibility: keyboard navigation works
- [ ] Accessibility: contrast ratio ≥ 4.5:1
