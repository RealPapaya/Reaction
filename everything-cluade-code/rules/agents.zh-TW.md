# Agent 協作 (Agent Orchestration)

## 可用的 Agents (Available Agents)

位於 `~/.claude/agents/`:

| Agent | 目的 (Purpose) | 何時使用 (When to Use) |
|-------|---------|-------------|
| planner | 實作規劃 | 複雜功能、重構 |
| architect | 系統設計 | 架構決策 |
| tdd-guide | 測試驅動開發 | 新功能、錯誤修復 |
| code-reviewer | 程式碼審查 | 寫完程式碼後 |
| security-reviewer | 安全性分析 | 提交 (commit) 前 |
| build-error-resolver | 修復建置錯誤 | 當建置失敗時 |
| e2e-runner | E2E 測試 | 關鍵使用者流程 |
| refactor-cleaner | 死碼清理 | 程式碼維護 |
| doc-updater | 文件 | 更新文件 |

## 立即 Agent 使用 (Immediate Agent Usage)

不需要使用者提示 (prompt)：
1. 複雜功能請求 - 使用 **planner** agent
2. 剛寫完/修改完程式碼 - 使用 **code-reviewer** agent
3. 錯誤修復或新功能 - 使用 **tdd-guide** agent
4. 架構決策 - 使用 **architect** agent

## 平行任務執行 (Parallel Task Execution)

對於獨立的操作，**始終**使用平行任務執行：

```markdown
# 良好 (GOOD): 平行執行
平行啟動 3 個 agent：
1. Agent 1: auth.ts 的安全性分析
2. Agent 2: 快取系統的效能審查
3. Agent 3: utils.ts 的型別檢查

# 不良 (BAD): 非必要的循序執行
先 agent 1，然後 agent 2，然後 agent 3
```

## 多觀點分析 (Multi-Perspective Analysis)

對於複雜問題，使用分工子代理 (split role sub-agents)：
- 事實審查員 (Factual reviewer)
- 資深工程師 (Senior engineer)
- 安全專家 (Security expert)
- 一致性審查員 (Consistency reviewer)
- 冗餘檢查員 (Redundancy checker)
