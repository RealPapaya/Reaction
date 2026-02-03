---
name: eval-harness
description: 用於 Claude Code 工作階段的正式評估框架，實作評估驅動開發 (EDD) 原則
tools: Read, Write, Edit, Bash, Grep, Glob
---

# Eval Harness Skill

用於 Claude Code 工作階段的正式評估框架，實作評估驅動開發 (Eval-Driven Development, EDD) 原則。

## 哲學 (Philosophy)

評估驅動開發將評估 (evals) 視為 "AI 開發的單元測試"：
- 在實作之前定義預期行為 (Define expected behavior BEFORE implementation)
- 在開發過程中持續執行評估 (Run evals continuously during development)
- 追蹤每次變更是否造成回歸 (Track regressions with each change)
- 使用 pass@k 指標來測量可靠性 (Use pass@k metrics for reliability measurement)

## 評估類型 (Eval Types)

### 能力評估 (Capability Evals)
測試 Claude 是否能做到以前做不到的事情：
```markdown
[CAPABILITY EVAL: feature-name]
Task: Description of what Claude should accomplish
Success Criteria:
  - [ ] Criterion 1
  - [ ] Criterion 2
  - [ ] Criterion 3
Expected Output: Description of expected result
```

### 回歸評估 (Regression Evals)
確保變更不會破壞現有功能：
```markdown
[REGRESSION EVAL: feature-name]
Baseline: SHA or checkpoint name
Tests:
  - existing-test-1: PASS/FAIL
  - existing-test-2: PASS/FAIL
  - existing-test-3: PASS/FAIL
Result: X/Y passed (previously Y/Y)
```

## 評分器類型 (Grader Types)

### 1. 基於程式碼的評分器 (Code-Based Grader)
使用程式碼進行確定性檢查：
```bash
# Check if file contains expected pattern
grep -q "export function handleAuth" src/auth.ts && echo "PASS" || echo "FAIL"

# Check if tests pass
npm test -- --testPathPattern="auth" && echo "PASS" || echo "FAIL"

# Check if build succeeds
npm run build && echo "PASS" || echo "FAIL"
```

### 2. 基於模型的評分器 (Model-Based Grader)
使用 Claude 評估開放式輸出：
```markdown
[MODEL GRADER PROMPT]
Evaluate the following code change:
1. Does it solve the stated problem?
2. Is it well-structured?
3. Are edge cases handled?
4. Is error handling appropriate?

Score: 1-5 (1=poor, 5=excellent)
Reasoning: [explanation]
```

### 3. 人類評分器 (Human Grader)
標記需要手動審查：
```markdown
[HUMAN REVIEW REQUIRED]
Change: Description of what changed
Reason: Why human review is needed
Risk Level: LOW/MEDIUM/HIGH
```

## 指標 (Metrics)

### pass@k
"在 k 次嘗試中至少一次成功"
- pass@1: 第一次嘗試成功率
- pass@3: 3 次嘗試內成功
- 典型目標: pass@3 > 90%

### pass^k
"所有 k 次試驗皆成功"
- 更高的可靠性標準
- pass^3: 3 次連續成功
- 用於關鍵路徑

## 評估工作流程 (Eval Workflow)

### 1. 定義 (Define) (在寫程式碼之前)
```markdown
## EVAL DEFINITION: feature-xyz

### Capability Evals
1. Can create new user account
2. Can validate email format
3. Can hash password securely

### Regression Evals
1. Existing login still works
2. Session management unchanged
3. Logout flow intact

### Success Metrics
- pass@3 > 90% for capability evals
- pass^3 = 100% for regression evals
```

### 2. 實作 (Implement)
撰寫程式碼以通過定義的評估。

### 3. 評估 (Evaluate)
```bash
# Run capability evals
[Run each capability eval, record PASS/FAIL]

# Run regression evals
npm test -- --testPathPattern="existing"

# Generate report
```

### 4. 報告 (Report)
```markdown
EVAL REPORT: feature-xyz
========================

Capability Evals:
  create-user:     PASS (pass@1)
  validate-email:  PASS (pass@2)
  hash-password:   PASS (pass@1)
  Overall:         3/3 passed

Regression Evals:
  login-flow:      PASS
  session-mgmt:    PASS
  logout-flow:     PASS
  Overall:         3/3 passed

Metrics:
  pass@1: 67% (2/3)
  pass@3: 100% (3/3)

Status: READY FOR REVIEW
```

## 整合模式 (Integration Patterns)

### 實作前 (Pre-Implementation)
```
/eval define feature-name
```
在 `.claude/evals/feature-name.md` 建立評估定義檔案

### 實作中 (During Implementation)
```
/eval check feature-name
```
執行目前的評估並報告狀態

### 實作後 (Post-Implementation)
```
/eval report feature-name
```
產生完整的評估報告

## 評估儲存 (Eval Storage)

將評估儲存在專案中：
```
.claude/
  evals/
    feature-xyz.md      # Eval definition
    feature-xyz.log     # Eval run history
    baseline.json       # Regression baselines
```

## 最佳實踐 (Best Practices)

1. **編碼之前定義評估** - 強迫清晰思考成功標準
2. **頻繁執行評估** - 及早發現回歸
3. **追蹤 pass@k 趨勢** - 監控可靠性趨勢
4. **盡可能使用程式碼評分器** - 確定性 > 機率性
5. **安全性需要人類審查** - 永遠不要完全自動化安全檢查
6. **保持評估快速** - 慢的評估不會被執行
7. **用程式碼版本控制評估** - 評估是一等公民 (first-class artifacts)

## 範例：新增認證 (Example: Adding Authentication)

```markdown
## EVAL: add-authentication

### Phase 1: Define (10 min)
Capability Evals:
- [ ] User can register with email/password
- [ ] User can login with valid credentials
- [ ] Invalid credentials rejected with proper error
- [ ] Sessions persist across page reloads
- [ ] Logout clears session

Regression Evals:
- [ ] Public routes still accessible
- [ ] API responses unchanged
- [ ] Database schema compatible

### Phase 2: Implement (varies)
[Write code]

### Phase 3: Evaluate
Run: /eval check add-authentication

### Phase 4: Report
EVAL REPORT: add-authentication
==============================
Capability: 5/5 passed (pass@3: 100%)
Regression: 3/3 passed (pass^3: 100%)
Status: SHIP IT
```
