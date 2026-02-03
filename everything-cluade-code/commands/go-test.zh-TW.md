---
description: 為 Go 強制執行 TDD 工作流程。先撰寫 table-driven tests，然後實作。使用 go test -cover 驗證 80% 以上覆蓋率。
---

# Go TDD Command

此指令使用 idiomatic Go 測試模式為 Go 程式碼強制執行測試驅動開發 (TDD) 方法論。

## 這是什麼指令 (What This Command Does)

1. **定義型別/介面**: 首先建立函式簽章支架
2. **撰寫 Table-Driven Tests**: 建立全面的測試案例 (RED)
3. **執行測試**: 驗證測試因正確的原因失敗
4. **實作程式碼**: 撰寫最小程式碼以通過 (GREEN)
5. **重構**: 改進同時保持測試綠燈
6. **檢查覆蓋率**: 確保 80% 以上覆蓋率

## 何時使用 (When to Use)

當需要以下情況時使用 `/go-test`：
- 實作新的 Go 函式
- 為現有程式碼新增測試覆蓋率
- 修復 bug (先寫失敗的測試)
- 建構關鍵業務邏輯
- 學習 Go 中的 TDD 工作流程

## TDD 循環 (TDD Cycle)

```
RED     → 撰寫失敗的 table-driven test
GREEN   → 實作最小程式碼以通過
REFACTOR → 改進程式碼，測試保持綠燈
REPEAT  → 下一個測試案例
```

## 使用情境範例 (Example Session)

```text
User: /go-test I need a function to validate email addresses

Agent:
# TDD Session: Email Validator

## Step 1: Define Interface

\`\`\`go
// validator/email.go
package validator

// ValidateEmail checks if the given string is a valid email address.
// Returns nil if valid, error describing the issue otherwise.
func ValidateEmail(email string) error {
    panic("not implemented")
}
\`\`\`

## Step 2: Write Table-Driven Tests (RED)

\`\`\`go
// validator/email_test.go
package validator

import (
    "testing"
)

func TestValidateEmail(t *testing.T) {
    tests := []struct {
        name    string
        email   string
        wantErr bool
    }{
        // Valid emails
        {"simple email", "user@example.com", false},
        {"with subdomain", "user@mail.example.com", false},
        {"with plus", "user+tag@example.com", false},
        {"with dots", "first.last@example.com", false},

        // Invalid emails
        {"empty string", "", true},
        {"no at sign", "userexample.com", true},
        {"no domain", "user@", true},
        {"no local part", "@example.com", true},
        {"double at", "user@@example.com", true},
        {"spaces", "user @example.com", true},
        {"no tld", "user@example", true},
    }

    for _, tt := range tests {
        t.Run(tt.name, func(t *testing.T) {
            err := ValidateEmail(tt.email)
            if tt.wantErr && err == nil {
                t.Errorf("ValidateEmail(%q) = nil; want error", tt.email)
            }
            if !tt.wantErr && err != nil {
                t.Errorf("ValidateEmail(%q) = %v; want nil", tt.email, err)
            }
        })
    }
}
\`\`\`

## Step 3: Run Tests - Verify FAIL

\`\`\`bash
$ go test ./validator/...

--- FAIL: TestValidateEmail (0.00s)
    --- FAIL: TestValidateEmail/simple_email (0.00s)
        panic: not implemented

FAIL
\`\`\`

✓ Tests fail as expected (panic).

## Step 4: Implement Minimal Code (GREEN)

\`\`\`go
// validator/email.go
package validator

import (
    "errors"
    "regexp"
)

var emailRegex = regexp.MustCompile(\`^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$\`)

var (
    ErrEmailEmpty   = errors.New("email cannot be empty")
    ErrEmailInvalid = errors.New("email format is invalid")
)

func ValidateEmail(email string) error {
    if email == "" {
        return ErrEmailEmpty
    }
    if !emailRegex.MatchString(email) {
        return ErrEmailInvalid
    }
    return nil
}
\`\`\`

## Step 5: Run Tests - Verify PASS

\`\`\`bash
$ go test ./validator/...

PASS
ok      project/validator    0.003s
\`\`\`

✓ All tests passing!

## Step 6: Check Coverage

\`\`\`bash
$ go test -cover ./validator/...

PASS
coverage: 100.0% of statements
ok      project/validator    0.003s
\`\`\`

✓ Coverage: 100%

## TDD Complete!
```

## 測試模式 (Test Patterns)

### Table-Driven Tests
```go
tests := []struct {
    name     string
    input    InputType
    want     OutputType
    wantErr  bool
}{
    {"case 1", input1, want1, false},
    {"case 2", input2, want2, true},
}

for _, tt := range tests {
    t.Run(tt.name, func(t *testing.T) {
        got, err := Function(tt.input)
        // assertions
    })
}
```

### 平行測試 (Parallel Tests)
```go
for _, tt := range tests {
    tt := tt // Capture
    t.Run(tt.name, func(t *testing.T) {
        t.Parallel()
        // test body
    })
}
```

### 測試輔助函式 (Test Helpers)
```go
func setupTestDB(t *testing.T) *sql.DB {
    t.Helper()
    db := createDB()
    t.Cleanup(func() { db.Close() })
    return db
}
```

## 覆蓋率指令 (Coverage Commands)

```bash
# Basic coverage
go test -cover ./...

# Coverage profile
go test -coverprofile=coverage.out ./...

# View in browser
go tool cover -html=coverage.out

# Coverage by function
go tool cover -func=coverage.out

# With race detection
go test -race -cover ./...
```

## 覆蓋率目標 (Coverage Targets)

| Code Type | Target |
|-----------|--------|
| Critical business logic | 100% |
| Public APIs | 90%+ |
| General code | 80%+ |
| Generated code | Exclude |

## TDD 最佳實踐 (TDD Best Practices)

**DO (做):**
- 在任何實作前**先**寫測試
- 每次變更後執行測試
- 使用 table-driven tests 以獲得全面覆蓋
- 測試行為，而非實作細節
- 包含邊緣情況 (empty, nil, max values)

**DON'T (不做):**
- 在測試前寫實作
- 跳過 RED 階段
- 直接測試私有函式
- 在測試中使用 `time.Sleep`
- 忽略不穩定測試

## 相關指令 (Related Commands)

- `/go-build` - 修復建置錯誤
- `/go-review` - 實作後審查程式碼
- `/verify` - 執行完整驗證循環

## 相關 (Related)

- Skill: `skills/golang-testing/`
- Skill: `skills/tdd-workflow/`
