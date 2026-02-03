# Git 工作流程 (Git Workflow)

## Commit 訊息格式

```
<type>: <description>

<optional body>
```

Types: feat, fix, refactor, docs, test, chore, perf, ci

注意：透過 ~/.claude/settings.json 全域禁用歸屬 (Attribution)。

## Pull Request 工作流程

建立 PR 時：
1. 分析完整的 commit 歷史 (不僅是最後一個 commit)
2. 使用 `git diff [base-branch]...HEAD` 查看所有變更
3. 草擬全面的 PR 摘要
4. 包含帶有 TODOs 的測試計畫
5. 如果是新分支，推送時加上 `-u` 旗標

## 功能實作工作流程

1. **先規劃 (Plan First)**
   - 使用 **planner** agent 建立實作計畫
   - 識別依賴關係和風險
   - 分解為階段

2. **TDD 方法 (TDD Approach)**
   - 使用 **tdd-guide** agent
   - 先寫測試 (RED)
   - 實作以通過測試 (GREEN)
   - 重構 (IMPROVE)
   - 驗證 80%+ 覆蓋率

3. **程式碼審查 (Code Review)**
   - 寫完程式碼後立即使用 **code-reviewer** agent
   - 解決 CRITICAL 和 HIGH 問題
   - 儘可能修復 MEDIUM 問題

4. **提交與推送 (Commit & Push)**
   - 詳細的 commit 訊息
   - 遵循 conventional commits 格式
