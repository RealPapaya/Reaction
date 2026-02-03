---
name: verification-loop
description: Claude Code 工作階段的全面驗證系統。在完成功能、PR 前或重構後使用。
---

# Verification Loop Skill

Claude Code 工作階段的全面驗證系統。

## 何時使用 (When to Use)

在以下情況呼叫此技能：
- 完成功能或重大程式碼變更之後
- 建立 PR 之前
- 當您想確保通過品質閘門 (Quality Gates) 時
- 重構之後

## 驗證階段 (Verification Phases)

### 階段 1: 建置驗證 (Build Verification)
```bash
# Check if project builds
npm run build 2>&1 | tail -20
# OR
pnpm build 2>&1 | tail -20
```

如果建置失敗，停止並在繼續之前修復。

### 階段 2: 類型檢查 (Type Check)
```bash
# TypeScript projects
npx tsc --noEmit 2>&1 | head -30

# Python projects
pyright . 2>&1 | head -30
```

報告所有類型錯誤。在繼續之前修復關鍵錯誤。

### 階段 3: Lint 檢查 (Lint Check)
```bash
# JavaScript/TypeScript
npm run lint 2>&1 | head -30

# Python
ruff check . 2>&1 | head -30
```

### 階段 4: 測試套件 (Test Suite)
```bash
# Run tests with coverage
npm run test -- --coverage 2>&1 | tail -50

# Check coverage threshold
# Target: 80% minimum
```

報告：
- 總測試數: X
- 通過: X
- 失敗: X
- 覆蓋率: X%

### 階段 5: 安全性掃描 (Security Scan)
```bash
# Check for secrets
grep -rn "sk-" --include="*.ts" --include="*.js" . 2>/dev/null | head -10
grep -rn "api_key" --include="*.ts" --include="*.js" . 2>/dev/null | head -10

# Check for console.log
grep -rn "console.log" --include="*.ts" --include="*.tsx" src/ 2>/dev/null | head -10
```

### 階段 6: Diff 審查 (Diff Review)
```bash
# Show what changed
git diff --stat
git diff HEAD~1 --name-only
```

審查每個變更的檔案：
- 非預期的變更
- 遺失的錯誤處理
- 先在的邊界情況

## 輸出格式 (Output Format)

執行所有階段後，產生驗證報告：

```
VERIFICATION REPORT
==================

Build:     [PASS/FAIL]
Types:     [PASS/FAIL] (X errors)
Lint:      [PASS/FAIL] (X warnings)
Tests:     [PASS/FAIL] (X/Y passed, Z% coverage)
Security:  [PASS/FAIL] (X issues)
Diff:      [X files changed]

Overall:   [READY/NOT READY] for PR

Issues to Fix:
1. ...
2. ...
```

## 持續模式 (Continuous Mode)

對於長工作階段，每 15 分鐘或在重大變更後執行驗證：

```markdown
Set a mental checkpoint:
- After completing each function
- After finishing a component
- Before moving to next task

Run: /verify
```

## 與 Hooks 整合

此技能補充了 PostToolUse hooks，但提供更深層的驗證。
Hooks 立即捕捉問題；此技能提供全面的審查。
