---
name: iterative-retrieval
description: 逐步最佳化 Context 檢索以解決 subagent context 問題的模式
---

# Iterative Retrieval Pattern

解決多 agent 工作流程中 "context 問題" 的模式，其中 subagents 在開始工作之前不知道他們需要什麼 context。

## 問題 (The Problem)

Subagents 生成時 context 有限。他們不知道：
- 哪些檔案包含相關程式碼
- 程式碼庫中存在哪些模式
- 專案使用什麼術語

標準方法會失敗：
- **傳送所有內容 (Send everything)**: 導致 context 限制超出
- **不傳送任何內容 (Send nothing)**: Agent 缺乏關鍵資訊
- **猜測需要什麼 (Guess what's needed)**: 經常出錯

## 解決方案：迭代檢索 (Iterative Retrieval)

一個 4 階段循環，逐步最佳化 context：

```
┌─────────────────────────────────────────────┐
│                                             │
│   ┌──────────┐      ┌──────────┐            │
│   │ DISPATCH │─────▶│ EVALUATE │            │
│   └──────────┘      └──────────┘            │
│        ▲                  │                 │
│        │                  ▼                 │
│   ┌──────────┐      ┌──────────┐            │
│   │   LOOP   │◀─────│  REFINE  │            │
│   └──────────┘      └──────────┘            │
│                                             │
│        Max 3 cycles, then proceed           │
│                                             │
└─────────────────────────────────────────────┘
```

### 階段 1: DISPATCH

初始廣泛查詢以收集候選檔案：

```javascript
// Start with high-level intent
const initialQuery = {
  patterns: ['src/**/*.ts', 'lib/**/*.ts'],
  keywords: ['authentication', 'user', 'session'],
  excludes: ['*.test.ts', '*.spec.ts']
};

// Dispatch to retrieval agent
const candidates = await retrieveFiles(initialQuery);
```

### 階段 2: EVALUATE

評估檢索內容的相關性：

```javascript
function evaluateRelevance(files, task) {
  return files.map(file => ({
    path: file.path,
    relevance: scoreRelevance(file.content, task),
    reason: explainRelevance(file.content, task),
    missingContext: identifyGaps(file.content, task)
  }));
}
```

評分標準：
- **High (0.8-1.0)**: 直接實作目標功能
- **Medium (0.5-0.7)**: 包含相關模式或類型
- **Low (0.2-0.4)**: 稍微相關
- **None (0-0.2)**: 不相關，排除

### 階段 3: REFINE

根據評估更新搜尋標準：

```javascript
function refineQuery(evaluation, previousQuery) {
  return {
    // Add new patterns discovered in high-relevance files
    patterns: [...previousQuery.patterns, ...extractPatterns(evaluation)],

    // Add terminology found in codebase
    keywords: [...previousQuery.keywords, ...extractKeywords(evaluation)],

    // Exclude confirmed irrelevant paths
    excludes: [...previousQuery.excludes, ...evaluation
      .filter(e => e.relevance < 0.2)
      .map(e => e.path)
    ],

    // Target specific gaps
    focusAreas: evaluation
      .flatMap(e => e.missingContext)
      .filter(unique)
  };
}
```

### 階段 4: LOOP

使用最佳化的標準重複 (最多 3 個循環)：

```javascript
async function iterativeRetrieve(task, maxCycles = 3) {
  let query = createInitialQuery(task);
  let bestContext = [];

  for (let cycle = 0; cycle < maxCycles; cycle++) {
    const candidates = await retrieveFiles(query);
    const evaluation = evaluateRelevance(candidates, task);

    // Check if we have sufficient context
    const highRelevance = evaluation.filter(e => e.relevance >= 0.7);
    if (highRelevance.length >= 3 && !hasCriticalGaps(evaluation)) {
      return highRelevance;
    }

    // Refine and continue
    query = refineQuery(evaluation, query);
    bestContext = mergeContext(bestContext, highRelevance);
  }

  return bestContext;
}
```

## 實務範例 (Practical Examples)

### 範例 1: Bug 修復 Context

```
Task: "Fix the authentication token expiry bug"

Cycle 1:
  DISPATCH: Search for "token", "auth", "expiry" in src/**
  EVALUATE: Found auth.ts (0.9), tokens.ts (0.8), user.ts (0.3)
  REFINE: Add "refresh", "jwt" keywords; exclude user.ts

Cycle 2:
  DISPATCH: Search refined terms
  EVALUATE: Found session-manager.ts (0.95), jwt-utils.ts (0.85)
  REFINE: Sufficient context (2 high-relevance files)

Result: auth.ts, tokens.ts, session-manager.ts, jwt-utils.ts
```

### 範例 2: 功能實作 (Feature Implementation)

```
Task: "Add rate limiting to API endpoints"

Cycle 1:
  DISPATCH: Search "rate", "limit", "api" in routes/**
  EVALUATE: No matches - codebase uses "throttle" terminology
  REFINE: Add "throttle", "middleware" keywords

Cycle 2:
  DISPATCH: Search refined terms
  EVALUATE: Found throttle.ts (0.9), middleware/index.ts (0.7)
  REFINE: Need router patterns

Cycle 3:
  DISPATCH: Search "router", "express" patterns
  EVALUATE: Found router-setup.ts (0.8)
  REFINE: Sufficient context

Result: throttle.ts, middleware/index.ts, router-setup.ts
```

## 與 Agents 整合

在 agent prompts 中使用：

```markdown
When retrieving context for this task:
1. Start with broad keyword search
2. Evaluate each file's relevance (0-1 scale)
3. Identify what context is still missing
4. Refine search criteria and repeat (max 3 cycles)
5. Return files with relevance >= 0.7
```

## 最佳實踐 (Best Practices)

1. **從廣泛開始，逐步縮小 (Start broad, narrow progressively)** - 不要過度指定初始查詢
2. **學習程式碼庫術語 (Learn codebase terminology)** - 第一個循環通常會揭示命名慣例
3. **追蹤缺失的內容 (Track what's missing)** - 明確的缺口識別驅動最佳化
4. **在「足夠好」時停止 (Stop at "good enough")** - 3 個高相關性檔案勝過 10 個平庸的檔案
5. **自信地排除 (Exclude confidently)** - 低相關性檔案不會變得相關

## 相關 (Related)

- [The Longform Guide](https://x.com/affaanmustafa/status/2014040193557471352) - Subagent orchestration section
- `continuous-learning` skill - For patterns that improve over time
- Agent definitions in `~/.claude/agents/`
