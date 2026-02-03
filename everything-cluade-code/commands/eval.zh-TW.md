# Eval Command

管理評測驅動開發 (eval-driven development) 工作流程。

## 用法 (Usage)

`/eval [define|check|report|list] [feature-name]`

## 定義評測 (Define Evals)

`/eval define feature-name`

建立新的評測定義：

1. 建立具有模板的 `.claude/evals/feature-name.md`：

```markdown
## EVAL: feature-name
Created: $(date)

### Capability Evals (能力評測)
- [ ] [能力 1 的描述]
- [ ] [能力 2 的描述]

### Regression Evals (回歸評測)
- [ ] [現有行為 1 仍然運作]
- [ ] [現有行為 2 仍然運作]

### Success Criteria (成功標準)
- pass@3 > 90% for capability evals
- pass^3 = 100% for regression evals
```

2. 提示使用者填寫具體標準

## 檢查評測 (Check Evals)

`/eval check feature-name`

執行功能的評測：

1. 從 `.claude/evals/feature-name.md` 讀取評測定義
2. 對於每個能力評測 (capability eval)：
   - 嘗試驗證標準
   - 記錄 PASS/FAIL (通過/失敗)
   - 將嘗試記錄於 `.claude/evals/feature-name.log`
3. 對於每個回歸評測 (regression eval)：
   - 執行相關測試
   - 與基準比較
   - 記錄 PASS/FAIL (通過/失敗)
4. 報告目前狀態：

```
EVAL CHECK: feature-name
========================
Capability: X/Y passing
Regression: X/Y passing
Status: IN PROGRESS / READY
```

## 報告評測 (Report Evals)

`/eval report feature-name`

產生全面的評測報告：

```
EVAL REPORT: feature-name
=========================
Generated: $(date)

CAPABILITY EVALS
----------------
[eval-1]: PASS (pass@1)
[eval-2]: PASS (pass@2) - required retry
[eval-3]: FAIL - see notes

REGRESSION EVALS
----------------
[test-1]: PASS
[test-2]: PASS
[test-3]: PASS

METRICS
-------
Capability pass@1: 67%
Capability pass@3: 100%
Regression pass^3: 100%

NOTES
-----
[任何問題、邊緣情況或觀察]

RECOMMENDATION
--------------
[SHIP / NEEDS WORK / BLOCKED]
```

## 列出評測 (List Evals)

`/eval list`

顯示所有評測定義：

```
EVAL DEFINITIONS
================
feature-auth      [3/5 passing] IN PROGRESS
feature-search    [5/5 passing] READY
feature-export    [0/4 passing] NOT STARTED
```

## 參數 (Arguments)

$ARGUMENTS:
- `define <name>` - 建立新的評測定義
- `check <name>` - 執行並檢查評測
- `report <name>` - 產生完整報告
- `list` - 顯示所有評測
- `clean` - 移除舊的評測日誌 (保留最後 10 次執行)
