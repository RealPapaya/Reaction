---
name: evolve
description: 將相關的 instincts 叢集化為 skills、commands 或 agents
command: true
---

# Evolve Command

## 實作 (Implementation)

使用 plugin root 路徑執行 instinct CLI：

```bash
python3 "${CLAUDE_PLUGIN_ROOT}/skills/continuous-learning-v2/scripts/instinct-cli.py" evolve [--generate]
```

或者如果 `CLAUDE_PLUGIN_ROOT` 未設定 (手動安裝)：

```bash
python3 ~/.claude/skills/continuous-learning-v2/scripts/instinct-cli.py evolve [--generate]
```

分析 instincts 並將相關的叢集化為更高階的結構：
- **Commands**: 當 instincts 描述使用者調用的動作時
- **Skills**: 當 instincts 描述自動觸發的行為時
- **Agents**: 當 instincts 描述複雜、多步驟的流程時

## 用法 (Usage)

```
/evolve                    # 分析所有 instincts 並建議演化
/evolve --domain testing   # 僅演化 testing 領域的 instincts
/evolve --dry-run          # 顯示將會建立什麼但不建立
/evolve --threshold 5      # 需要 5+ 相關 instincts 才叢集化
```

## 演化規則 (Evolution Rules)

### → Command (使用者調用 User-Invoked)
當 instincts 描述使用者會明確請求的動作時：
- 多個關於「當使用者要求...」的 instincts
- 具有如「當建立一個新 X 時」觸發條件的 instincts
- 遵循可重複順序的 instincts

範例：
- `new-table-step1`: "when adding a database table, create migration"
- `new-table-step2`: "when adding a database table, update schema"
- `new-table-step3`: "when adding a database table, regenerate types"

→ 建立：`/new-table` command

### → Skill (自動觸發 Auto-Triggered)
當 instincts 描述應該自動發生的行為時：
- 模式匹配觸發
- 錯誤處理回應
- 程式碼風格強制執行

範例：
- `prefer-functional`: "when writing functions, prefer functional style"
- `use-immutable`: "when modifying state, use immutable patterns"
- `avoid-classes`: "when designing modules, avoid class-based design"

→ 建立：`functional-patterns` skill

### → Agent (需要深度/隔離 Needs Depth/Isolation)
當 instincts 描述受益於隔離的複雜、多步驟流程時：
- 除錯工作流程
- 重構順序
- 研究任務

範例：
- `debug-step1`: "when debugging, first check logs"
- `debug-step2`: "when debugging, isolate the failing component"
- `debug-step3`: "when debugging, create minimal reproduction"
- `debug-step4`: "when debugging, verify fix with test"

→ 建立：`debugger` agent

## 做什麼 (What to Do)

1. 從 `~/.claude/homunculus/instincts/` 讀取所有 instincts
2. 將 instincts 分組依據：
   - 領域相似性
   - 觸發模式重疊
   - 動作順序關係
3. 對於每個 3+ 相關 instincts 的叢集：
   - 決定演化類型 (command/skill/agent)
   - 產生適當的檔案
   - 儲存至 `~/.claude/homunculus/evolved/{commands,skills,agents}/`
4. 將演化結構連結回來源 instincts

## 輸出格式 (Output Format)

```
🧬 Evolve Analysis
==================

Found 3 clusters ready for evolution:

## Cluster 1: Database Migration Workflow
Instincts: new-table-migration, update-schema, regenerate-types
Type: Command
Confidence: 85% (based on 12 observations)

Would create: /new-table command
Files:
  - ~/.claude/homunculus/evolved/commands/new-table.md

## Cluster 2: Functional Code Style
Instincts: prefer-functional, use-immutable, avoid-classes, pure-functions
Type: Skill
Confidence: 78% (based on 8 observations)

Would create: functional-patterns skill
Files:
  - ~/.claude/homunculus/evolved/skills/functional-patterns.md

## Cluster 3: Debugging Process
Instincts: debug-check-logs, debug-isolate, debug-reproduce, debug-verify
Type: Agent
Confidence: 72% (based on 6 observations)

Would create: debugger agent
Files:
  - ~/.claude/homunculus/evolved/agents/debugger.md

---
Run `/evolve --execute` to create these files.
```

## 旗標 (Flags)

- `--execute`: 實際建立演化結構 (預設為預覽)
- `--dry-run`: 預覽而不建立
- `--domain <name>`: 僅演化指定領域的 instincts
- `--threshold <n>`: 形成叢集所需的最小 instincts 數 (預設: 3)
- `--type <command|skill|agent>`: 僅建立指定類型

## 產生的檔案格式 (Generated File Format)

### Command
```markdown
---
name: new-table
description: Create a new database table with migration, schema update, and type generation
command: /new-table
evolved_from:
  - new-table-migration
  - update-schema
  - regenerate-types
---

# New Table Command

[Generated content based on clustered instincts]

## Steps
1. ...
2. ...
```

### Skill
```markdown
---
name: functional-patterns
description: Enforce functional programming patterns
evolved_from:
  - prefer-functional
  - use-immutable
  - avoid-classes
---

# Functional Patterns Skill

[Generated content based on clustered instincts]
```

### Agent
```markdown
---
name: debugger
description: Systematic debugging agent
model: sonnet
evolved_from:
  - debug-check-logs
  - debug-isolate
  - debug-reproduce
---

# Debugger Agent

[Generated content based on clustered instincts]
```
