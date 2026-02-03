---
name: instinct-export
description: 匯出 instincts 以與隊友或其他專案共享
command: /instinct-export
---

# Instinct Export Command

將 instincts 匯出為可共享的格式。非常適合：
- 與隊友共享
- 轉移到新機器
- 貢獻專案慣例

## 用法 (Usage)

```
/instinct-export                           # Export all personal instincts
/instinct-export --domain testing          # Export only testing instincts
/instinct-export --min-confidence 0.7      # Only export high-confidence instincts
/instinct-export --output team-instincts.yaml
```

## 做什麼 (What to Do)

1. 從 `~/.claude/homunculus/instincts/personal/` 讀取 instincts
2. 根據旗標進行過濾
3. 去除敏感資訊：
   - 移除 session IDs
   - 移除檔案路徑 (僅保留模式)
   - 移除早於 "上週" 的時間戳記
4. 產生匯出檔案

## 輸出格式 (Output Format)

建立一個 YAML 檔案：

```yaml
# Instincts Export
# Generated: 2025-01-22
# Source: personal
# Count: 12 instincts

version: "2.0"
exported_by: "continuous-learning-v2"
export_date: "2025-01-22T10:30:00Z"

instincts:
  - id: prefer-functional-style
    trigger: "when writing new functions"
    action: "Use functional patterns over classes"
    confidence: 0.8
    domain: code-style
    observations: 8

  - id: test-first-workflow
    trigger: "when adding new functionality"
    action: "Write test first, then implementation"
    confidence: 0.9
    domain: testing
    observations: 12

  - id: grep-before-edit
    trigger: "when modifying code"
    action: "Search with Grep, confirm with Read, then Edit"
    confidence: 0.7
    domain: workflow
    observations: 6
```

## 隱私考量 (Privacy Considerations)

匯出包含：
- ✅ 觸發模式
- ✅ 動作
- ✅ 信心分數
- ✅ 領域
- ✅ 觀察次數

匯出**不包含**：
- ❌ 實際程式碼片段
- ❌ 檔案路徑
- ❌ Session 逐字稿
- ❌ 個人識別碼

## 旗標 (Flags)

- `--domain <name>`: 僅匯出指定領域
- `--min-confidence <n>`: 最小信心門檻 (預設: 0.3)
- `--output <file>`: 輸出檔案路徑 (預設: instincts-export-YYYYMMDD.yaml)
- `--format <yaml|json|md>`: 輸出格式 (預設: yaml)
- `--include-evidence`: 包含證據文字 (預設: 排除)
