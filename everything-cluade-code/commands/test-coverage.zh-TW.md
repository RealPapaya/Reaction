# Test Coverage

分析測試覆蓋率並產生遺漏的測試：

1. 執行帶有覆蓋率的測試：npm test --coverage 或 pnpm test --coverage

2. 分析覆蓋率報告 (coverage/coverage-summary.json)

3. 識別低於 80% 覆蓋率門檻的檔案

4. 對於每個覆蓋率不足的檔案：
   - 分析未測試的程式碼路徑
   - 為函式產生單元測試
   - 為 API 產生整合測試
   - 為關鍵流程產生 E2E 測試

5. 驗證新測試通過

6. 顯示 之前/之後 的覆蓋率指標

7. 確保專案達到 80% 以上的整體覆蓋率

專注於：
- 快樂路徑情境
- 錯誤處理
- 邊緣情況 (null, undefined, empty)
- 邊界條件
