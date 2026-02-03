# 程式碼風格與規範 (Coding Style & Standards)

## 1. 核心原則 (Core Principles)

### 不變性 (Immutability)
盡可能建立新物件，避免直接變異 (mutate) 狀態，特別是在計算分數或處理遊戲狀態時。

```javascript
// 錯誤 (WRONG)
function updateStats(stats, score) {
  stats.totalPlays++;
  stats.highScore = score;
  return stats;
}

// 正確 (CORRECT)
function updateStats(stats, score) {
  return {
    ...stats,
    totalPlays: stats.totalPlays + 1,
    highScore: Math.max(stats.highScore, score)
  };
}
```

### CSS 變數驅動 (CSS Variable Driven)
所有顏色、間距、字體必須使用 `css/style.css` 定義的變數。**嚴禁**在個別檔案中寫死 (Hardcode) 顏色碼。

```css
/* 錯誤 (WRONG) */
.box { background: #F97316; padding: 16px; }

/* 正確 (CORRECT) */
.box {
  background: var(--primary);
  padding: var(--space-4);
}
```

## 2. 檔案組織 (File Organization)

### 遊戲模組化 (Game Modularity)
每個遊戲應為獨立資料夾，包含自己的邏輯、樣式與入口：
- `games/[game-name]/index.html`: 遊戲結構
- `games/[game-name]/game.js`: 遊戲邏輯 (Class-based)
- `games/[game-name]/style.css`: 遊戲專屬樣式 (繼承全域)

### 函式與類別 (Functions & Classes)
- 每個遊戲應封裝在一個主要 Class 中 (例如 `ArrowRushGame`)。
- 函式應保持簡短 (<50 行)。
- 使用 `init()`, `update()`, `render()` 等標準命名。

## 3. 命名慣例 (Naming Conventions)

- **變數/函式**: camelCase (`currentScore`, `startGame`)
- **常數**: UPPER_SNAKE_CASE (`BLOCK_SIZE`, `MAX_LIVES`)
- **CSS Class**: kebab-case (`game-container`, `comic-burst`)
- **DOM ID**: kebab-case (`score-display`, `start-btn`)

## 4. 錯誤處理與驗證 (Error Handling & Validation)

雖然是前端遊戲，仍需注意：
- 驗證 `localStorage` 讀取的資料 (JSON.parse 可能失敗)。
- 檢查 DOM 元素是否存在再操作。

```javascript
// 安全讀取設定
loadStats() {
    try {
        const saved = localStorage.getItem('gameStats');
        return saved ? JSON.parse(saved) : this.defaultStats;
    } catch (e) {
        console.warn('Failed to load stats:', e);
        return this.defaultStats;
    }
}
```

## 5. 程式碼品質檢查清單 (Quality Checklist)

- [ ] 是否使用了 CSS 變數而非硬編碼顏色？
- [ ] 遊戲邏輯是否封裝在 Class 中？
- [ ] 是否有名稱清晰的常數 (Magic Numbers 應避免)？
- [ ] UI 是否響應式 (Mobile/Desktop 兼容)？
- [ ] 所有的 Event Listeners 是否有適當的清理 (雖由頁面生命週期管理，但在SPA中需注意)？
