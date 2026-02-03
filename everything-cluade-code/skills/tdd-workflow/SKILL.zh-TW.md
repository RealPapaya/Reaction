---
name: tdd-workflow
description: 在撰寫新功能、修復 Bug 或重構程式碼時使用此技能。強制執行測試驅動開發 (TDD)，並要求包括單元、整合與 E2E 測試在內的 80% 以上覆蓋率。
---

# Test-Driven Development Workflow

此技能確保所有程式碼開發遵循 TDD 原則，並具備全面的測試覆蓋。

## 何時啟用 (When to Activate)

- 撰寫新功能或機能時
- 修復 Bug 或問題時
- 重構現有程式碼時
- 新增 API 端點時
- 建立新組件時

## 核心原則 (Core Principles)

### 1. 程式碼之前先寫測試 (Tests BEFORE Code)
務必先寫測試，然後實作程式碼以通過測試。

### 2. 覆蓋率需求 (Coverage Requirements)
- 最低 80% 覆蓋率 (單元 + 整合 + E2E)
- 覆蓋所有邊界情況 (Edge cases)
- 測試錯誤情境
- 驗證邊界條件

### 3. 測試類型 (Test Types)

#### 單元測試 (Unit Tests)
- 個別函式與工具
- 組件邏輯
- 純函式 (Pure functions)
- Helpers 與 Utilities

#### 整合測試 (Integration Tests)
- API 端點
- 資料庫操作
- 服務互動
- 外部 API 呼叫

#### E2E 測試 (Playwright)
- 關鍵使用者流程
- 完整工作流程
- 瀏覽器自動化
- UI 互動

## TDD 工作流程步驟 (TDD Workflow Steps)

### 步驟 1: 撰寫使用者旅程 (Write User Journeys)
```
As a [role], I want to [action], so that [benefit]

Example:
As a user, I want to search for markets semantically,
so that I can find relevant markets even without exact keywords.
```

### 步驟 2: 產生測試案例 (Generate Test Cases)
為每個使用者旅程建立全面的測試案例：

```typescript
describe('Semantic Search', () => {
  it('returns relevant markets for query', async () => {
    // Test implementation
  })

  it('handles empty query gracefully', async () => {
    // Test edge case
  })

  it('falls back to substring search when Redis unavailable', async () => {
    // Test fallback behavior
  })

  it('sorts results by similarity score', async () => {
    // Test sorting logic
  })
})
```

### 步驟 3: 執行測試 (它們應該失敗) (Run Tests)
```bash
npm test
# Tests should fail - we haven't implemented yet
```

### 步驟 4: 實作程式碼 (Implement Code)
撰寫最小程式碼以通過測試：

```typescript
// Implementation guided by tests
export async function searchMarkets(query: string) {
  // Implementation here
}
```

### 步驟 5: 再次執行測試 (Run Tests Again)
```bash
npm test
# Tests should now pass
```

### 步驟 6: 重構 (Refactor)
在保持測試通過的情況下改善程式碼品質：
- 移除重複
- 改善命名
- 優化效能
- 增強可讀性

### 步驟 7: 驗證覆蓋率 (Verify Coverage)
```bash
npm run test:coverage
# Verify 80%+ coverage achieved
```

## 測試模式 (Testing Patterns)

### 單元測試模式 (Unit Test Pattern) (Jest/Vitest)
```typescript
import { render, screen, fireEvent } from '@testing-library/react'
import { Button } from './Button'

describe('Button Component', () => {
  it('renders with correct text', () => {
    render(<Button>Click me</Button>)
    expect(screen.getByText('Click me')).toBeInTheDocument()
  })

  it('calls onClick when clicked', () => {
    const handleClick = jest.fn()
    render(<Button onClick={handleClick}>Click</Button>)

    fireEvent.click(screen.getByRole('button'))

    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  it('is disabled when disabled prop is true', () => {
    render(<Button disabled>Click</Button>)
    expect(screen.getByRole('button')).toBeDisabled()
  })
})
```

### API 整合測試模式 (API Integration Test Pattern)
```typescript
import { NextRequest } from 'next/server'
import { GET } from './route'

describe('GET /api/markets', () => {
  it('returns markets successfully', async () => {
    const request = new NextRequest('http://localhost/api/markets')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(Array.isArray(data.data)).toBe(true)
  })

  it('validates query parameters', async () => {
    const request = new NextRequest('http://localhost/api/markets?limit=invalid')
    const response = await GET(request)

    expect(response.status).toBe(400)
  })

  it('handles database errors gracefully', async () => {
    // Mock database failure
    const request = new NextRequest('http://localhost/api/markets')
    // Test error handling
  })
})
```

### E2E 測試模式 (E2E Test Pattern) (Playwright)
```typescript
import { test, expect } from '@playwright/test'

test('user can search and filter markets', async ({ page }) => {
  // Navigate to markets page
  await page.goto('/')
  await page.click('a[href="/markets"]')

  // Verify page loaded
  await expect(page.locator('h1')).toContainText('Markets')

  // Search for markets
  await page.fill('input[placeholder="Search markets"]', 'election')

  // Wait for debounce and results
  await page.waitForTimeout(600)

  // Verify search results displayed
  const results = page.locator('[data-testid="market-card"]')
  await expect(results).toHaveCount(5, { timeout: 5000 })

  // Verify results contain search term
  const firstResult = results.first()
  await expect(firstResult).toContainText('election', { ignoreCase: true })

  // Filter by status
  await page.click('button:has-text("Active")')

  // Verify filtered results
  await expect(results).toHaveCount(3)
})

test('user can create a new market', async ({ page }) => {
  // Login first
  await page.goto('/creator-dashboard')

  // Fill market creation form
  await page.fill('input[name="name"]', 'Test Market')
  await page.fill('textarea[name="description"]', 'Test description')
  await page.fill('input[name="endDate"]', '2025-12-31')

  // Submit form
  await page.click('button[type="submit"]')

  // Verify success message
  await expect(page.locator('text=Market created successfully')).toBeVisible()

  // Verify redirect to market page
  await expect(page).toHaveURL(/\/markets\/test-market/)
})
```

## 測試檔案組織 (Test File Organization)

```
src/
├── components/
│   ├── Button/
│   │   ├── Button.tsx
│   │   ├── Button.test.tsx          # Unit tests
│   │   └── Button.stories.tsx       # Storybook
│   └── MarketCard/
│       ├── MarketCard.tsx
│       └── MarketCard.test.tsx
├── app/
│   └── api/
│       └── markets/
│           ├── route.ts
│           └── route.test.ts         # Integration tests
└── e2e/
    ├── markets.spec.ts               # E2E tests
    ├── trading.spec.ts
    └── auth.spec.ts
```

## Mocking 外部服務 (Mocking External Services)

### Supabase Mock
```typescript
jest.mock('@/lib/supabase', () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => Promise.resolve({
          data: [{ id: 1, name: 'Test Market' }],
          error: null
        }))
      }))
    }))
  }
}))
```

### Redis Mock
```typescript
jest.mock('@/lib/redis', () => ({
  searchMarketsByVector: jest.fn(() => Promise.resolve([
    { slug: 'test-market', similarity_score: 0.95 }
  ])),
  checkRedisHealth: jest.fn(() => Promise.resolve({ connected: true }))
}))
```

### OpenAI Mock
```typescript
jest.mock('@/lib/openai', () => ({
  generateEmbedding: jest.fn(() => Promise.resolve(
    new Array(1536).fill(0.1) // Mock 1536-dim embedding
  ))
}))
```

## 測試覆蓋率驗證 (Test Coverage Verification)

### 執行覆蓋率報告 (Run Coverage Report)
```bash
npm run test:coverage
```

### 覆蓋率閾值 (Coverage Thresholds)
```json
{
  "jest": {
    "coverageThresholds": {
      "global": {
        "branches": 80,
        "functions": 80,
        "lines": 80,
        "statements": 80
      }
    }
  }
}
```

## 應避免的常見測試錯誤 (Common Testing Mistakes to Avoid)

### ❌ 錯誤：測試實作細節 (Testing Implementation Details)
```typescript
// Don't test internal state
expect(component.state.count).toBe(5)
```

### ✅ 正確：測試使用者可見的行為 (Test User-Visible Behavior)
```typescript
// Test what users see
expect(screen.getByText('Count: 5')).toBeInTheDocument()
```

### ❌ 錯誤：脆弱的選擇器 (Brittle Selectors)
```typescript
// Breaks easily
await page.click('.css-class-xyz')
```

### ✅ 正確：語意化選擇器 (Semantic Selectors)
```typescript
// Resilient to changes
await page.click('button:has-text("Submit")')
await page.click('[data-testid="submit-button"]')
```

### ❌ 錯誤：測試未隔離 (No Test Isolation)
```typescript
// Tests depend on each other
test('creates user', () => { /* ... */ })
test('updates same user', () => { /* depends on previous test */ })
```

### ✅ 正確：獨立測試 (Independent Tests)
```typescript
// Each test sets up its own data
test('creates user', () => {
  const user = createTestUser()
  // Test logic
})

test('updates user', () => {
  const user = createTestUser()
  // Update logic
})
```

## 持續測試 (Continuous Testing)

### 開發期間的 Watch Mode
```bash
npm test -- --watch
# Tests run automatically on file changes
```

### Pre-Commit Hook
```bash
# Runs before every commit
npm test && npm run lint
```

### CI/CD 整合
```yaml
# GitHub Actions
- name: Run Tests
  run: npm test -- --coverage
- name: Upload Coverage
  uses: codecov/codecov-action@v3
```

## 最佳實踐 (Best Practices)

1. **先寫測試** - 始終遵循 TDD
2. **每個測試一個斷言** - 專注於單一行為
3. **描述性測試名稱** - 解釋測試內容
4. **Arrange-Act-Assert** - 清晰的測試結構
5. **Mock 外部相依** - 隔離單元測試
6. **測試邊界情況** - Null, undefined, empty, large
7. **測試錯誤路徑** - 不僅僅是快樂路徑
8. **保持測試快速** - 每個單元測試 < 50ms
9. **測試後清理** - 無副作用
10. **審查覆蓋率報告** - 識別缺口

## 成功指標 (Success Metrics)

- 達到 80%+ 程式碼覆蓋率
- 所有測試通過 (綠色)
- 沒有跳過或禁用的測試
- 快速測試執行 (單元測試 < 30s)
- E2E 測試覆蓋關鍵使用者流程
- 測試在生產之前捕捉到 Bug

---

**請記住**：測試不是可選的。它們是安全網，能實現有信心的重構、快速開發與生產可靠性。
