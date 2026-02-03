# Verification Command

對目前程式碼庫狀態執行全面驗證。

## 指示 (Instructions)

請依照此確切順序執行驗證：

1. **建置檢查 (Build Check)**
   - 執行此專案的建置指令
   - 如果失敗，報告錯誤並【停止】

2. **型別檢查 (Type Check)**
   - 執行 TypeScript/型別檢查器
   - 報告所有錯誤 (包含 file:line)

3. **Lint 檢查 (Lint Check)**
   - 執行 linter
   - 報告警告與錯誤

4. **測試套件 (Test Suite)**
   - 執行所有測試
   - 報告 通過/失敗 計數
   - 報告覆蓋率百分比

5. **Console.log 稽核 (Console.log Audit)**
   - 在原始檔中搜尋 console.log
   - 報告位置

6. **Git 狀態 (Git Status)**
   - 顯示未提交的變更
   - 顯示自上次 commit 後修改的檔案

## 輸出 (Output)

產生簡潔的驗證報告：

```
VERIFICATION: [PASS/FAIL]

Build:    [OK/FAIL]
Types:    [OK/X errors]
Lint:     [OK/X issues]
Tests:    [X/Y passed, Z% coverage]
Secrets:  [OK/X found]
Logs:     [OK/X console.logs]

Ready for PR: [YES/NO]
```

如果有任何嚴重問題，列出它們並附上修復建議。

## 參數 (Arguments)

$ARGUMENTS 可以是：
- `quick` - 僅建置 + 型別
- `full` - 所有檢查 (預設)
- `pre-commit` - 提交相關的檢查
- `pre-pr` - 完整檢查加上安全性掃描
