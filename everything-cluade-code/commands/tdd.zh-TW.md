---
description: 強制執行測試驅動開發 (TDD) 工作流程。先建立介面支架，先產生測試，然後實作最小程式碼以通過測試。確保 80% 以上的覆蓋率。
---

# TDD Command

此指令調用 **tdd-guide** agent 以強制執行測試驅動開發方法論。

## 這是什麼指令 (What This Command Does)

1. **介面支架 (Scaffold Interfaces)** - 先定義型別/介面
2. **先產生測試 (Generate Tests First)** - 撰寫失敗的測試 (RED)
3. **實作最小程式碼 (Implement Minimal Code)** - 撰寫剛好足夠通過的程式碼 (GREEN)
4. **重構 (Refactor)** - 改進程式碼同時保持測試綠燈 (REFACTOR)
5. **驗證覆蓋率 (Verify Coverage)** - 確保 80% 以上測試覆蓋率

## 何時使用 (When to Use)

當需要以下情況時使用 `/tdd`：
- 實作新功能
- 新增新函式/組件
- 修復 bug (先寫重現 bug 的測試)
- 重構現有程式碼
- 建構關鍵業務邏輯

## 如何運作 (How It Works)

tdd-guide agent 將會：

1. 為輸入/輸出 **定義介面**
2. **撰寫將會失敗的測試** (因為程式碼還不存在)
3. **執行測試** 並驗證它們因正確的原因失敗
4. **撰寫最小實作** 以讓測試通過
5. **執行測試** 並驗證它們通過
6. **重構** 程式碼同時保持測試綠燈
7. **檢查覆蓋率** 如果低於 80% 則新增更多測試

## TDD 循環 (TDD Cycle)

```
RED → GREEN → REFACTOR → REPEAT

RED:      撰寫一個失敗的測試
GREEN:    撰寫最小程式碼以通過
REFACTOR: 改進程式碼，保持測試通過
REPEAT:   下一個功能/情境
```

## 使用範例 (Example Usage)

```
User: /tdd I need a function to calculate market liquidity score

Agent (tdd-guide):
# TDD Session: Market Liquidity Score Calculator

## Step 1: Define Interface (SCAFFOLD)

\`\`\`typescript
// lib/liquidity.ts
export interface MarketData {
  totalVolume: number
  bidAskSpread: number
  activeTraders: number
  lastTradeTime: Date
}

export function calculateLiquidityScore(market: MarketData): number {
  // TODO: Implementation
  throw new Error('Not implemented')
}
\`\`\`

## Step 2: Write Failing Test (RED)

\`\`\`typescript
// lib/liquidity.test.ts
import { calculateLiquidityScore } from './liquidity'

describe('calculateLiquidityScore', () => {
  it('should return high score for liquid market', () => {
    const market = {
      totalVolume: 100000,
      bidAskSpread: 0.01,
      activeTraders: 500,
      lastTradeTime: new Date()
    }

    const score = calculateLiquidityScore(market)

    expect(score).toBeGreaterThan(80)
    expect(score).toBeLessThanOrEqual(100)
  })

  it('should return low score for illiquid market', () => {
    const market = {
      totalVolume: 100,
      bidAskSpread: 0.5,
      activeTraders: 2,
      lastTradeTime: new Date(Date.now() - 86400000) // 1 day ago
    }

    const score = calculateLiquidityScore(market)

    expect(score).toBeLessThan(30)
    expect(score).toBeGreaterThanOrEqual(0)
  })

  it('should handle edge case: zero volume', () => {
    const market = {
      totalVolume: 0,
      bidAskSpread: 0,
      activeTraders: 0,
      lastTradeTime: new Date()
    }

    const score = calculateLiquidityScore(market)

    expect(score).toBe(0)
  })
})
\`\`\`

## Step 3: Run Tests - Verify FAIL

\`\`\`bash
npm test lib/liquidity.test.ts

FAIL lib/liquidity.test.ts
  ✕ should return high score for liquid market (2 ms)
    Error: Not implemented

1 test failed, 0 passed
\`\`\`

✅ Tests fail as expected. Ready to implement.

## Step 4: Implement Minimal Code (GREEN)

\`\`\`typescript
// lib/liquidity.ts
export function calculateLiquidityScore(market: MarketData): number {
  // Handle zero volume edge case
  if (market.totalVolume === 0) {
    return 0
  }

  // Calculate component scores (0-100 scale)
  const volumeScore = Math.min(market.totalVolume / 1000, 100)
  const spreadScore = Math.max(100 - (market.bidAskSpread * 1000), 0)
  const traderScore = Math.min(market.activeTraders / 10, 100)

  // Recent activity bonus
  const hoursSinceLastTrade = (Date.now() - market.lastTradeTime.getTime()) / (1000 * 60 * 60)
  const recencyScore = Math.max(100 - (hoursSinceLastTrade * 10), 0)

  // Weighted average
  const score = (
    volumeScore * 0.4 +
    spreadScore * 0.3 +
    traderScore * 0.2 +
    recencyScore * 0.1
  )

  return Math.min(Math.max(score, 0), 100) // Clamp to 0-100
}
\`\`\`

## Step 5: Run Tests - Verify PASS

\`\`\`bash
npm test lib/liquidity.test.ts

PASS lib/liquidity.test.ts
  ✓ should return high score for liquid market (3 ms)
  ✓ should return low score for illiquid market (2 ms)
  ✓ should handle edge case: zero volume (1 ms)

3 tests passed
\`\`\`

✅ All tests passing!

## Step 6: Refactor (IMPROVE)

\`\`\`typescript
// lib/liquidity.ts - Refactored with constants and better readability
const WEIGHTS = {
  VOLUME: 0.4,
  SPREAD: 0.3,
  TRADERS: 0.2,
  RECENCY: 0.1,
} as const

const SCALE_FACTORS = {
  VOLUME: 1000,
  SPREAD: 1000,
  TRADERS: 10,
  RECENCY_PENALTY: 10,
} as const

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

export function calculateLiquidityScore(market: MarketData): number {
  if (market.totalVolume === 0) return 0

  const volumeScore = Math.min(market.totalVolume / SCALE_FACTORS.VOLUME, 100)
  const spreadScore = clamp(100 - (market.bidAskSpread * SCALE_FACTORS.SPREAD), 0, 100)
  const traderScore = Math.min(market.activeTraders / SCALE_FACTORS.TRADERS, 100)

  const hoursSinceLastTrade = (Date.now() - market.lastTradeTime.getTime()) / (1000 * 60 * 60)
  const recencyScore = clamp(100 - (hoursSinceLastTrade * SCALE_FACTORS.RECENCY_PENALTY), 0, 100)

  const weightedScore =
    volumeScore * WEIGHTS.VOLUME +
    spreadScore * WEIGHTS.SPREAD +
    traderScore * WEIGHTS.TRADERS +
    recencyScore * WEIGHTS.RECENCY

  return clamp(weightedScore, 0, 100)
}
\`\`\`

## Step 7: Verify Tests Still Pass

\`\`\`bash
npm test lib/liquidity.test.ts

PASS lib/liquidity.test.ts
  ✓ should return high score for liquid market (3 ms)
  ✓ should return low score for illiquid market (2 ms)
  ✓ should handle edge case: zero volume (1 ms)

3 tests passed
\`\`\`

✅ Refactoring complete, tests still passing!

## Step 8: Check Coverage

\`\`\`bash
npm test -- --coverage lib/liquidity.test.ts

File           | % Stmts | % Branch | % Funcs | % Lines
---------------|---------|----------|---------|--------
liquidity.ts   |   100   |   100    |   100   |   100

Coverage: 100% ✅ (Target: 80%)
\`\`\`

✅ TDD session complete!
```

## TDD 最佳實踐 (TDD Best Practices)

**DO (做):**
- ✅ 在任何實作前**先**寫測試
- ✅ 在實作前執行測試並確認它們**失敗**
- ✅ 撰寫最小程式碼以讓測試通過
- ✅ 僅在測試綠燈後重構
- ✅ 新增邊緣情況與錯誤情境
- ✅ 目標覆蓋率 80% 以上 (關鍵程式碼 100%)

**DON'T (不做):**
- ❌ 在測試前寫實作
- ❌ 跳過每次變更後執行測試
- ❌ 一次寫太多程式碼
- ❌ 忽略失敗的測試
- ❌ 測試實作細節 (要測試行為)
- ❌ Mock 所有東西 (偏好整合測試)

## 包含的測試類型 (Test Types to Include)

**單元測試 (Unit Tests)** (函式級別):
- 快樂路徑情境
- 邊緣情況 (空, null, 最大值)
- 錯誤條件
- 邊界值

**整合測試 (Integration Tests)** (組件級別):
- API 端點
- 資料庫操作
- 外部服務呼叫
- 帶有 hooks 的 React 組件

**E2E 測試 (E2E Tests)** (使用 `/e2e` 指令):
- 關鍵使用者流程
- 多步驟程序
- 全端整合

## 覆蓋率需求 (Coverage Requirements)

- 所有程式碼 **最低 80%**
- 以下情況 **要求 100%**：
  - 金融計算
  - 認證邏輯
  - 安全關鍵程式碼
  - 核心業務邏輯

## 重要事項 (Important Notes)

**強制性 (MANDATORY)**: 測試必須在實作**之前**撰寫。TDD 循環是：

1. **RED** - 撰寫失敗的測試
2. **GREEN** - 實作以通過
3. **REFACTOR** - 改進程式碼

絕不跳過 RED 階段。絕不在測試前寫程式碼。

## 與其他指令的整合

- 先使用 `/plan` 了解要建構什麼
- 使用 `/tdd` 進行帶測試的實作
- 如果發生建置錯誤使用 `/build-and-fix`
- 使用 `/code-review` 審查實作
- 使用 `/test-coverage` 驗證覆蓋率

## 相關 Agents

此指令調用位於以下位置的 `tdd-guide` agent：
`~/.claude/agents/tdd-guide.md`

並可參考位於以下位置的 `tdd-workflow` skill：
`~/.claude/skills/tdd-workflow/`
