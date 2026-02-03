# Code Review

對未提交的變更進行全面的安全性與品質審查：

1. 取得變更的檔案：git diff --name-only HEAD

2. 對於每個變更的檔案，檢查：

**安全性議題 (嚴重 CRITICAL):**
- 寫死的憑證、API 金鑰、tokens
- SQL 注入漏洞
- XSS 漏洞
- 遺漏輸入驗證
- 不安全的依賴項目
- 路徑遍歷風險

**程式碼品質 (高 HIGH):**
- 函式 > 50 行
- 檔案 > 800 行
- 巢狀深度 > 4 層
- 遺漏錯誤處理
- console.log 語句
- TODO/FIXME 註釋
- 公開 API 遺漏 JSDoc

**最佳實踐 (中 MEDIUM):**
- 變異模式 (mutation patterns) (改用不可變)
- 程式碼/註釋中使用 Emoji
- 新程式碼遺漏測試
- 無障礙性議題 (a11y)

3. 產生報告包含：
   - 嚴重性：臨界、高、中、低
   - 檔案位置與行號
   - 議題描述
   - 建議修復

4. 如果發現 CRITICAL 或 HIGH 議題，阻擋 commit

絕不核准有安全漏洞的程式碼！
