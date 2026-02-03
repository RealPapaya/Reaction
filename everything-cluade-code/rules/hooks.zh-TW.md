# Hooks 系統

## Hook 類型

- **PreToolUse**: 工具執行前 (驗證、參數修改)
- **PostToolUse**: 工具執行後 (自動格式化、檢查)
- **Stop**: 階段結束時 (最終驗證)

## 目前的 Hooks (在 ~/.claude/settings.json)

### PreToolUse
- **tmux reminder**: 對長執行時間指令 (npm, pnpm, yarn, cargo 等) 建議使用 tmux
- **git push review**: 推送前開啟 Zed 進行審查
- **doc blocker**: 阻止建立不必要的 .md/.txt 檔案

### PostToolUse
- **PR creation**: 記錄 PR URL 和 GitHub Actions 狀態
- **Prettier**: 編輯後自動格式化 JS/TS 檔案
- **TypeScript check**: 編輯 .ts/.tsx 檔案後執行 tsc
- **console.log warning**: 警告已編輯檔案中的 console.log

### Stop
- **console.log audit**: 在階段結束前檢查所有修改過的檔案是否有 console.log

## 自動接受權限 (Auto-Accept Permissions)

謹慎使用：
- 對受信任、定義明確的計畫啟用
- 對探索性工作禁用
- 絕不使用 dangerously-skip-permissions 旗標
- 改在 `~/.claude.json` 中設定 `allowedTools`

## TodoWrite 最佳實踐

使用 TodoWrite tool 來：
- 追蹤多步驟任務的進度
- 驗證對指令的理解
- 啟用即時引導
- 顯示細粒度的實作步驟

Todo 清單揭示：
- 順序錯誤的步驟
- 遺漏的項目
- 額外不必要的項目
- 錯誤的粒度
- 誤解的需求
