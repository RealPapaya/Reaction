# 貢獻至 Everything Claude Code

感謝您想要貢獻。此 repo 旨在成為 Claude Code 使用者的社群資源。

## 我們正在尋找的 (What We're Looking For)

### Agents (代理)

能妥善處理特定任務的新 agents：
- 特定語言的審查員 (Python, Go, Rust)
- 框架專家 (Django, Rails, Laravel, Spring)
- DevOps 專家 (Kubernetes, Terraform, CI/CD)
- 領域專家 (ML pipelines, 資料工程, 行動開發)

### Skills (技能)

工作流程定義與領域知識：
- 語言最佳實踐
- 框架模式
- 測試策略
- 架構指南
- 特定領域知識

### Commands (指令)

能呼叫有用工作流程的斜線指令：
- 部署指令
- 測試指令
- 文件指令
- 程式碼生成指令

### Hooks (掛鉤)

有用的自動化：
- Linting/格式化 hooks
- 安全性檢查
- 驗證 hooks
- 通知 hooks

### Rules (規則)

必須持續遵循的準則：
- 安全規則
- 程式碼風格規則
- 測試要求
- 命名慣例

### MCP 設定

新的或改進的 MCP 伺服器設定：
- 資料庫整合
- 雲端提供者 MCPs
- 監控工具
- 通訊工具

---

## 如何貢獻 (How to Contribute)

### 1. Fork 這個 repo

```bash
git clone https://github.com/YOUR_USERNAME/everything-claude-code.git
cd everything-claude-code
```

### 2. 建立分支 (branch)

```bash
git checkout -b add-python-reviewer
```

### 3. 加入您的貢獻

將檔案放在適當的目錄：
- `agents/` 用於新 agents
- `skills/` 用於 skills (可以是單一 .md 或目錄)
- `commands/` 用於斜線指令
- `rules/` 用於規則檔案
- `hooks/` 用於 hook 設定
- `mcp-configs/` 用於 MCP 伺服器設定

### 4. 遵循格式

**Agents** 應包含 frontmatter：

```markdown
---
name: agent-name
description: 它做什麼
tools: Read, Grep, Glob, Bash
model: sonnet
---

Instructions here...
```

**Skills** 應清晰且可執行：

```markdown
# Skill Name

## When to Use

...

## How It Works

...

## Examples

...
```

**Commands** 應解釋它們做什麼：

```markdown
---
description: 指令簡述
---

# Command Name

Detailed instructions...
```

**Hooks** 應包含描述：

```json
{
  "matcher": "...",
  "hooks": [...],
  "description": "這個 hook 做什麼"
}
```

### 5. 測試您的貢獻

在提交之前，確認您的設定可與 Claude Code 正常運作。

### 6. 提交 PR (Submit a PR)

```bash
git add .
git commit -m "Add Python code reviewer agent"
git push origin add-python-reviewer
```

然後開啟一個 PR 並說明：
- 您新增了什麼
- 為什麼它有用
- 您如何測試它

---

## 準則 (Guidelines)

### Do (可以做)

- 保持設定專注且模組化
- 包含清晰的描述
- 提交前進行測試
- 遵循現有模式
- 記錄任何相依性

### Don't (不要做)

- 包含敏感資料 (API keys, tokens, paths)
- 新增過於複雜或冷門的設定
- 提交未經測試的設定
- 建立重複的功能
- 新增需要付費服務且無替代方案的設定

---

## 檔案命名

- 使用小寫與連字號：`python-reviewer.md`
- 具描述性：用 `tdd-workflow.md` 而不是 `workflow.md`
- 讓 agent/skill 名稱與檔名相符

---

## 有問題嗎？

開啟一個 issue 或在 X 上聯絡：[@affaanmustafa](https://x.com/affaanmustafa)

---

感謝您的貢獻。讓我們一起建立一個很棒的資源。
