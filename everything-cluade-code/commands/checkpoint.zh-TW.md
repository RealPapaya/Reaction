# Checkpoint Comand

在您的工作流程中建立或驗證檢查點 (checkpoint)。

## 用法 (Usage)

`/checkpoint [create|verify|list] [name]`

## 建立檢查點 (Create Checkpoint)

建立檢查點時：

1. 執行 `/verify quick` 以確保目前狀態是乾淨的
2. 建立 git stash 或 commit 並附上檢查點名稱
3. 將檢查點記錄至 `.claude/checkpoints.log`：

```bash
echo "$(date +%Y-%m-%d-%H:%M) | $CHECKPOINT_NAME | $(git rev-parse --short HEAD)" >> .claude/checkpoints.log
```

4. 報告檢查點已建立

## 驗證檢查點 (Verify Checkpoint)

對照檢查點進行驗證時：

1. 從 log 讀取檢查點
2. 比較目前狀態與檢查點：
   - 自檢查點後新增的檔案
   - 自檢查點後修改的檔案
   - 現在的測試通過率 vs 當時
   - 現在的覆蓋率 vs 當時

3. 報告：
```
CHECKPOINT COMPARISON: $NAME
============================
Files changed: X
Tests: +Y passed / -Z failed
Coverage: +X% / -Y%
Build: [PASS/FAIL]
```

## 列出檢查點 (List Checkpoints)

顯示所有檢查點：
- 名稱
- 時間戳記
- Git SHA
- 狀態 (current, behind, ahead)

## 工作流程 (Workflow)

典型的檢查點流程：

```
[Start] --> /checkpoint create "feature-start"
   |
[Implement] --> /checkpoint create "core-done"
   |
[Test] --> /checkpoint verify "core-done"
   |
[Refactor] --> /checkpoint create "refactor-done"
   |
[PR] --> /checkpoint verify "feature-start"
```

## 參數 (Arguments)

$ARGUMENTS:
- `create <name>` - 建立命名檢查點
- `verify <name>` - 對照命名檢查點進行驗證
- `list` - 顯示所有檢查點
- `clear` - 移除舊的檢查點 (保留最後 5 個)
