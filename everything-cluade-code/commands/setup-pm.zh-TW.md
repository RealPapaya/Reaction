---
description: 設定您偏好的套件管理器 (npm/pnpm/yarn/bun)
disable-model-invocation: true
---

# Package Manager Setup

為此專案或全域設定您偏好的套件管理器。

## 用法 (Usage)

```bash
# Detect current package manager
node scripts/setup-package-manager.js --detect

# Set global preference
node scripts/setup-package-manager.js --global pnpm

# Set project preference
node scripts/setup-package-manager.js --project bun

# List available package managers
node scripts/setup-package-manager.js --list
```

## 偵測優先順序 (Detection Priority)

當決定使用哪個套件管理器時，依照以下順序檢查：

1. **Environment variable**: `CLAUDE_PACKAGE_MANAGER`
2. **Project config**: `.claude/package-manager.json`
3. **package.json**: `packageManager` field
4. **Lock file**: 存在 package-lock.json, yarn.lock, pnpm-lock.yaml, 或 bun.lockb
5. **Global config**: `~/.claude/package-manager.json`
6. **Fallback**: 第一個可用的套件管理器 (pnpm > bun > yarn > npm)

## 設定檔 (Configuration Files)

### Global Configuration
```json
// ~/.claude/package-manager.json
{
  "packageManager": "pnpm"
}
```

### Project Configuration
```json
// .claude/package-manager.json
{
  "packageManager": "bun"
}
```

### package.json
```json
{
  "packageManager": "pnpm@8.6.0"
}
```

## 環境變數 (Environment Variable)

設定 `CLAUDE_PACKAGE_MANAGER` 以覆蓋所有其他偵測方法：

```bash
# Windows (PowerShell)
$env:CLAUDE_PACKAGE_MANAGER = "pnpm"

# macOS/Linux
export CLAUDE_PACKAGE_MANAGER=pnpm
```

## 執行偵測 (Run the Detection)

要查看目前的套件管理器偵測結果，執行：

```bash
node scripts/setup-package-manager.js --detect
```
