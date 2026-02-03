# Agent 協作指南 (Agent Collaboration Guide)

本專案採用多重角色 Agent 協作模式。在與 AI 互動時，可依據需求指定 AI 扮演的角色。

## 1. 可用的 Agent 角色 (Available Roles)

| 角色 (Role) | 專長 (Expertise) | 何時使用 (When to Use) |
|------------|------------------|----------------------|
| **Planner** | 架構規劃、任務拆解 | 開發新遊戲前、大型重構時 |
| **Designer** | Neubrutalism 設計、CSS | 調整 UI、動畫、視覺效果 |
| **Developer** | JavaScript 邏輯、DOM 操作 | 實作遊戲機制、修復 Bug |
| **Reviewer** | 程式碼品質、規則檢查 | 完成功能後、提交前 |

## 2. 協作流程 (Workflow)

建議依照以下順序進行開發：

1. **規劃階段 (Planning)**
   - 呼叫 **Planner** 建立 `implementation_plan.md`。
   - 確認需求 (例如：計分方式、連擊倍率)。

2. **設計階段 (Design)**
   - 呼叫 **Designer** 確保 UI 符合 `design-system/MASTER.md`。
   - 先行定義 HTML 結構與 CSS Class。

3. **開發階段 (Development)**
   - 呼叫 **Developer** 撰寫 `game.js` 邏輯。
   - 遵循 `coding-style.md` 的不變性與模組化原則。

4. **審查階段 (Review)**
   - 呼叫 **Reviewer** 檢查是否符合規範。
   - 驗證是否沒有寫死的顏色、Magic Numbers。

## 3. 提示詞範例 (Prompt Examples)

- **Planner**: "請幫我規劃『打地鼠』遊戲的實作計畫，包含檔案結構與遊戲迴圈。"
- **Designer**: "請幫我不使用了 CSS 變數，將 Header 改為 comic 爆炸風格。"
- **Reviewer**: "請檢查 `arrow-rush/game.js` 是否符合我們的不變性原則。"
