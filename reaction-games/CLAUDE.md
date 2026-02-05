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

## Project Structure & File Metadata

### English Version: Detailed File Tree

```text
reaction-games/
├── index.html              # Entry point: Main landing page for game selection
├── hub.html                # Game hub screen for navigating between mini-games
├── .gitignore              # Git exclusion rules
├── CLAUDE.md               # Project guide, architecture, and file documentation
├── css/
│   └── style.css           # Global typography, layout, and theme styles
├── js/
│   └── hub.js              # Logic for handling hub navigation and animations
├── games/
│   ├── reaction-test/      # Classic Red Light, Green Light game
│   │   ├── index.html      # Reaction test UI
│   │   ├── game.js         # Core reaction logic and timing
│   │   └── style.css       # Game-specific styling (Neubrutalism)
│   └── horse-racing/       # Modular Horse Racing Simulator
│       ├── index.html      # Main horse racing game UI
│       ├── game.js         # Main controller: Modal management & screen switching
│       ├── style.css       # Core game layout and primary Neubrutalism styles
│       ├── race-scheduler.js # Real-time state machine for betting/racing cycles
│       ├── betting-machine.js # Logic for issuing tickets and calculating dynamic odds
│       ├── redemption-machine.js # Validates race results and handles balance payouts
│       ├── shop-manager.js # Manages purchasing and persistence of Racing Forms
│       ├── racetracks.js   # Static data for different track surfaces/lengths
│       ├── data-generator.js # Utilities for generating realistic horse/jockey names
│       ├── ticket-styles.css # Specialized CSS for the betting ticket rendering
│       ├── machine-styles.css # UI styles for betting and redemption machines
│       ├── track-selection-styles.css # Layout for the venue selection screen
│       └── race-engine/    # Core Physics & Simulation Engine
│           ├── README.md   # Documentation for the physical simulation logic
│           ├── RaceEngineAdapter.js # Renderer: Transforms physics to Canvas visuals
│           ├── RaceSimulator.js # Physics world manager and high-frequency updater
│           ├── ai/
│           │   └── JockeyAI.js  # Intelligent behavior: Lane choosing & stamina
│           └── core/
│               ├── FrenetCoordinates.js # Math: Track-relative (s, d) system
│               ├── PhysicsEngine.js # Base movement: Velocity & acceleration
│               └── SteeringBehaviors.js # Natural movement: Avoidance & seeking
```

---

### 中文版本：詳細資料夾與檔案說明

```text
reaction-games/ (專案根目錄)
├── index.html              # 入口網頁：遊戲選擇的主登陸頁面
├── hub.html                # 遊戲大廳頁面：切換不同小遊戲的中繼站
├── .gitignore              # Git 排除規則
├── CLAUDE.md               # 專案指引、架構說明與檔案用途文檔
├── css/
│   └── style.css           # 全域樣式：字體、基本佈局與佈景主題
├── js/
│   └── hub.js              # 大廳邏輯：處理導航與過渡動畫
├── games/ (遊戲套件目錄)
│   ├── reaction-test/      # 經典紅綠燈反應測試遊戲
│   │   ├── index.html      # 反應測試介面
│   │   ├── game.js         # 核心邏輯：計時與判定
│   │   └── style.css       # 遊戲專屬樣式 (新布魯托風格)
│   └── horse-racing/       # 模組化賽馬模擬遊戲
│       ├── index.html      # 賽馬遊戲主介面
│       ├── game.js         # 主控制器：負責 UI 彈窗管理與畫面切換
│       ├── style.css       # 核心遊戲佈局與基礎新布魯托風格樣式
│       ├── race-scheduler.js # 排程引擎：管理投注/比賽週期的狀態機
│       ├── betting-machine.js # 投注裝置：開出注單與計算動態賠率
│       ├── redemption-machine.js # 兌獎裝置：比對賽果並發放獎金
│       ├── shop-manager.js # 商店管理：負責馬報等道具的購買與持久化
│       ├── racetracks.js   # 賽道數據：定義不同場地的地面材質與長度
│       ├── data-generator.js # 資料生成：產生真實感的馬匹與騎師名稱
│       ├── ticket-styles.css # 注單專用樣式表
│       ├── machine-styles.css # 投注機與兌獎機的 UI 樣式
│       ├── track-selection-styles.css # 場地選擇畫面的佈局樣式
│       └── race-engine/    # 核心物理與模擬引擎 (獨立組件)
│           ├── README.md   # 物理模擬邏輯的技術開發文檔
│           ├── RaceEngineAdapter.js # 渲染適配器：將物理數據繪製到 Canvas
│           ├── RaceSimulator.js # 物理世界模擬器：負責高頻更新與距離追蹤
│           ├── ai/
│           │   └── JockeyAI.js  # 智能行為：跑道選擇、體力分配策略
│           └── core/
│               ├── FrenetCoordinates.js # 數學核心：Frenet (s, d) 賽道座標系統
│               ├── PhysicsEngine.js # 基礎物理：處理速度與加速度公式
│               └── SteeringBehaviors.js # 舵向行為：實現自然避障與追蹤
```

## Development & Testing Guidelines

### Adding a New Game
1. Create folder: `games/<game-name>/`
2. Create files: `index.html`, `game.js`, `style.css`
3. Follow Neubrutalism design system
4. Update homepage to link new game

### Git Workflow
- Conventional commits: `feat:`, `fix:`, `style:`, `docs:`
- Test before committing

### Testing Checklist
- [ ] Visual style matches Neubrutalism (3px borders, hard shadows)
- [ ] Responsive at all breakpoints (375px to 1440px)
- [ ] Game logic and localStorage persistence work correctly
- [ ] Accessibility: Keyboard navigation & Contrast ratio ≥ 4.5:1
