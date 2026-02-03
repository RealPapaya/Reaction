# 測試要求 (Testing Requirements)

## 最低測試覆蓋率: 80%

測試類型 (全部都需要):
1. **單元測試 (Unit Tests)** - 個別函式、工具、組件
2. **整合測試 (Integration Tests)** - API 端點、資料庫操作
3. **E2E 測試** - 關鍵使用者流程 (Playwright)

## 測試驅動開發 (Test-Driven Development)

強制性工作流程：
1. 先寫測試 (RED)
2. 執行測試 - 它應該失敗 (FAIL)
3. 寫最小實作 (GREEN)
4. 執行測試 - 它應該通過 (PASS)
5. 重構 (IMPROVE)
6. 驗證覆蓋率 (80%+)

## 測試失敗疑難排解

1. 使用 **tdd-guide** agent
2. 檢查測試隔離
3. 驗證 mocks 是否正確
4. 修復實作，而非測試 (除非測試錯了)

## Agent 支援

- **tdd-guide** - 對新功能 **主動** 使用，強制執行先寫測試
- **e2e-runner** - Playwright E2E 測試專家
