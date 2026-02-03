# Orchestrate Command

用於複雜任務的順序性 agent 工作流程。

## 用法 (Usage)

`/orchestrate [workflow-type] [task-description]`

## 工作流程類型 (Workflow Types)

### feature
完整功能實作工作流程：
```
planner -> tdd-guide -> code-reviewer -> security-reviewer
```

### bugfix
Bug 調查與修復工作流程：
```
explorer -> tdd-guide -> code-reviewer
```

### refactor
安全重構工作流程：
```
architect -> code-reviewer -> tdd-guide
```

### security
安全性導向審查：
```
security-reviewer -> code-reviewer -> architect
```

## 執行模式 (Execution Pattern)

對於工作流程中的每個 agent：

1. 带著前一個 agent 的 context **調用 agent**
2. **收集輸出** 為結構化的交接 (handoff) 文件
3. **傳遞給下一個 agent**
4. **聚合結果** 成最終報告

## 交接文件格式 (Handoff Document Format)

在 agents 之間，建立交接文件：

```markdown
## HANDOFF: [previous-agent] -> [next-agent]

### Context
[Summary of what was done]

### Findings
[Key discoveries or decisions]

### Files Modified
[List of files touched]

### Open Questions
[Unresolved items for next agent]

### Recommendations
[Suggested next steps]
```

## 範例：Feature Workflow

```
/orchestrate feature "Add user authentication"
```

執行：

1. **Planner Agent**
   - 分析需求
   - 建立實作計畫
   - 識別依賴關係
   - Output: `HANDOFF: planner -> tdd-guide`

2. **TDD Guide Agent**
   - 讀取 planner 交接
   - 先寫測試
   - 實作以通過測試
   - Output: `HANDOFF: tdd-guide -> code-reviewer`

3. **Code Reviewer Agent**
   - 審查實作
   - 檢查議題
   - 建議改進
   - Output: `HANDOFF: code-reviewer -> security-reviewer`

4. **Security Reviewer Agent**
   - 安全稽核
   - 漏洞檢查
   - 最終核准
   - Output: Final Report

## 最終報告格式 (Final Report Format)

```
ORCHESTRATION REPORT
====================
Workflow: feature
Task: Add user authentication
Agents: planner -> tdd-guide -> code-reviewer -> security-reviewer

SUMMARY
-------
[One paragraph summary]

AGENT OUTPUTS
-------------
Planner: [summary]
TDD Guide: [summary]
Code Reviewer: [summary]
Security Reviewer: [summary]

FILES CHANGED
-------------
[List all files modified]

TEST RESULTS
------------
[Test pass/fail summary]

SECURITY STATUS
---------------
[Security findings]

RECOMMENDATION
--------------
[SHIP / NEEDS WORK / BLOCKED]
```

## 平行執行 (Parallel Execution)

對於獨立檢查，平行執行 agents：

```markdown
### Parallel Phase
Run simultaneously:
- code-reviewer (quality)
- security-reviewer (security)
- architect (design)

### Merge Results
Combine outputs into single report
```

## 參數 (Arguments)

$ARGUMENTS:
- `feature <description>` - 完整功能工作流程
- `bugfix <description>` - Bug 修復工作流程
- `refactor <description>` - 重構工作流程
- `security <description>` - 安全審查工作流程
- `custom <agents> <description>` - 自訂 agent 順序

## 自訂工作流程範例 (Custom Workflow Example)

```
/orchestrate custom "architect,tdd-guide,code-reviewer" "Redesign caching layer"
```

## 提示 (Tips)

1. 對於複雜功能 **從 planner 開始**
2. 合併前 **總是包含 code-reviewer**
3. 對於 auth/payment/PII **使用 security-reviewer**
4. **保持交接簡潔** - 專注於下一個 agent 需要什麼
5. 需要時在 agents 之間 **執行驗證**
