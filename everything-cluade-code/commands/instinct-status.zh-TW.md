---
name: instinct-status
description: 顯示所有學習到的 instincts 及其信心水準
command: true
---

# Instinct Status Command

顯示所有學習到的 instincts 及其信心分數，按領域分組。

## 實作 (Implementation)

使用 plugin root 路徑執行 instinct CLI：

```bash
python3 "${CLAUDE_PLUGIN_ROOT}/skills/continuous-learning-v2/scripts/instinct-cli.py" status
```

或者如果 `CLAUDE_PLUGIN_ROOT` 未設定 (手動安裝)，使用：

```bash
python3 ~/.claude/skills/continuous-learning-v2/scripts/instinct-cli.py status
```

## 用法 (Usage)

```
/instinct-status
/instinct-status --domain code-style
/instinct-status --low-confidence
```

## 做什麼 (What to Do)

1. 從 `~/.claude/homunculus/instincts/personal/` 讀取所有 instinct 檔案
2. 從 `~/.claude/homunculus/instincts/inherited/` 讀取繼承的 instincts
3. 將它們按領域分組並顯示信心條

## 輸出格式 (Output Format)

```
📊 Instinct Status
==================

## Code Style (4 instincts)

### prefer-functional-style
Trigger: when writing new functions
Action: Use functional patterns over classes
Confidence: ████████░░ 80%
Source: session-observation | Last updated: 2025-01-22

### use-path-aliases
Trigger: when importing modules
Action: Use @/ path aliases instead of relative imports
Confidence: ██████░░░░ 60%
Source: repo-analysis (github.com/acme/webapp)

## Testing (2 instincts)

### test-first-workflow
Trigger: when adding new functionality
Action: Write test first, then implementation
Confidence: █████████░ 90%
Source: session-observation

## Workflow (3 instincts)

### grep-before-edit
Trigger: when modifying code
Action: Search with Grep, confirm with Read, then Edit
Confidence: ███████░░░ 70%
Source: session-observation

---
Total: 9 instincts (4 personal, 5 inherited)
Observer: Running (last analysis: 5 min ago)
```

## 旗標 (Flags)

- `--domain <name>`: 依領域過濾 (code-style, testing, git, etc.)
- `--low-confidence`: 僅顯示信心度 < 0.5 的 instincts
- `--high-confidence`: 僅顯示信心度 >= 0.7 的 instincts
- `--source <type>`: 依來源過濾 (session-observation, repo-analysis, inherited)
- `--json`: 輸出為 JSON 以供程式化使用
