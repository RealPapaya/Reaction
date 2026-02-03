---
description: 針對 idiomatic patterns、並發安全性、錯誤處理與安全性的全面 Go 程式碼審查。調用 go-reviewer agent。
---

# Go Code Review

此指令調用 **go-reviewer** agent 進行全面的 Go 特定程式碼審查。

## 這是什麼指令 (What This Command Does)

1. **識別 Go 變更**: 透過 `git diff` 找出已修改的 `.go` 檔案
2. **執行靜態分析**: 執行 `go vet`, `staticcheck`, 與 `golangci-lint`
3. **安全性掃描**: 檢查 SQL 注入、命令注入、競爭條件
4. **並發審查**: 分析 goroutine 安全性、channel 用法、mutex 模式
5. **Idiomatic Go 檢查**: 驗證程式碼遵循 Go 慣例與最佳實踐
6. **產生報告**: 依嚴重性將議題分類

## 何時使用 (When to Use)

當需要以下情況時使用 `/go-review`：
- 撰寫或修改 Go 程式碼後
- 提交 Go 變更前
- 審查包含 Go 程式碼的 PR 時
- 加入新的 Go 程式碼庫時
- 學習 idiomatic Go 模式時

## 審查類別 (Review Categories)

### CRITICAL - 嚴重 (必須修復)
- SQL/命令注入漏洞
- 無同步的競爭條件
- Goroutine 洩漏
- 寫死的憑證
- 不安全的指標用法
- 在關鍵路徑忽略錯誤

### HIGH - 高 (應該修復)
- 遺漏帶有上下文的錯誤包裝
- Panic 而非回傳錯誤
- Context 未傳遞
- 無緩衝 channel 導致死鎖
- 介面未滿足錯誤
- 遺漏 mutex 保護

### MEDIUM - 中 (考慮)
- 非 idiomatic 程式碼模式
- 匯出項目遺漏 godoc 註釋
- 低效率字串串接
- Slice 未預先分配
- 未使用 Table-driven 測試

## 執行的自動化檢查 (Automated Checks Run)

```bash
# Static analysis
go vet ./...

# Advanced checks (if installed)
staticcheck ./...
golangci-lint run

# Race detection
go build -race ./...

# Security vulnerabilities
govulncheck ./...
```

## 使用範例 (Example Usage)

```text
User: /go-review

Agent:
# Go Code Review Report

## Files Reviewed
- internal/handler/user.go (modified)
- internal/service/auth.go (modified)

## Static Analysis Results
✓ go vet: No issues
✓ staticcheck: No issues

## Issues Found

[CRITICAL] Race Condition
File: internal/service/auth.go:45
Issue: Shared map accessed without synchronization
\`\`\`go
var cache = map[string]*Session{}  // Concurrent access!

func GetSession(id string) *Session {
    return cache[id]  // Race condition
}
\`\`\`
Fix: Use sync.RWMutex or sync.Map
\`\`\`go
var (
    cache   = map[string]*Session{}
    cacheMu sync.RWMutex
)

func GetSession(id string) *Session {
    cacheMu.RLock()
    defer cacheMu.RUnlock()
    return cache[id]
}
\`\`\`

[HIGH] Missing Error Context
File: internal/handler/user.go:28
Issue: Error returned without context
\`\`\`go
return err  // No context
\`\`\`
Fix: Wrap with context
\`\`\`go
return fmt.Errorf("get user %s: %w", userID, err)
\`\`\`

## Summary
- CRITICAL: 1
- HIGH: 1
- MEDIUM: 0

Recommendation: ❌ Block merge until CRITICAL issue is fixed
```

## 核准標準 (Approval Criteria)

| Status | Condition |
|--------|-----------|
| ✅ Approve | 無 CRITICAL 或 HIGH 議題 |
| ⚠️ Warning | 僅有 MEDIUM 議題 (謹慎合併) |
| ❌ Block | 發現 CRITICAL 或 HIGH 議題 |

## 與其他指令的整合

- 先使用 `/go-test` 確保測試通過
- 如果發生建置錯誤使用 `/go-build`
- 在提交前使用 `/go-review`
- 對於非 Go 特定關注點使用 `/code-review`

## 相關 (Related)

- Agent: `agents/go-reviewer.md`
- Skills: `skills/golang-patterns/`, `skills/golang-testing/`
