---
name: continuous-learning
description: 自動從 Claude Code 工作階段中提取可重複使用的模式，並將其儲存為學習到的 skills 以供未來使用。
---

# Continuous Learning Skill

在工作階段結束時自動評估 Claude Code 的工作階段，以提取可儲存為學習 skills 的可重複使用模式。

## 如何運作 (How It Works)

此 skill 在每個工作階段結束時作為 **Stop hook** 執行：

1. **工作階段評估 (Session Evaluation)**: 檢查工作階段是否有足夠的訊息 (預設: 10+)
2. **模式偵測 (Pattern Detection)**: 識別工作階段中可提取的模式
3. **Skill 提取 (Skill Extraction)**: 將有用的模式儲存至 `~/.claude/skills/learned/`

## 設定 (Configuration)

編輯 `config.json` 以自訂：

```json
{
  "min_session_length": 10,
  "extraction_threshold": "medium",
  "auto_approve": false,
  "learned_skills_path": "~/.claude/skills/learned/",
  "patterns_to_detect": [
    "error_resolution",
    "user_corrections",
    "workarounds",
    "debugging_techniques",
    "project_specific"
  ],
  "ignore_patterns": [
    "simple_typos",
    "one_time_fixes",
    "external_api_issues"
  ]
}
```

## 模式類型 (Pattern Types)

| Pattern | Description |
|---------|-------------|
| `error_resolution` | 特定錯誤如何被解決 |
| `user_corrections` | 來自使用者更正的模式 |
| `workarounds` | 框架/函式庫怪癖的解決方案 |
| `debugging_techniques` | 有效的除錯方法 |
| `project_specific` | 專案特定的慣例 |

## Hook 設定 (Hook Setup)

新增至您的 `~/.claude/settings.json`：

```json
{
  "hooks": {
    "Stop": [{
      "matcher": "*",
      "hooks": [{
        "type": "command",
        "command": "~/.claude/skills/continuous-learning/evaluate-session.sh"
      }]
    }]
  }
}
```

## 為什麼使用 Stop Hook?

- **輕量級**: 每個工作階段結束時只執行一次
- **非阻塞**: 不會增加每則訊息的延遲
- **完整 context**: 可以存取整個工作階段的逐字稿

## 相關 (Related)

- [The Longform Guide](https://x.com/affaanmustafa/status/2014040193557471352) - 持續學習章節
- `/learn` command - 工作階段中手動提取模式

---

## 比較筆記 (研究: 2025年1月)

### vs Homunculus (github.com/humanplane/homunculus)

Homunculus v2 採用更複雜的方法：

| Feature | Our Approach | Homunculus v2 |
|---------|--------------|---------------|
| Observation | Stop hook (工作階段結束) | PreToolUse/PostToolUse hooks (100% 可靠) |
| Analysis | Main context | Background agent (Haiku) |
| Granularity | Full skills | Atomic "instincts" (原子本能) |
| Confidence | None | 0.3-0.9 加權 |
| Evolution | Direct to skill | Instincts → cluster → skill/command/agent |
| Sharing | None | Export/import instincts |

**來自 homunculus 的關鍵洞察:**
> "v1 依賴 skills 進行觀察。Skills 下是機率性的——它們大約觸發 50-80% 的時間。v2 使用 hooks 進行觀察 (100% 可靠) 並使用 instincts 作為學習行為的原子單位。"

### 潛在的 v2 增強

1. **基於 Instinct 的學習** - 帶有信心評分的更小、原子行為
2. **背景觀察者** - Haiku agent 平行分析
3. **信心衰減** - 如果被反駁，instincts 會失去信心
4. **領域標記** - code-style, testing, git, debugging, etc.
5. **演化路徑** - 將相關 instincts 叢集化為 skills/commands

參見: `/Users/affoon/Documents/tasks/12-continuous-learning-v2.md` 以取得完整規格。
