# Master Design System & Principles

## 1. Aesthetic Direction
**Style:** Modern Neubrutalism (American Comic Inspired)
**Key Characteristics:**
- **High Contrast:** Bold borders (3px-5px black).
- **Vivid Colors:**
  - **Primary:** Vivid Orange (`#F97316`)
  - **Secondary:** Warm Orange/Amber (`#FB923C`)
  - **Accent:** Sharp Violet (`#8B5CF6`)
  - **Background:** Soft Warm White (`#FFF7ED`) (Orange-50)
  - **Success:** Vivid Green (`#22C55E`)
  - **Error:** Vivid Red (`#EF4444`)
- **Typography:**
  - **Headings:** `Fredoka` (Rounded, playful, bold)
  - **Body:** `Nunito` (Clean, readable)
- **Shadows:** Hard directional shadows (4px-8px offset, black).

## 2. UX Patterns
**Game Flow:**
1. **Entry:** Auto-open "Rules Modal" upon loading the game.
2. **Gameplay:** Clean interface, focus on the mechanic. Visual feedback for all actions.
3. **Results:** Immediate results screen with rating and detailed stats.
4. **Retry:** easy restart flow.

**Navigation:**
- **Back Button:** Always top-left (`← 返回首頁`).
- **Rules Button:** Always top-right (`❓ 規則`).

## 3. Component Standards
### Buttons
- **Primary:** Orange background, white text, hard shadow. Hover: Translate 2px.
- **Secondary:** Lighter orange/secondary color.
- **Rules/Nav:** Surface color (White) with border and shadow.

### Modals
- **Behavior:**
  - Auto-open on page load.
  - Backdrop blur (`backdrop-filter: blur(4px)`).
  - Close via "X", "Close Button", or clicking outside.
- **Content:**
  - Title with icon.
  - Ordered list `<ol>` for steps.
  - Clear "Got it" action button.

## 4. Technical Rules
- **CSS Variables:** All colors and spacing must use `:root` variables defined in `css/style.css`.
- **Responsive:** Mobile-first or desktop-down, ensuring playable on 350px width.
- **Animation:** Use CSS transitions for UI states. `requestAnimationFrame` for game loops.
- **Assets:** No external images mostly; use Font/CSS shapes or localized assets.

## 5. File Structure
- `index.html`: Hub page.
- `css/style.css`: Global styles.
- `games/[game-name]/`: self-contained game folder.
  - `index.html`: Game page.
  - `game.js`: Game logic class.
  - `style.css`: Game-specific overrides.
