**語言:** [English](README.md) | [简体中文](README.zh-CN.md)

# Everything Claude Code

[![Stars](https://img.shields.io/github/stars/affaan-m/everything-claude-code?style=flat)](https://github.com/affaan-m/everything-claude-code/stargazers)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
![Shell](https://img.shields.io/badge/-Shell-4EAA25?logo=gnu-bash&logoColor=white)
![TypeScript](https://img.shields.io/badge/-TypeScript-3178C6?logo=typescript&logoColor=white)
![Go](https://img.shields.io/badge/-Go-00ADD8?logo=go&logoColor=white)
![Markdown](https://img.shields.io/badge/-Markdown-000000?logo=markdown&logoColor=white)

<p align="left">
  <a href="README.md">English</a> |
  <a href="README.zh-CN.md">简体中文</a>
</p>

**來自 Anthropic 黑客松優勝者的 Claude Code 設定檔完整合集。**

包含生產環境就緒的 agents、skills、hooks、commands、rules 以及 MCP 設定，歷經 10 個月以上實際建立產品的高強度日常使用演進而來。

---

## 指南 (The Guides)

本儲存庫 (repo) 僅包含原始程式碼。指南中解釋了一切。

<table>
<tr>
<td width="50%">
<a href="https://x.com/affaanmustafa/status/2012378465664745795">
<img src="https://github.com/user-attachments/assets/1a471488-59cc-425b-8345-5245c7efbcef" alt="Everything Claude Code 速查指南" />
</a>
</td>
<td width="50%">
<a href="https://x.com/affaanmustafa/status/2014040193557471352">
<img src="https://github.com/user-attachments/assets/c9ca43bc-b149-427f-b551-af6840c368f0" alt="Everything Claude Code 完整詳解指南" />
</a>
</td>
</tr>
<tr>
<td align="center"><b>速查指南 (Shorthand Guide)</b><br/>設定、基礎、哲學。<b>請先閱讀此篇。</b></td>
<td align="center"><b>完整詳解指南 (Longform Guide)</b><br/>Token 最佳化、記憶持久化、評估 (evals)、平行化。</td>
</tr>
</table>

| 主題 | 你將學到什麼 |
|-------|-------------------|
| Token 最佳化 | 模型選擇、系統提示精簡、背景程序 |
| 記憶持久化 | 自動在對話間儲存/載入情境 (Context) 的 Hooks |
| 持續學習 | 從對話中自動提取模式 (patterns) 轉為可重用的 skills |
| 驗證迴圈 | 檢查點 (Checkpoint) vs 持續評估、評分器類型、pass@k 指標 |
| 平行化 | Git worktrees、級聯方法 (cascade method)、何時擴展實例 |
| 子代理協作 | 情境問題、迭代檢索模式 |

---

## 跨平台支援

本插件現在完全支援 **Windows、macOS 和 Linux**。所有的 hooks 和腳本都已用 Node.js 重寫，以實現最大的相容性。

### 套件管理器偵測

插件會自動偵測您偏好的套件管理器 (npm, pnpm, yarn, 或 bun)，優先順序如下：

1. **環境變數**: `CLAUDE_PACKAGE_MANAGER`
2. **專案設定**: `.claude/package-manager.json`
3. **package.json**: `packageManager` 欄位
4. **鎖定檔 (Lock file)**: 從 package-lock.json, yarn.lock, pnpm-lock.yaml, 或 bun.lockb 偵測
5. **全域設定**: `~/.claude/package-manager.json`
6. **備案**: 第一個可用的套件管理器

要設定您偏好的套件管理器：

```bash
# 透過環境變數
export CLAUDE_PACKAGE_MANAGER=pnpm

# 透過全域設定
node scripts/setup-package-manager.js --global pnpm

# 透過專案設定
node scripts/setup-package-manager.js --project bun

# 偵測目前設定
node scripts/setup-package-manager.js --detect
```

或者使用 Claude Code 中的 `/setup-pm` 指令。

---

## 內容物 (What's Inside)

本 repo 是一個 **Claude Code plugin** - 您可以直接安裝它，或是手動複製組件。

```
everything-claude-code/
|-- .claude-plugin/   # Plugin 和市集清單 (manifests)
|   |-- plugin.json         # Plugin metadata 和組件路徑
|   |-- marketplace.json    # 用於 /plugin marketplace add 的市集目錄
|
|-- agents/           # 用於委派的專用子代理 (subagents)
|   |-- planner.md           # 功能實作計畫
|   |-- architect.md         # 系統設計決策
|   |-- tdd-guide.md         # 測試驅動開發 (TDD)
|   |-- code-reviewer.md     # 品質與安全性審查
|   |-- security-reviewer.md # 漏洞分析
|   |-- build-error-resolver.md
|   |-- e2e-runner.md        # Playwright E2E 測試
|   |-- refactor-cleaner.md  # 死碼 (Dead code) 清理
|   |-- doc-updater.md       # 文件同步
|   |-- go-reviewer.md       # Go 程式碼審查 (新)
|   |-- go-build-resolver.md # Go 建置錯誤解決 (新)
|
|-- skills/           # 工作流程定義與領域知識
|   |-- coding-standards/           # 語言最佳實踐
|   |-- backend-patterns/           # API、資料庫、快取模式
|   |-- frontend-patterns/          # React、Next.js 模式
|   |-- continuous-learning/        # 從對話中自動提取模式 (完整詳解指南)
|   |-- continuous-learning-v2/     # 基於直覺 (Instinct-based) 的學習與信心評分
|   |-- iterative-retrieval/        # 子代理的漸進式情境優化
|   |-- strategic-compact/          # 手動壓縮建議 (完整詳解指南)
|   |-- tdd-workflow/               # TDD 方法論
|   |-- security-review/            # 安全性檢查清單
|   |-- eval-harness/               # 驗證迴圈評估 (完整詳解指南)
|   |-- verification-loop/          # 持續驗證 (完整詳解指南)
|   |-- golang-patterns/            # Go 慣用語與最佳實踐 (新)
|   |-- golang-testing/             # Go 測試模式、TDD、基準測試 (新)
|
|-- commands/         # 用於快速執行的斜線指令 (Slash commands)
|   |-- tdd.md              # /tdd - 測試驅動開發
|   |-- plan.md             # /plan - 實作計畫
|   |-- e2e.md              # /e2e - 生成 E2E 測試
|   |-- code-review.md      # /code-review - 品質審查
|   |-- build-fix.md        # /build-fix - 修復建置錯誤
|   |-- refactor-clean.md   # /refactor-clean - 移除死碼
|   |-- learn.md            # /learn - 對話中途提取模式 (完整詳解指南)
|   |-- checkpoint.md       # /checkpoint - 儲存驗證狀態 (完整詳解指南)
|   |-- verify.md           # /verify - 執行驗證迴圈 (完整詳解指南)
|   |-- setup-pm.md         # /setup-pm - 設定套件管理器
|   |-- go-review.md        # /go-review - Go 程式碼審查 (新)
|   |-- go-test.md          # /go-test - Go TDD 工作流 (新)
|   |-- go-build.md         # /go-build - 修復 Go 建置錯誤 (新)
|   |-- skill-create.md     # /skill-create - 從 git 歷史生成 skills (新)
|   |-- instinct-status.md  # /instinct-status - 查看已學習的直覺 (新)
|   |-- instinct-import.md  # /instinct-import - 匯入直覺 (新)
|   |-- instinct-export.md  # /instinct-export - 匯出直覺 (新)
|   |-- evolve.md           # /evolve - 將直覺叢集化為 skills (新)
|
|-- rules/            # 必須遵循的準則 (複製到 ~/.claude/rules/)
|   |-- security.md         # 強制性安全檢查
|   |-- coding-style.md     # 不變性 (Immutability)、檔案組織
|   |-- testing.md          # TDD、80% 覆蓋率要求
|   |-- git-workflow.md     # Commit 格式、PR 流程
|   |-- agents.md           # 何時委派給子代理
|   |-- performance.md      # 模型選擇、情境管理
|
|-- hooks/            # 基於觸發器的自動化
|   |-- hooks.json                # 所有 hooks 設定 (PreToolUse, PostToolUse, Stop 等)
|   |-- memory-persistence/       # 階段生命週期 hooks (完整詳解指南)
|   |-- strategic-compact/        # 壓縮建議 (完整詳解指南)
|
|-- scripts/          # 跨平台 Node.js 腳本 (新)
|   |-- lib/                     # 共用工具
|   |   |-- utils.js             # 跨平台檔案/路徑/系統工具
|   |   |-- package-manager.js   # 套件管理器偵測與選擇
|   |-- hooks/                   # Hook 實作
|   |   |-- session-start.js     # 階段開始時載入情境
|   |   |-- session-end.js       # 階段結束時儲存狀態
|   |   |-- pre-compact.js       # 壓縮前儲存狀態
|   |   |-- suggest-compact.js   # 策略性壓縮建議
|   |   |-- evaluate-session.js  # 從對話中提取模式
|   |-- setup-package-manager.js # 互動式 PM 設定
|
|-- tests/            # 測試套件 (新)
|   |-- lib/                     # 函式庫測試
|   |-- hooks/                   # Hook 測試
|   |-- run-all.js               # 執行所有測試
|
|-- contexts/         # 動態系統提示注入情境 (完整詳解指南)
|   |-- dev.md              # 開發模式情境
|   |-- review.md           # 程式碼審查模式情境
|   |-- research.md         # 研究/探索模式情境
|
|-- examples/         # 範例設定與對話
|   |-- CLAUDE.md           # 範例專案層級設定
|   |-- user-CLAUDE.md      # 範例使用者層級設定
|
|-- mcp-configs/      # MCP 伺服器設定
|   |-- mcp-servers.json    # GitHub, Supabase, Vercel, Railway 等
|
|-- marketplace.json  # 自託管市集設定 (用於 /plugin marketplace add)
```

---

## 生態系工具 (Ecosystem Tools)

### Skill Creator

兩種從您的儲存庫生成 Claude Code skills 的方法：

#### 選項 A: 本地分析 (內建)

使用 `/skill-create` 指令進行不需外部服務的本地分析：

```bash
/skill-create                    # 分析當前 repo
/skill-create --instincts        # 同時生成用於 continuous-learning 的直覺 (instincts)
```

這會在本地分析您的 git 歷史並生成 SKILL.md 檔案。

#### 選項 B: GitHub App (進階)

針對進階功能 (10k+ commits、自動 PR、團隊分享)：

[安裝 GitHub App](https://github.com/apps/skill-creator) | [ecc.tools](https://ecc.tools)

```bash
# 在任何 issue 留言：
/skill-creator analyze

# 或在推送到預設分支時自動觸發
```

兩種選項都會建立：
- **SKILL.md 檔案** - 可立即用於 Claude Code 的 skills
- **直覺 (Instinct) 集合** - 用於 continuous-learning-v2
- **模式提取** - 從您的 commit 歷史中學習

### Continuous Learning v2

基於直覺的學習系統會自動學習您的模式：

```bash
/instinct-status        # 顯示已學習的直覺與信心度
/instinct-import <file> # 匯入他人的直覺
/instinct-export        # 匯出您的直覺以供分享
/evolve                 # 將相關的直覺叢集化為 skills
```

詳細文件請參閱 `skills/continuous-learning-v2/`。

---

## 需求

### Claude Code CLI 版本

**最低版本: v2.1.0 或更高**

由於插件系統處理 hooks 的方式有所變更，此插件需要 Claude Code CLI v2.1.0+。

檢查您的版本：
```bash
claude --version
```

### 重要：Hooks 自動載入行為

> ⚠️ **給貢獻者：** 請勿在 `.claude-plugin/plugin.json` 中加入 `"hooks"` 欄位。這由回歸測試強制執行。

Claude Code v2.1+ 依慣例會**自動載入**任何已安裝插件中的 `hooks/hooks.json`。在 `plugin.json` 中明確宣告會導致重複偵測錯誤：

```
Duplicate hooks file detected: ./hooks/hooks.json resolves to already-loaded file
```

**歷史：** 這在過去曾造成此 repo 多次的修復/還原循環 ([#29](https://github.com/affaan-m/everything-claude-code/issues/29), [#52](https://github.com/affaan-m/everything-claude-code/issues/52), [#103](https://github.com/affaan-m/everything-claude-code/issues/103))。該行為在 Claude Code 版本之間有所改變，導致混淆。我們現在有回歸測試以防止此問題再次發生。

---

## 安裝

### 選項 1: 以 Plugin 安裝 (推薦)

使用此 repo 最簡單的方法 - 安裝為 Claude Code plugin：

```bash
# 將此 repo 新增為市集 (marketplace)
/plugin marketplace add affaan-m/everything-claude-code

# 安裝 plugin
/plugin install everything-claude-code@everything-claude-code
```

或者直接新增到您的 `~/.claude/settings.json`：

```json
{
  "extraKnownMarketplaces": {
    "everything-claude-code": {
      "source": {
        "source": "github",
        "repo": "affaan-m/everything-claude-code"
      }
    }
  },
  "enabledPlugins": {
    "everything-claude-code@everything-claude-code": true
  }
}
```

這讓您可以立即存取所有的 commands、agents、skills 和 hooks。

> **注意：** Claude Code plugin 系統不支援透過 plugin 分發 `rules` ([上游限制](https://code.claude.com/docs/en/plugins-reference))。您需要手動安裝 rules：
>
> ```bash
> # 首先複製 repo
> git clone https://github.com/affaan-m/everything-claude-code.git
>
> # 選項 A: 使用者層級 rules (適用於所有專案)
> cp -r everything-claude-code/rules/* ~/.claude/rules/
>
> # 選項 B: 專案層級 rules (僅適用於當前專案)
> mkdir -p .claude/rules
> cp -r everything-claude-code/rules/* .claude/rules/
> ```

---

### 選項 2: 手動安裝

如果您偏好手動控制安裝內容：

```bash
# 複製 repo
git clone https://github.com/affaan-m/everything-claude-code.git

# 複製 agents 到您的 Claude 設定
cp everything-claude-code/agents/*.md ~/.claude/agents/

# 複製 rules
cp everything-claude-code/rules/*.md ~/.claude/rules/

# 複製 commands
cp everything-claude-code/commands/*.md ~/.claude/commands/

# 複製 skills
cp -r everything-claude-code/skills/* ~/.claude/skills/
```

#### 新增 hooks 到 settings.json

從 `hooks/hooks.json` 複製 hooks 到您的 `~/.claude/settings.json`。

#### 設定 MCPs

從 `mcp-configs/mcp-servers.json` 複製所需的 MCP 伺服器到您的 `~/.claude.json`。

**重要：** 將 `YOUR_*_HERE` 預留位置替換為您的實際 API 金鑰。

---

## 關鍵概念

### Agents

子代理 (Subagents) 處理範圍有限的委派任務。例如：

```markdown
---
name: code-reviewer
description: Reviews code for quality, security, and maintainability
tools: ["Read", "Grep", "Glob", "Bash"]
model: opus
---

You are a senior code reviewer...
```

### Skills

Skills 是由 commands 或 agents 呼叫的工作流程定義：

```markdown
# TDD Workflow

1. Define interfaces first
2. Write failing tests (RED)
3. Implement minimal code (GREEN)
4. Refactor (IMPROVE)
5. Verify 80%+ coverage
```

### Hooks

Hooks 在工具事件上觸發。例如 - 警告關於 console.log：

```json
{
  "matcher": "tool == \"Edit\" && tool_input.file_path matches \"\\\\.(ts|tsx|js|jsx)$\"",
  "hooks": [{
    "type": "command",
    "command": "#!/bin/bash\ngrep -n 'console\\.log' \"$file_path\" && echo '[Hook] Remove console.log' >&2"
  }]
}
```

### Rules

Rules 是必須持續遵循的準則。保持模組化：

```
~/.claude/rules/
  security.md      # 不要有寫死的機密資訊
  coding-style.md  # 不變性、檔案限制
  testing.md       # TDD、覆蓋率要求
```

---

## 執行測試

本 plugin 包含完整的測試套件：

```bash
# 執行所有測試
node tests/run-all.js

# 執行個別測試檔案
node tests/lib/utils.test.js
node tests/lib/package-manager.test.js
node tests/hooks/hooks.test.js
```

---

## 貢獻 (Contributing)

**我們歡迎並鼓勵貢獻。**

此 repo 旨在成為社群資源。如果您有：
- 有用的 agents 或 skills
- 巧妙的 hooks
- 更好的 MCP 設定
- 改進的 rules

請貢獻！參閱 [CONTRIBUTING.md](CONTRIBUTING.md) 了解準則。

### 貢獻點子

- 特定語言的 skills (Python, Rust 模式) - Go 現已包含！
- 特定框架的設定 (Django, Rails, Laravel)
- DevOps agents (Kubernetes, Terraform, AWS)
- 測試策略 (不同的框架)
- 特定領域知識 (ML, 資料工程, 行動開發)

---

## 背景

自實驗性推出以來，我一直使用 Claude Code。於 2025 年 9 月贏得 Anthropic x Forum Ventures 黑客松，建立 [zenith.chat](https://zenith.chat) (與 [@DRodriguezFX](https://x.com/DRodriguezFX) 合作) - 完全使用 Claude Code。

這些設定已在多個生產應用程式中經過實戰測試。

---

## 重要事項

### 情境視窗管理 (Context Window Management)

**關鍵：** 不要一次啟用所有 MCPs。啟用太多工具會使您的 200k 情境視窗縮減至 70k。

經驗法則：
- 設定 20-30 個 MCPs
- 每個專案啟用 10 個以下
- 啟用 80 個以下的工具

使用專案設定中的 `disabledMcpServers` 來禁用未使用的項目。

### 客製化

這些設定適用於我的工作流程。您應該：
1. 從有共鳴的部分開始
2. 針對您的堆疊進行修改
3. 移除您不使用的部分
4. 新增您自己的模式

---

## 星星歷史 (Star History)

[![Star History Chart](https://api.star-history.com/svg?repos=affaan-m/everything-claude-code&type=Date)](https://star-history.com/#affaan-m/everything-claude-code&Date)

---

## 連結

- **速查指南 (從這開始):** [The Shorthand Guide to Everything Claude Code](https://x.com/affaanmustafa/status/2012378465664745795)
- **完整詳解指南 (進階):** [The Longform Guide to Everything Claude Code](https://x.com/affaanmustafa/status/2014040193557471352)
- **追蹤:** [@affaanmustafa](https://x.com/affaanmustafa)
- **zenith.chat:** [zenith.chat](https://zenith.chat)

---

## 授權 (License)

MIT - 自由使用，依需求修改，如果可以請回饋貢獻。

---

**如果這有幫助請給此 repo 一顆星。閱讀兩份指南。打造偉大的事物。**
