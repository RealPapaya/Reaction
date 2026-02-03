---
name: continuous-learning-v2
description: 基於 Instinct 的學習系統，透過 hooks 觀察工作階段，建立帶有信心評分的原子 instincts，並將它們演化為 skills/commands/agents。
version: 2.0.0
---

# Continuous Learning v2 - Instinct-Based Architecture

一個先進的學習系統，透過帶有信心評分的原子 "instincts" (小型的學習行為)，將您的 Claude Code 工作階段轉化為可重複使用的知識。

## v2 的新功能 (What's New in v2)

| Feature | v1 | v2 |
|---------|----|----|
| Observation | Stop hook (工作階段結束) | PreToolUse/PostToolUse (100% 可靠) |
| Analysis | Main context | Background agent (Haiku) |
| Granularity | Full skills | Atomic "instincts" |
| Confidence | None | 0.3-0.9 加權 |
| Evolution | Direct to skill | Instincts → cluster → skill/command/agent |
| Sharing | None | Export/import instincts |

## Instinct 模型 (The Instinct Model)

一個 instinct 是一個小型的學習行為：

```yaml
---
id: prefer-functional-style
trigger: "when writing new functions"
confidence: 0.7
domain: "code-style"
source: "session-observation"
---

# Prefer Functional Style

## Action
Use functional patterns over classes when appropriate.

## Evidence
- Observed 5 instances of functional pattern preference
- User corrected class-based approach to functional on 2025-01-15
```

**屬性:**
- **Atomic** — 一個觸發器，一個動作
- **Confidence-weighted** — 0.3 = 暫定，0.9 = 幾乎確定
- **Domain-tagged** — code-style, testing, git, debugging, workflow, etc.
- **Evidence-backed** — 追蹤哪些觀察建立了它

## 如何運作 (How It Works)

```
Session Activity
      │
      │ Hooks capture prompts + tool use (100% reliable)
      ▼
┌─────────────────────────────────────────┐
│         observations.jsonl              │
│   (prompts, tool calls, outcomes)       │
└─────────────────────────────────────────┘
      │
      │ Observer agent reads (background, Haiku)
      ▼
┌─────────────────────────────────────────┐
│          PATTERN DETECTION              │
│   • User corrections → instinct         │
│   • Error resolutions → instinct        │
│   • Repeated workflows → instinct       │
└─────────────────────────────────────────┘
      │
      │ Creates/updates
      ▼
┌─────────────────────────────────────────┐
│         instincts/personal/             │
│   • prefer-functional.md (0.7)          │
│   • always-test-first.md (0.9)          │
│   • use-zod-validation.md (0.6)         │
└─────────────────────────────────────────┘
      │
      │ /evolve clusters
      ▼
┌─────────────────────────────────────────┐
│              evolved/                   │
│   • commands/new-feature.md             │
│   • skills/testing-workflow.md          │
│   • agents/refactor-specialist.md       │
└─────────────────────────────────────────┘
```

## 快速開始 (Quick Start)

### 1. 啟用觀察 Hooks

新增至您的 `~/.claude/settings.json`。

**如果作為 plugin 安裝** (推薦)：

```json
{
  "hooks": {
    "PreToolUse": [{
      "matcher": "*",
      "hooks": [{
        "type": "command",
        "command": "${CLAUDE_PLUGIN_ROOT}/skills/continuous-learning-v2/hooks/observe.sh pre"
      }]
    }],
    "PostToolUse": [{
      "matcher": "*",
      "hooks": [{
        "type": "command",
        "command": "${CLAUDE_PLUGIN_ROOT}/skills/continuous-learning-v2/hooks/observe.sh post"
      }]
    }]
  }
}
```

**如果手動安裝** 至 `~/.claude/skills`：

```json
{
  "hooks": {
    "PreToolUse": [{
      "matcher": "*",
      "hooks": [{
        "type": "command",
        "command": "~/.claude/skills/continuous-learning-v2/hooks/observe.sh pre"
      }]
    }],
    "PostToolUse": [{
      "matcher": "*",
      "hooks": [{
        "type": "command",
        "command": "~/.claude/skills/continuous-learning-v2/hooks/observe.sh post"
      }]
    }]
  }
}
```

### 2. 初始化目錄結構

Python CLI 會自動建立這些，但您也可以手動建立：

```bash
mkdir -p ~/.claude/homunculus/{instincts/{personal,inherited},evolved/{agents,skills,commands}}
touch ~/.claude/homunculus/observations.jsonl
```

### 3. 使用 Instinct 指令

```bash
/instinct-status     # Show learned instincts with confidence scores
/evolve              # Cluster related instincts into skills/commands
/instinct-export     # Export instincts for sharing
/instinct-import     # Import instincts from others
```

## 指令 (Commands)

| Command | Description |
|---------|-------------|
| `/instinct-status` | Show all learned instincts with confidence |
| `/evolve` | Cluster related instincts into skills/commands |
| `/instinct-export` | Export instincts for sharing |
| `/instinct-import <file>` | Import instincts from others |

## 設定 (Configuration)

編輯 `config.json`：

```json
{
  "version": "2.0",
  "observation": {
    "enabled": true,
    "store_path": "~/.claude/homunculus/observations.jsonl",
    "max_file_size_mb": 10,
    "archive_after_days": 7
  },
  "instincts": {
    "personal_path": "~/.claude/homunculus/instincts/personal/",
    "inherited_path": "~/.claude/homunculus/instincts/inherited/",
    "min_confidence": 0.3,
    "auto_approve_threshold": 0.7,
    "confidence_decay_rate": 0.05
  },
  "observer": {
    "enabled": true,
    "model": "haiku",
    "run_interval_minutes": 5,
    "patterns_to_detect": [
      "user_corrections",
      "error_resolutions",
      "repeated_workflows",
      "tool_preferences"
    ]
  },
  "evolution": {
    "cluster_threshold": 3,
    "evolved_path": "~/.claude/homunculus/evolved/"
  }
}
```

## 檔案結構 (File Structure)

```
~/.claude/homunculus/
├── identity.json           # Your profile, technical level
├── observations.jsonl      # Current session observations
├── observations.archive/   # Processed observations
├── instincts/
│   ├── personal/           # Auto-learned instincts
│   └── inherited/          # Imported from others
└── evolved/
    ├── agents/             # Generated specialist agents
    ├── skills/             # Generated skills
    └── commands/           # Generated commands
```

## 與 Skill Creator 的整合

當您使用 [Skill Creator GitHub App](https://skill-creator.app) 時，它現在會生成 **兩者**：
- 傳統 SKILL.md 檔案 (為了向下相容)
- Instinct collections (為了 v2 學習系統)

來自 repo 分析的 Instincts 具有 `source: "repo-analysis"` 並包含來源 repository URL。

## 信心評分 (Confidence Scoring)

信心度隨時間演化：

| Score | Meaning | Behavior |
|-------|---------|----------|
| 0.3 | Tentative | 建議但不強制 |
| 0.5 | Moderate | 相關時應用 |
| 0.7 | Strong | 自動核准應用 |
| 0.9 | Near-certain | 核心行為 |

**信心度增加** 當：
- 模式被重複觀察到
- 使用者未更正建議的行為
- 來自其他來源的類似 instincts 一致

**信心度減少** 當：
- 使用者明確更正行為
- 模式長時間未被觀察到
- 出現矛盾證據

## 為什麼用 Hooks vs Skills 進行觀察？

> "v1 依賴 skills 進行觀察。Skills 下是機率性的——它們基於 Claude 的判斷大約觸發 50-80% 的時間。"

Hooks 觸發 **100% 的時間**，確定性地。這意味著：
- 每個工具調用都被觀察到
- 沒有模式被遺漏
- 學習是全面的

## 向下相容性 (Backward Compatibility)

v2 與 v1 完全相容：
- 現有的 `~/.claude/skills/learned/` skills 仍然運作
- Stop hook 仍然執行 (但現在也饋送至 v2)
- 漸進式遷移路徑：平行執行兩者

## 隱私 (Privacy)

- 觀察結果 **本地** 保留在您的機器上
- 僅 **instincts** (模式) 可以被匯出
- 沒有實際程式碼或對話內容被共享
- 您控制匯出什麼內容

## 相關 (Related)

- [Skill Creator](https://skill-creator.app) - Generate instincts from repo history
- [Homunculus](https://github.com/humanplane/homunculus) - Inspiration for v2 architecture
- [The Longform Guide](https://x.com/affaanmustafa/status/2014040193557471352) - Continuous learning section

---

*基於 Instinct 的學習：一次一個觀察，教導 Claude 您的模式。*
