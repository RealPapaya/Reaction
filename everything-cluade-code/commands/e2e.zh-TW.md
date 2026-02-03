---
description: 使用 Playwright 產生並執行端對端 (E2E) 測試。建立測試旅程 (journeys)、執行測試、捕捉截圖/影片/traces，並上傳 artifacts。
---

# E2E Command

此指令調用 **e2e-runner** agent，使用 Playwright 來產生、維護並執行端對端測試。

## 這是什麼指令 (What This Command Does)

1. **產生測試旅程 (Generate Test Journeys)** - 為使用者流程建立 Playwright 測試
2. **執行 E2E 測試 (Run E2E Tests)** - 跨瀏覽器執行測試
3. **捕捉 Artifacts (Capture Artifacts)** - 失敗時捕捉截圖、影片、traces
4. **上傳結果 (Upload Results)** - HTML 報告與 JUnit XML
5. **識別不穩定測試 (Identify Flaky Tests)** - 隔離不穩定的測試

## 何時使用 (When to Use)

當需要以下情況時使用 `/e2e`：
- 測試關鍵使用者旅程 (登入、交易、付款)
- 驗證多步驟流程能端對端運作
- 測試 UI 互動與導航
- 驗證前端與後端之間的整合
- 準備生產環境部署

## 如何運作 (How It Works)

e2e-runner agent 將會：

1. **分析使用者流程** 並識別測試情境
2. 使用 Page Object Model 模式 **產生 Playwright 測試**
3. 跨多個瀏覽器 (Chrome, Firefox, Safari) **執行測試**
4. 透過截圖、影片和 traces **捕捉失敗**
5. **產生報告** 包含結果與 artifacts
6. **識別不穩定測試** 並建議修復

## 使用範例 (Example Usage)

```
User: /e2e Test the market search and view flow

Agent (e2e-runner):
# E2E Test Generation: Market Search and View Flow

## Test Scenario Identified

**User Journey:** Market Search → View Results → Click Market → View Details

**Test Coverage:**
1. Navigate to markets page
2. Perform semantic search
3. Verify search results
4. Click on first result
5. Verify market details page loads
6. Verify chart renders

## Generated Test Code

\`\`\`typescript
// tests/e2e/markets/search-and-view.spec.ts
import { test, expect } from '@playwright/test'
import { MarketsPage } from '../../pages/MarketsPage'
import { MarketDetailsPage } from '../../pages/MarketDetailsPage'

test.describe('Market Search and View Flow', () => {
  test('user can search markets and view details', async ({ page }) => {
    // 1. Navigate to markets page
    const marketsPage = new MarketsPage(page)
    await marketsPage.goto()

    // Verify page loaded
    await expect(page).toHaveTitle(/Markets/)
    await expect(page.locator('h1')).toContainText('Markets')

    // 2. Perform semantic search
    await marketsPage.searchMarkets('election')

    // Wait for API response
    await page.waitForResponse(resp =>
      resp.url().includes('/api/markets/search') && resp.status() === 200
    )

    // 3. Verify search results
    const marketCards = marketsPage.marketCards
    await expect(marketCards.first()).toBeVisible()
    const resultCount = await marketCards.count()
    expect(resultCount).toBeGreaterThan(0)

    // Take screenshot of search results
    await page.screenshot({ path: 'artifacts/search-results.png' })

    // 4. Click on first result
    const firstMarketTitle = await marketCards.first().textContent()
    await marketCards.first().click()

    // 5. Verify market details page loads
    await expect(page).toHaveURL(/\/markets\/[a-z0-9-]+/)

    const detailsPage = new MarketDetailsPage(page)
    await expect(detailsPage.marketName).toBeVisible()
    await expect(detailsPage.marketDescription).toBeVisible()

    // 6. Verify chart renders
    await expect(detailsPage.priceChart).toBeVisible()

    // Verify market name matches
    const detailsTitle = await detailsPage.marketName.textContent()
    expect(detailsTitle?.toLowerCase()).toContain(
      firstMarketTitle?.toLowerCase().substring(0, 20) || ''
    )

    // Take screenshot of market details
    await page.screenshot({ path: 'artifacts/market-details.png' })
  })

  test('search with no results shows empty state', async ({ page }) => {
    const marketsPage = new MarketsPage(page)
    await marketsPage.goto()

    // Search for non-existent market
    await marketsPage.searchMarkets('xyznonexistentmarket123456')

    // Verify empty state
    await expect(page.locator('[data-testid="no-results"]')).toBeVisible()
    await expect(page.locator('[data-testid="no-results"]')).toContainText(
      /no.*results|no.*markets/i
    )

    const marketCount = await marketsPage.marketCards.count()
    expect(marketCount).toBe(0)
  })

  test('can clear search and see all markets again', async ({ page }) => {
    const marketsPage = new MarketsPage(page)
    await marketsPage.goto()

    // Initial market count
    const initialCount = await marketsPage.marketCards.count()

    // Perform search
    await marketsPage.searchMarkets('trump')
    await page.waitForLoadState('networkidle')

    // Verify filtered results
    const filteredCount = await marketsPage.marketCards.count()
    expect(filteredCount).toBeLessThan(initialCount)

    // Clear search
    await marketsPage.searchInput.clear()
    await page.waitForLoadState('networkidle')

    // Verify all markets shown again
    const finalCount = await marketsPage.marketCards.count()
    expect(finalCount).toBe(initialCount)
  })
})
\`\`\`

## Running Tests

\`\`\`bash
# Run the generated test
npx playwright test tests/e2e/markets/search-and-view.spec.ts

Running 3 tests using 3 workers

  ✓  [chromium] › search-and-view.spec.ts:5:3 › user can search markets and view details (4.2s)
  ✓  [chromium] › search-and-view.spec.ts:52:3 › search with no results shows empty state (1.8s)
  ✓  [chromium] › search-and-view.spec.ts:67:3 › can clear search and see all markets again (2.9s)

  3 passed (9.1s)

Artifacts generated:
- artifacts/search-results.png
- artifacts/market-details.png
- playwright-report/index.html
\`\`\`

## Test Report

\`\`\`
╔══════════════════════════════════════════════════════════════╗
║                    E2E Test Results                          ║
╠══════════════════════════════════════════════════════════════╣
║ Status:     ✅ ALL TESTS PASSED                              ║
║ Total:      3 tests                                          ║
║ Passed:     3 (100%)                                         ║
║ Failed:     0                                                ║
║ Flaky:      0                                                ║
║ Duration:   9.1s                                             ║
╚══════════════════════════════════════════════════════════════╝

Artifacts:
📸 Screenshots: 2 files
📹 Videos: 0 files (only on failure)
🔍 Traces: 0 files (only on failure)
📊 HTML Report: playwright-report/index.html

View report: npx playwright show-report
\`\`\`

✅ E2E test suite ready for CI/CD integration!
```

## 測試 Artifacts (Test Artifacts)

當測試執行時，以下 artifacts 會被捕捉：

**所有測試 (On All Tests):**
- HTML 報告包含時間軸與結果
- 用於 CI 整合的 JUnit XML

**僅失敗時 (On Failure Only):**
- 失敗狀態的截圖
- 測試的影片錄製
- 用於除錯的 trace 檔案 (逐步重播)
- 網路日誌
- Console log

## 檢視 Artifacts (Viewing Artifacts)

```bash
# View HTML report in browser
npx playwright show-report

# View specific trace file
npx playwright show-trace artifacts/trace-abc123.zip

# Screenshots are saved in artifacts/ directory
open artifacts/search-results.png
```

## 不穩定測試偵測 (Flaky Test Detection)

如果測試間歇性失敗：

```
⚠️  FLAKY TEST DETECTED: tests/e2e/markets/trade.spec.ts

Test passed 7/10 runs (70% pass rate)

Common failure:
"Timeout waiting for element '[data-testid="confirm-btn"]'"

Recommended fixes:
1. Add explicit wait: await page.waitForSelector('[data-testid="confirm-btn"]')
2. Increase timeout: { timeout: 10000 }
3. Check for race conditions in component
4. Verify element is not hidden by animation

Quarantine recommendation: Mark as test.fixme() until fixed
```

## 瀏覽器設定 (Browser Configuration)

測試預設在多個瀏覽器上執行：
- ✅ Chromium (Desktop Chrome)
- ✅ Firefox (Desktop)
- ✅ WebKit (Desktop Safari)
- ✅ Mobile Chrome (optional)

在 `playwright.config.ts` 中設定以調整瀏覽器。

## CI/CD 整合 (CI/CD Integration)

新增至您的 CI pipeline：

```yaml
# .github/workflows/e2e.yml
- name: Install Playwright
  run: npx playwright install --with-deps

- name: Run E2E tests
  run: npx playwright test

- name: Upload artifacts
  if: always()
  uses: actions/upload-artifact@v3
  with:
    name: playwright-report
    path: playwright-report/
```

## PMX 特定關鍵流程 (PMX-Specific Critical Flows)

對於 PMX，優先考量這些 E2E 測試：

**🔴 嚴重 (CRITICAL - 必須總是通過):**
1. 使用者可連接錢包
2. 使用者可瀏覽市場
3. 使用者可搜尋市場 (語義搜尋)
4. 使用者可檢視市場詳情
5. 使用者可下單交易 (使用測試資金)
6. 市場正確解決 (Resolve)
7. 使用者可提款

**🟡 重要 (IMPORTANT):**
1. 市場建立流程
2. 使用者個人檔案更新
3. 即時價格更新
4. 圖表渲染
5. 篩選與排序市場
6. 行動版響應式版面配置

## 最佳實踐 (Best Practices)

**DO (做):**
- ✅ 使用 Page Object Model 以利維護
- ✅ 使用 data-testid 屬性於選擇器
- ✅ 等待 API 回應，而非任意的 timeout
- ✅ 端對端測試關鍵使用者旅程
- ✅ 在合併到 main 之前執行測試
- ✅ 測試失敗時審查 artifacts

**DON'T (不做):**
- ❌ 使用脆弱的選擇器 (CSS classes 會變)
- ❌ 測試實作細節
- ❌ 對生產環境執行測試
- ❌ 忽略不穩定測試
- ❌ 失敗時跳過 artifacts 審查
- ❌ 用 E2E 測試每一個邊緣情況 (使用單元測試)

## 重要事項 (Important Notes)

**PMX 嚴重事項 (CRITICAL for PMX):**
- 涉及真實金錢的 E2E 測試**必須**只在 testnet/staging 執行
- 絕不對生產環境執行交易測試
- 對於金融測試設定 `test.skip(process.env.NODE_ENV === 'production')`
- 僅使用測試錢包與少量測試資金

## 與其他指令的整合

- 先使用 `/plan` 以識別要測試的關鍵旅程
- 使用 `/tdd` 進行單元測試 (更快、更細粒度)
- 使用 `/e2e` 進行整合與使用者旅程測試
- 使用 `/code-review` 驗證測試品質

## 相關 Agents

此指令調用位於以下位置的 `e2e-runner` agent：
`~/.claude/agents/e2e-runner.md`

## 快速指令 (Quick Commands)

```bash
# Run all E2E tests
npx playwright test

# Run specific test file
npx playwright test tests/e2e/markets/search.spec.ts

# Run in headed mode (see browser)
npx playwright test --headed

# Debug test
npx playwright test --debug

# Generate test code
npx playwright codegen http://localhost:3000

# View report
npx playwright show-report
```
