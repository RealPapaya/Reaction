---
name: strategic-compact
description: 建議在邏輯間隔進行手動 Context 壓縮，以保留跨任務階段的 Context，而不是任意的自動壓縮。
---

# Strategic Compact Skill

建議在工作流程中的策略性時間點手動執行 `/compact`，而不是依賴任意的自動壓縮。

## 為何需要策略性壓縮？ (Why Strategic Compaction?)

自動壓縮會在任意時間點觸發：
- 通常在任務中途，遺失重要 Context
- 無法感知邏輯任務邊界
- 可能中斷複雜的多步驟操作

在邏輯邊界進行策略性壓縮：
- **探索之後，執行之前** - 壓縮研究 Context，保留實作計畫
- **完成里程碑之後** - 為下一階段重新開始
- **主要 Context 轉換之前** - 在不同任務前清除探索 Context

## 如何運作 (How It Works)

`suggest-compact.sh` 腳本在 PreToolUse (Edit/Write) 時執行，並且：

1. **追蹤工具呼叫** - 計算工作階段中的工具呼叫次數
2. **閾值偵測** - 在可設定的閾值建議 (預設：50 次呼叫)
3. **定期提醒** - 在閾值後每 25 次呼叫提醒

## Hook 設定 (Hook Setup)

新增至您的 `~/.claude/settings.json`：

```json
{
  "hooks": {
    "PreToolUse": [{
      "matcher": "tool == \"Edit\" || tool == \"Write\"",
      "hooks": [{
        "type": "command",
        "command": "~/.claude/skills/strategic-compact/suggest-compact.sh"
      }]
    }]
  }
}
```

## 設定 (Configuration)

環境變數：
- `COMPACT_THRESHOLD` - 第一次建議前的工具呼叫次數 (預設：50)

## 最佳實踐 (Best Practices)

1. **規畫後壓縮** - 一旦計畫定案，壓縮以重新開始
2. **除錯後壓縮** - 在繼續之前清除錯誤解決 Context
3. **不要在實作中途壓縮** - 保留相關變更的 Context
4. **閱讀建議** - Hook 告訴你*何時*，你決定*是否*

## 相關 (Related)

- [The Longform Guide](https://x.com/affaanmustafa/status/2014040193557471352) - Token optimization section
- Memory persistence hooks - For state that survives compaction
