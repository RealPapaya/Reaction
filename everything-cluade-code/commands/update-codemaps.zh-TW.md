# Update Codemaps

分析程式碼庫結構並更新架構文件：

1. 掃描所有原始碼檔案的 imports, exports 與依賴關係
2. 產生節省 token 的 codemaps，格式如下：
   - codemaps/architecture.md - 整體架構
   - codemaps/backend.md - 後端結構
   - codemaps/frontend.md - 前端結構
   - codemaps/data.md - 資料模型與 schemas

3. 計算與前一版本的差異百分比
4. 如果變更 > 30%，在更新前請求使用者核准
5. 為每個 codemap 新增新鮮度時間戳記
6. 將報告儲存至 .reports/codemap-diff.txt

使用 TypeScript/Node.js 進行分析。專注於高階結構，而非實作細節。
