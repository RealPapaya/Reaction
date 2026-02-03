# Everything Claude Code 速查指南 (The Shorthand Guide)

![Header: Anthropic Hackathon Winner - Tips & Tricks for Claude Code](./assets/images/shortform/00-header.png)

---

**自二月實驗性推出以來，我一直是 Claude Code 的熱衷使用者，並與 [@DRodriguezFX](https://x.com/DRodriguezFX) 一起用 Claude Code 贏得了 Anthropic x Forum Ventures 黑客松專案 [zenith.chat](https://zenith.chat)。**

這是我經過 10 個月日常使用後的完整設定：skills、hooks、subagents、MCPs、plugins，以及真正有效的東西。

---

## Skills 與 Commands

Skills 運作起來像規則，但限制在特定的範圍和工作流程中。當你需要執行特定工作流程時，它們是提示詞 (prompts) 的速記。

在使用 Opus 4.5 進行長時間編碼後，想要清理死碼和散落的 .md 檔案嗎？執行 `/refactor-clean`。需要測試？`/tdd`、`/e2e`、`/test-coverage`。Skills 也可以包含 codemaps - 一種讓 Claude 快速導航你的程式碼庫而不浪費 context 進行探索的方法。

![Terminal showing chained commands](./assets/images/shortform/02-chaining-commands.jpeg)
*將指令串接在一起*

Commands 是透過斜線指令執行的 skills。它們有重疊但儲存在不同位置：

- **Skills**: `~/.claude/skills/` - 較廣泛的工作流程定義
- **Commands**: `~/.claude/commands/` - 快速可執行的提示詞

```bash
# skill 結構範例
~/.claude/skills/
  pmx-guidelines.md      # 專案特定的模式
  coding-standards.md    # 語言最佳實踐
  tdd-workflow/          # 包含 README.md 的多檔案 skill
  security-review/       # 基於檢查清單的 skill
```

---

## Hooks

Hooks 是基於觸發器的自動化，會在特定事件發生時觸發。不像 skills，它們被限制在工具呼叫 (tool calls) 和生命週期事件中。

**Hook 類型：**

1. **PreToolUse** - 工具執行前 (驗證、提醒)
2. **PostToolUse** - 工具完成後 (格式化、回饋迴圈)
3. **UserPromptSubmit** - 當你發送訊息時
4. **Stop** - 當 Claude 完成回應時
5. **PreCompact** - 情境壓縮前
6. **Notification** - 權限請求

**範例：長執行時間指令前的 tmux 提醒**

```json
{
  "PreToolUse": [
    {
      "matcher": "tool == \"Bash\" && tool_input.command matches \"(npm|pnpm|yarn|cargo|pytest)\"",
      "hooks": [
        {
          "type": "command",
          "command": "if [ -z \"$TMUX\" ]; then echo '[Hook] Consider tmux for session persistence' >&2; fi"
        }
      ]
    }
  ]
}
```

![PostToolUse hook feedback](./assets/images/shortform/03-posttooluse-hook.png)
*在 Claude Code 中執行 PostToolUse hook 時獲得回饋的範例*

**專業提示：** 使用 `hookify` plugin 以對話方式建立 hooks，而不是手寫 JSON。執行 `/hookify` 並描述你想要的內容。

---

## Subagents (子代理)

Subagents 是你的協調者 (主 Claude) 可以委派有限範圍任務的程序。它們可以在背景或前景執行，釋放主 agent 的 context。

Subagents 與 skills 搭配良好 - 一個能夠執行你部分 skills 的 subagent 可以被委派任務並自主使用這些 skills。它們也可以被限制在特定的工具權限沙箱中。

```bash
# subagent 結構範例
~/.claude/agents/
  planner.md           # 功能實作計畫
  architect.md         # 系統設計決策
  tdd-guide.md         # 測試驅動開發
  code-reviewer.md     # 品質/安全性審查
  security-reviewer.md # 漏洞分析
  build-error-resolver.md
  e2e-runner.md
  refactor-cleaner.md
```

為每個 subagent 設定允許的工具、MCPs 和權限以進行適當的範圍控制。

---

## Rules 與 Memory

你的 `.rules` 資料夾包含 Claude 應始終遵循的最佳實踐 `.md` 檔案。兩種方法：

1. **單一 CLAUDE.md** - 所有東西在一個檔案 (使用者或是專案層級)
2. **Rules 資料夾** - 依關注點分組的模組化 `.md` 檔案

```bash
~/.claude/rules/
  security.md      # 無寫死秘密，驗證輸入
  coding-style.md  # 不變性，檔案組織
  testing.md       # TDD 工作流，80% 覆蓋率
  git-workflow.md  # Commit 格式，PR 流程
  agents.md        # 何時委派給 subagents
  performance.md   # 模型選擇，情境管理
```

**Rules 範例：**

- 程式碼庫中不使用表情符號
- 前端避免使用紫色色調
- 部署前務必測試程式碼
- 優先考慮模組化程式碼而非巨型檔案
- 絕不提交 console.logs

---

## MCPs (Model Context Protocol)

MCPs 將 Claude 直接連接到外部服務。不是 API 的替代品 - 它是 API 的提示驅動封裝，允許在瀏覽資訊時有更大的彈性。

**範例：** Supabase MCP 讓 Claude 拉取特定資料，直接在上游執行 SQL 而不需複製貼上。資料庫、部署平台等也是如此。

![Supabase MCP listing tables](./assets/images/shortform/04-supabase-mcp.jpeg)
*Supabase MCP 列出公開 schema 中資料表的範例*

**Claude 中的 Chrome：** 是一個內建的 plugin MCP，讓 Claude 自主控制你的瀏覽器 - 點擊周圍以查看事物如何運作。

**關鍵：情境視窗管理 (Context Window Management)**

對 MCPs 要挑剔。我將所有 MCPs 保存在使用者設定中，但**禁用所有未使用的項目**。導航至 `/plugins` 並向下滾動或執行 `/mcp`。

![/plugins interface](./assets/images/shortform/05-plugins-interface.jpeg)
*使用 /plugins 導航至 MCPs 查看當前安裝項目及其狀態*

若啟用太多工具，你的 200k 情境視窗在壓縮前可能只剩 70k。效能會顯著下降。

**經驗法則：** 設定中有 20-30 個 MCPs，但保持啟用 10 個以下 / 活躍工具 80 個以下。

```bash
# 檢查已啟用的 MCPs
/mcp

# 在 ~/.claude.json 的 projects.disabledMcpServers 中禁用未使用的項目
```

---

## Plugins

Plugins 將工具打包以便於安裝，而非繁瑣的手動設定。一個 plugin 可以是 skill + MCP 的結合，或是 hooks/tools 捆綁在一起。

**安裝 plugins：**

```bash
# 新增市集
claude plugin marketplace add https://github.com/mixedbread-ai/mgrep

# 打開 Claude，執行 /plugins，找到新市集，從那裡安裝
```

![Marketplaces tab showing mgrep](./assets/images/shortform/06-marketplaces-mgrep.jpeg)
*顯示新安裝的 Mixedbread-Grep 市集*

**LSP Plugins** 如果你經常在編輯器外執行 Claude Code 特別有用。Language Server Protocol 給 Claude 即時的型別檢查、跳轉定義和智慧補全，而不需要打開 IDE。

```bash
# 啟用 plugins 的範例
typescript-lsp@claude-plugins-official  # TypeScript 智慧功能
pyright-lsp@claude-plugins-official     # Python 型別檢查
hookify@claude-plugins-official         # 對話式建立 hooks
mgrep@Mixedbread-Grep                   # 比 ripgrep 更好的搜尋
```

與 MCPs 相同的警告 - 注意你的情境視窗。

---

## 技巧與竅門 (Tips and Tricks)

### 鍵盤快捷鍵

- `Ctrl+U` - 刪除整行 (比狂按 backspace 快)
- `!` - 快速 bash 指令前綴
- `@` - 搜尋檔案
- `/` - 啟動斜線指令
- `Shift+Enter` - 多行輸入
- `Tab` - 切換思考顯示
- `Esc Esc` - 中斷 Claude / 還原程式碼

### 平行工作流程

- **Fork** (`/fork`) - 分岔對話以平行處理不重疊的任務，而不是發送排隊訊息
- **Git Worktrees** - 用於重疊的平行 Claude 而不發生衝突。每個 worktree 是一個獨立的 checkout

```bash
git worktree add ../feature-branch feature-branch
# 現在在每個 worktree 執行獨立的 Claude 實例
```

### 用於長執行時間指令的 tmux

串流並觀看 Claude 執行的 logs/bash 程序：

https://github.com/user-attachments/assets/shortform/07-tmux-video.mp4

```bash
tmux new -s dev
# Claude 在此執行指令，你可以分離 (detach) 並重新連接 (reattach)
tmux attach -t dev
```

### mgrep > grep

`mgrep` 是 ripgrep/grep 的顯著改進。透過 plugin 市集安裝，然後使用 `/mgrep` skill。適用於本地搜尋和網頁搜尋。

```bash
mgrep "function handleSubmit"  # 本地搜尋
mgrep --web "Next.js 15 app router changes"  # 網頁搜尋
```

### 其他有用指令

- `/rewind` - 回到先前的狀態
- `/statusline` - 自訂分支、情境 %、待辦事項
- `/checkpoints` - 檔案級別的復原點
- `/compact` - 手動觸發情境壓縮

### GitHub Actions CI/CD

使用 GitHub Actions 設定 PR 的程式碼審查。設定後 Claude 可以自動審查 PR。

![Claude bot approving a PR](./assets/images/shortform/08-github-pr-review.jpeg)
*Claude 核准 bug 修復 PR*

### 沙箱 (Sandboxing)

對風險操作使用沙箱模式 - Claude 在受限環境中執行，不會影響你的實際系統。

---

## 關於編輯器 (On Editors)

你的編輯器選擇顯著影響 Claude Code 工作流程。雖然 Claude Code 可在任何終端機運作，但與功能強大的編輯器搭配可解鎖即時檔案追蹤、快速導航和整合的指令執行。

### Zed (我的偏好)

我使用 [Zed](https://zed.dev) - 用 Rust 寫的，所以真的很快。瞬間開啟，處理大型程式碼庫毫不費力，幾乎不佔用系統資源。

**為什麼 Zed + Claude Code 是絕佳組合：**

- **速度** - 基於 Rust 的效能意味著當 Claude 快速編輯檔案時沒有延遲。你的編輯器跟得上
- **Agent 面板整合** - Zed 的 Claude 整合讓你即時追蹤 Claude 的檔案變更。在 Claude 提及的檔案間跳轉而不需離開編輯器
- **CMD+Shift+R 指令面板** - 在可搜尋的 UI 中快速存取所有自訂斜線指令、除錯器、建置腳本
- **極低資源使用** - 在繁重操作期間不會與 Claude 爭奪 RAM/CPU。執行 Opus 時很重要
- **Vim 模式** - 如果你喜歡的話，有完整的 vim 按鍵綁定

![Zed Editor with custom commands](./assets/images/shortform/09-zed-editor.jpeg)
*使用 CMD+Shift+R 顯示自訂指令下拉選單的 Zed 編輯器。右下角靶心顯示 Following mode。*

**不限編輯器的技巧：**

1. **分割螢幕** - 一邊是 Claude Code 終端機，另一邊是編輯器
2. **Ctrl + G** - 在 Zed 中快速打開 Claude 當前正在處理的檔案
3. **自動儲存** - 啟用自動儲存，讓 Claude 的檔案讀取永遠是最新的
4. **Git 整合** - 在提交前使用編輯器的 git 功能審查 Claude 的變更
5. **檔案觀察者** - 大多數編輯器會自動重新載入變更的檔案，確認這已啟用

### VSCode / Cursor

這也是不錯的選擇，與 Claude Code 搭配良好。你可以使用終端機形式，透過 `\ide` 與編輯器自動同步啟用 LSP 功能 (現在與 plugins 有點重疊)。或者你可以選擇 Extension，它與編輯器整合度更高並有搭配的 UI。

![VS Code Claude Code Extension](./assets/images/shortform/10-vscode-extension.jpeg)
*VS Code 擴充功能提供 Claude Code 的原生圖形介面，直接整合到你的 IDE 中。*

---

## 我的設定 (My Setup)

### Plugins

**已安裝：** (我通常一次只會啟用其中 4-5 個)

```markdown
ralph-wiggum@claude-code-plugins       # 循環自動化
frontend-design@claude-code-plugins    # UI/UX 模式
commit-commands@claude-code-plugins    # Git 工作流
security-guidance@claude-code-plugins  # 安全性檢查
pr-review-toolkit@claude-code-plugins  # PR 自動化
typescript-lsp@claude-plugins-official # TS 智慧功能
hookify@claude-plugins-official        # Hook 建立
code-simplifier@claude-plugins-official
feature-dev@claude-code-plugins
explanatory-output-style@claude-code-plugins
code-review@claude-code-plugins
context7@claude-plugins-official       # 即時文件
pyright-lsp@claude-plugins-official    # Python 型別
mgrep@Mixedbread-Grep                  # 更好的搜尋
```

### MCP Servers

**已設定 (使用者層級):**

```json
{
  "github": { "command": "npx", "args": ["-y", "@modelcontextprotocol/server-github"] },
  "firecrawl": { "command": "npx", "args": ["-y", "firecrawl-mcp"] },
  "supabase": {
    "command": "npx",
    "args": ["-y", "@supabase/mcp-server-supabase@latest", "--project-ref=YOUR_REF"]
  },
  "memory": { "command": "npx", "args": ["-y", "@modelcontextprotocol/server-memory"] },
  "sequential-thinking": {
    "command": "npx",
    "args": ["-y", "@modelcontextprotocol/server-sequential-thinking"]
  },
  "vercel": { "type": "http", "url": "https://mcp.vercel.com" },
  "railway": { "command": "npx", "args": ["-y", "@railway/mcp-server"] },
  "cloudflare-docs": { "type": "http", "url": "https://docs.mcp.cloudflare.com/mcp" },
  "cloudflare-workers-bindings": {
    "type": "http",
    "url": "https://bindings.mcp.cloudflare.com/mcp"
  },
  "clickhouse": { "type": "http", "url": "https://mcp.clickhouse.cloud/mcp" },
  "AbletonMCP": { "command": "uvx", "args": ["ableton-mcp"] },
  "magic": { "command": "npx", "args": ["-y", "@magicuidesign/mcp@latest"] }
}
```

這是關鍵 - 我設定了 14 個 MCPs 但每個專案只啟用 ~5-6 個。保持情境視窗健康。

### 關鍵 Hooks

```json
{
  "PreToolUse": [
    { "matcher": "npm|pnpm|yarn|cargo|pytest", "hooks": ["tmux reminder"] },
    { "matcher": "Write && .md file", "hooks": ["block unless README/CLAUDE"] },
    { "matcher": "git push", "hooks": ["open editor for review"] }
  ],
  "PostToolUse": [
    { "matcher": "Edit && .ts/.tsx/.js/.jsx", "hooks": ["prettier --write"] },
    { "matcher": "Edit && .ts/.tsx", "hooks": ["tsc --noEmit"] },
    { "matcher": "Edit", "hooks": ["grep console.log warning"] }
  ],
  "Stop": [
    { "matcher": "*", "hooks": ["check modified files for console.log"] }
  ]
}
```

### 自訂狀態列 (Custom Status Line)

顯示使用者、目錄、帶有未提交指示的 git 分支、情境剩餘 %、模型、時間和待辦事項計數：

![Custom status line](./assets/images/shortform/11-statusline.jpeg)
*我在 Mac 根目錄下的狀態列範例*

```
affoon:~ ctx:65% Opus 4.5 19:52
▌▌ plan mode on (shift+tab to cycle)
```

### Rules 結構

```
~/.claude/rules/
  security.md      # 強制性安全檢查
  coding-style.md  # 不變性，檔案大小限制
  testing.md       # TDD，80% 覆蓋率
  git-workflow.md  # 傳統 commits
  agents.md        # Subagent 委派規則
  patterns.md      # API 回應格式
  performance.md   # 模型選擇 (Haiku vs Sonnet vs Opus)
  hooks.md         # Hook 文件
```

### Subagents

```
~/.claude/agents/
  planner.md           # 分解功能
  architect.md         # 系統設計
  tdd-guide.md         # 先寫測試
  code-reviewer.md     # 品質審查
  security-reviewer.md # 漏洞掃描
  build-error-resolver.md
  e2e-runner.md        # Playwright 測試
  refactor-cleaner.md  # 移除死碼
  doc-updater.md       # 保持文件同步
```

---

## 關鍵重點 (Key Takeaways)

1. **不要過度複雜化** - 將設定視為微調，而非架構
2. **情境視窗很珍貴** - 禁用未使用的 MCPs 和 plugins
3. **平行執行** - fork 對話，使用 git worktrees
4. **自動化重複工作** - 格式化、linting、提醒的 hooks
5. **限制 subagents 範圍** - 有限的工具 = 專注的執行

---

## 參考資料 (References)

- [Plugins Reference](https://code.claude.com/docs/en/plugins-reference)
- [Hooks Documentation](https://code.claude.com/docs/en/hooks)
- [Checkpointing](https://code.claude.com/docs/en/checkpointing)
- [Interactive Mode](https://code.claude.com/docs/en/interactive-mode)
- [Memory System](https://code.claude.com/docs/en/memory)
- [Subagents](https://code.claude.com/docs/en/sub-agents)
- [MCP Overview](https://code.claude.com/docs/en/mcp-overview)

---

**註：** 這只是部分細節。進一步的進階模式請參閱 [完整詳解指南](./the-longform-guide.md)。

---

*與 [@DRodriguezFX](https://x.com/DRodriguezFX) 一起在 NYC 贏得 Anthropic x Forum Ventures 黑客松專案 [zenith.chat](https://zenith.chat)*
