---
description: 增量修復 Go 建置錯誤、go vet 警告與 linter 議題。調用 go-build-resolver agent 進行最小、手術式的修復。
---

# Go Build and Fix

此指令調用 **go-build-resolver** agent 以最小變更增量修復 Go 建置錯誤。

## 這是什麼指令 (What This Command Does)

1. **執行診斷**: 執行 `go build`, `go vet`, `staticcheck`
2. **解析錯誤**: 依檔案分組並依嚴重性排序
3. **增量修復**: 一次一個錯誤
4. **驗證每個修復**: 每次變更後重新執行建置
5. **報告摘要**: 顯示已修復項目與剩餘項目

## 何時使用 (When to Use)

當需要以下情況時使用 `/go-build`：
- `go build ./...` 失敗並顯示錯誤
- `go vet ./...` 報告議題
- `golangci-lint run` 顯示警告
- 模組依賴關係損壞
- 拉取破壞建置的變更後

## 執行的診斷指令 (Diagnostic Commands Run)

```bash
# Primary build check
go build ./...

# Static analysis
go vet ./...

# Extended linting (if available)
staticcheck ./...
golangci-lint run

# Module issues
go mod verify
go mod tidy -v
```

## 使用情境範例 (Example Session)

```text
User: /go-build

Agent:
# Go Build Resolution

## Initial Diagnostics

\`\`\`bash
$ go build ./...
internal/service/user.go:25:15: undefined: UserRepository
internal/handler/api.go:42:9: cannot use x (type string) as type int
internal/handler/api.go:58:2: missing return at end of function
\`\`\`

Errors found: 3

## Fix 1: Undefined Identifier

File: internal/service/user.go:25
Error: undefined: UserRepository
Cause: Missing import

\`\`\`go
// Added import
import "project/internal/repository"

// Changed
var repo UserRepository
// To
var repo repository.UserRepository
\`\`\`

\`\`\`bash
$ go build ./...
# 2 errors remaining
\`\`\`

## Fix 2: Type Mismatch

File: internal/handler/api.go:42
Error: cannot use x (type string) as type int

\`\`\`go
// Changed
count := params.Get("count")
// To
countStr := params.Get("count")
count, _ := strconv.Atoi(countStr)
\`\`\`

\`\`\`bash
$ go build ./...
# 1 error remaining
\`\`\`

## Fix 3: Missing Return

File: internal/handler/api.go:58
Error: missing return at end of function

\`\`\`go
func GetUser(id string) (*User, error) {
    if id == "" {
        return nil, ErrInvalidID
    }
    user := findUser(id)
    // Added missing return
    return user, nil
}
\`\`\`

\`\`\`bash
$ go build ./...
# Build successful!
\`\`\`

## Final Verification

\`\`\`bash
$ go vet ./...
# No issues

$ go test ./...
ok      project/internal/service   0.015s
ok      project/internal/handler   0.023s
\`\`\`

## Summary

| Metric | Count |
|--------|-------|
| Build errors fixed | 3 |
| Vet warnings fixed | 0 |
| Files modified | 2 |
| Remaining issues | 0 |

Build Status: ✅ SUCCESS
```

## 常見修復錯誤 (Common Errors Fixed)

| Error | Typical Fix |
|-------|-------------|
| `undefined: X` | Add import or fix typo |
| `cannot use X as Y` | Type conversion or fix assignment |
| `missing return` | Add return statement |
| `X does not implement Y` | Add missing method |
| `import cycle` | Restructure packages |
| `declared but not used` | Remove or use variable |
| `cannot find package` | `go get` or `go mod tidy` |

## 修復策略 (Fix Strategy)

1. **建置錯誤優先** - 程式碼必須能編譯
2. **Vet 警告其次** - 修復可疑結構
3. **Lint 警告最後** - 風格與最佳實踐
4. **一次修復一個** - 驗證每個變更
5. **最小變更** - 不要重構，只修復

## 停止條件 (Stop Conditions)

如果有以下情況，Agent 將停止並報告：
- 相同錯誤嘗試 3 次後仍存在
- 修復引入更多錯誤
- 需要架構變更
- 遺漏外部依賴

## 相關指令 (Related Commands)

- `/go-test` - 建置成功後執行測試
- `/go-review` - 審查程式碼品質
- `/verify` - 完整驗證循環

## 相關 (Related)

- Agent: `agents/go-build-resolver.md`
- Skill: `skills/golang-patterns/`
