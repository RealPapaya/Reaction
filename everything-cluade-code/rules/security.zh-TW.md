# 安全性準則 (Security Guidelines)

## 強制性安全檢查

在**任何**提交之前：
- [ ] 無寫死 (hardcoded) 的秘密 (API keys, 密碼, tokens)
- [ ] 所有使用者輸入皆已驗證
- [ ] 防止 SQL 注入 (參數化查詢)
- [ ] 防止 XSS (消毒 HTML)
- [ ] 啟用 CSRF 保護
- [ ] 驗證 認證/授權 (Authentication/authorization)
- [ ] 所有端點 (endpoints) 的速率限制 (Rate limiting)
- [ ] 錯誤訊息不洩漏敏感資料

## 秘密管理 (Secret Management)

```typescript
// 絕不 (NEVER): 寫死的秘密
const apiKey = "sk-proj-xxxxx"

// 始終 (ALWAYS): 環境變數
const apiKey = process.env.OPENAI_API_KEY

if (!apiKey) {
  throw new Error('OPENAI_API_KEY not configured')
}
```

## 安全回應協定 (Security Response Protocol)

如果發現安全問題：
1. 立即停止
2. 使用 **security-reviewer** agent
3. 在繼續前修復 **CRITICAL** (嚴重) 問題
4. 輪換任何暴露的秘密
5. 審查整個程式碼庫是否有類似問題
