---
name: instinct-import
description: 從隊友、Skill Creator 或其他來源匯入 instincts
command: true
---

# Instinct Import Command

## 實作 (Implementation)

使用 plugin root 路徑執行 instinct CLI：

```bash
python3 "${CLAUDE_PLUGIN_ROOT}/skills/continuous-learning-v2/scripts/instinct-cli.py" import <file-or-url> [--dry-run] [--force] [--min-confidence 0.7]
```

或者如果 `CLAUDE_PLUGIN_ROOT` 未設定 (手動安裝)：

```bash
python3 ~/.claude/skills/continuous-learning-v2/scripts/instinct-cli.py import <file-or-url>
```

從以下來源匯入 instincts：
- 隊友的匯出
- Skill Creator (repo 分析)
- 社群合集
- 之前的機器備份

## 用法 (Usage)

```
/instinct-import team-instincts.yaml
/instinct-import https://github.com/org/repo/instincts.yaml
/instinct-import --from-skill-creator acme/webapp
```

## 做什麼 (What to Do)

1. 獲取 instinct 檔案 (本地路徑或 URL)
2. 解析並驗證格式
3. 檢查與現有 instincts 的重複項
4. 合併或新增 instincts
5. 儲存至 `~/.claude/homunculus/instincts/inherited/`

## 匯入流程 (Import Process)

```
📥 Importing instincts from: team-instincts.yaml
================================================

Found 12 instincts to import.

Analyzing conflicts...

## New Instincts (8)
These will be added:
  ✓ use-zod-validation (confidence: 0.7)
  ✓ prefer-named-exports (confidence: 0.65)
  ✓ test-async-functions (confidence: 0.8)
  ...

## Duplicate Instincts (3)
Already have similar instincts:
  ⚠️ prefer-functional-style
     Local: 0.8 confidence, 12 observations
     Import: 0.7 confidence
     → Keep local (higher confidence)

  ⚠️ test-first-workflow
     Local: 0.75 confidence
     Import: 0.9 confidence
     → Update to import (higher confidence)

## Conflicting Instincts (1)
These contradict local instincts:
  ❌ use-classes-for-services
     Conflicts with: avoid-classes
     → Skip (requires manual resolution)

---
Import 8 new, update 1, skip 3?
```

## 合併策略 (Merge Strategies)

### 對於重複項 (For Duplicates)
當匯入的 instinct 與與現有的匹配時：
- **Higher confidence wins**: 保留信心度較高的
- **Merge evidence**: 合併觀察次數
- **Update timestamp**: 標記為最近驗證過

### 對於衝突 (For Conflicts)
當匯入的 instinct 與現有的矛盾時：
- **Skip by default**: 不匯入衝突的 instincts
- **Flag for review**: 標記兩者皆需關注
- **Manual resolution**: 使用者決定保留哪一個

## 來源追蹤 (Source Tracking)

匯入的 instincts 標記有：
```yaml
source: "inherited"
imported_from: "team-instincts.yaml"
imported_at: "2025-01-22T10:30:00Z"
original_source: "session-observation"  # or "repo-analysis"
```

## Skill Creator 整合

從 Skill Creator 匯入時：

```
/instinct-import --from-skill-creator acme/webapp
```

這會獲取從 repo 分析產生的 instincts：
- 來源：`repo-analysis`
- 較高的初始信心度 (0.7+)
- 連結至來源 repository

## 旗標 (Flags)

- `--dry-run`: 預覽而不匯入
- `--force`: 即使存在衝突也強制匯入
- `--merge-strategy <higher|local|import>`: 如何處理重複項
- `--from-skill-creator <owner/repo>`: 從 Skill Creator 分析匯入
- `--min-confidence <n>`: 僅匯入高於門檻的 instincts

## 輸出 (Output)

匯入後：
```
✅ Import complete!

Added: 8 instincts
Updated: 1 instinct
Skipped: 3 instincts (2 duplicates, 1 conflict)

New instincts saved to: ~/.claude/homunculus/instincts/inherited/

Run /instinct-status to see all instincts.
```
