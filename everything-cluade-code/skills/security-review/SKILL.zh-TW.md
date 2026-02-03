---
name: security-review
description: 當新增認證、處理使用者輸入、使用機密資訊 (secrets)、建立 API 端點或實作支付/敏感功能時使用此技能。提供全面的安全性檢查清單與模式。
---

# Security Review Skill

此技能確保所有程式碼遵循安全性最佳實踐，並識別潛在的弱點。

## 何時啟用 (When to Activate)

- 實作認證 (authentication) 或授權 (authorization) 時
- 處理使用者輸入或檔案上傳時
- 建立新的 API 端點時
- 處理機密資訊 (secrets) 或憑證 (credentials) 時
- 實作支付功能時
- 儲存或傳輸敏感資料時
- 整合第三方 API 時

## 安全性檢查清單 (Security Checklist)

### 1. 機密資訊管理 (Secrets Management)

#### ❌ 絕對不要這樣做 (NEVER Do This)
```typescript
const apiKey = "sk-proj-xxxxx"  // Hardcoded secret
const dbPassword = "password123" // In source code
```

#### ✅ 務必這樣做 (ALWAYS Do This)
```typescript
const apiKey = process.env.OPENAI_API_KEY
const dbUrl = process.env.DATABASE_URL

// Verify secrets exist
if (!apiKey) {
  throw new Error('OPENAI_API_KEY not configured')
}
```

#### 驗證步驟 (Verification Steps)
- [ ] 沒有硬編碼的 API keys、tokens 或密碼
- [ ] 所有機密資訊都在環境變數中
- [ ] `.env.local` 已在 .gitignore 中
- [ ] Git 記錄中沒有機密資訊
- [ ] 生產環境機密資訊已在託管平台 (Vercel, Railway) 中設定

### 2. 輸入驗證 (Input Validation)

#### 務必驗證使用者輸入 (Always Validate User Input)
```typescript
import { z } from 'zod'

// Define validation schema
const CreateUserSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1).max(100),
  age: z.number().int().min(0).max(150)
})

// Validate before processing
export async function createUser(input: unknown) {
  try {
    const validated = CreateUserSchema.parse(input)
    return await db.users.create(validated)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, errors: error.errors }
    }
    throw error
  }
}
```

#### 檔案上傳驗證 (File Upload Validation)
```typescript
function validateFileUpload(file: File) {
  // Size check (5MB max)
  const maxSize = 5 * 1024 * 1024
  if (file.size > maxSize) {
    throw new Error('File too large (max 5MB)')
  }

  // Type check
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif']
  if (!allowedTypes.includes(file.type)) {
    throw new Error('Invalid file type')
  }

  // Extension check
  const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif']
  const extension = file.name.toLowerCase().match(/\.[^.]+$/)?.[0]
  if (!extension || !allowedExtensions.includes(extension)) {
    throw new Error('Invalid file extension')
  }

  return true
}
```

#### 驗證步驟 (Verification Steps)
- [ ] 所有使用者輸入皆使用 schema 驗證
- [ ] 檔案上傳有限制 (大小, 類型, 副檔名)
- [ ] 沒有在查詢中直接使用使用者輸入
- [ ] 白名單驗證 (非黑名單)
- [ ] 錯誤訊息不會洩漏敏感資訊

### 3. SQL 注入預防 (SQL Injection Prevention)

#### ❌ 絕對不要串接 SQL (NEVER Concatenate SQL)
```typescript
// DANGEROUS - SQL Injection vulnerability
const query = `SELECT * FROM users WHERE email = '${userEmail}'`
await db.query(query)
```

#### ✅ 務必使用參數化查詢 (ALWAYS Use Parameterized Queries)
```typescript
// Safe - parameterized query
const { data } = await supabase
  .from('users')
  .select('*')
  .eq('email', userEmail)

// Or with raw SQL
await db.query(
  'SELECT * FROM users WHERE email = $1',
  [userEmail]
)
```

#### 驗證步驟 (Verification Steps)
- [ ] 所有資料庫查詢皆使用參數化查詢
- [ ] SQL 中沒有字串串接
- [ ] 正確使用 ORM/Query Builder
- [ ] Supabase 查詢已正確清理 (sanitized)

### 4. 認證與授權 (Authentication & Authorization)

#### JWT Token 處理 (JWT Token Handling)
```typescript
// ❌ WRONG: localStorage (vulnerable to XSS)
localStorage.setItem('token', token)

// ✅ CORRECT: httpOnly cookies
res.setHeader('Set-Cookie',
  `token=${token}; HttpOnly; Secure; SameSite=Strict; Max-Age=3600`)
```

#### 授權檢查 (Authorization Checks)
```typescript
export async function deleteUser(userId: string, requesterId: string) {
  // ALWAYS verify authorization first
  const requester = await db.users.findUnique({
    where: { id: requesterId }
  })

  if (requester.role !== 'admin') {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 403 }
    )
  }

  // Proceed with deletion
  await db.users.delete({ where: { id: userId } })
}
```

#### Row Level Security (Supabase)
```sql
-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Users can only view their own data
CREATE POLICY "Users view own data"
  ON users FOR SELECT
  USING (auth.uid() = id);

-- Users can only update their own data
CREATE POLICY "Users update own data"
  ON users FOR UPDATE
  USING (auth.uid() = id);
```

#### 驗證步驟 (Verification Steps)
- [ ] Token 儲存在 httpOnly cookies (非 localStorage)
- [ ] 敏感操作前有授權檢查
- [ ] Supabase 中已啟用 Row Level Security
- [ ] 實作基於角色的存取控制 (RBAC)
- [ ] 工作階段管理 (Session management) 安全

### 5. XSS 預防 (XSS Prevention)

#### 清理 HTML (Sanitize HTML)
```typescript
import DOMPurify from 'isomorphic-dompurify'

// ALWAYS sanitize user-provided HTML
function renderUserContent(html: string) {
  const clean = DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'p'],
    ALLOWED_ATTR: []
  })
  return <div dangerouslySetInnerHTML={{ __html: clean }} />
}
```

#### 內容安全策略 (Content Security Policy)
```typescript
// next.config.js
const securityHeaders = [
  {
    key: 'Content-Security-Policy',
    value: `
      default-src 'self';
      script-src 'self' 'unsafe-eval' 'unsafe-inline';
      style-src 'self' 'unsafe-inline';
      img-src 'self' data: https:;
      font-src 'self';
      connect-src 'self' https://api.example.com;
    `.replace(/\s{2,}/g, ' ').trim()
  }
]
```

#### 驗證步驟 (Verification Steps)
- [ ] 使用者提供的 HTML 已清理
- [ ] 已設定 CSP headers
- [ ] 沒有未經驗證的動態內容渲染
- [ ] 使用 React 內建的 XSS 保護

### 6. CSRF 保護 (CSRF Protection)

#### CSRF Tokens
```typescript
import { csrf } from '@/lib/csrf'

export async function POST(request: Request) {
  const token = request.headers.get('X-CSRF-Token')

  if (!csrf.verify(token)) {
    return NextResponse.json(
      { error: 'Invalid CSRF token' },
      { status: 403 }
    )
  }

  // Process request
}
```

#### SameSite Cookies
```typescript
res.setHeader('Set-Cookie',
  `session=${sessionId}; HttpOnly; Secure; SameSite=Strict`)
```

#### 驗證步驟 (Verification Steps)
- [ ] 狀態變更操作有 CSRF tokens
- [ ] 所有 cookies 設定 SameSite=Strict
- [ ] 實作 Double-submit cookie 模式

### 7. 速率限制 (Rate Limiting)

#### API 速率限制 (API Rate Limiting)
```typescript
import rateLimit from 'express-rate-limit'

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per window
  message: 'Too many requests'
})

// Apply to routes
app.use('/api/', limiter)
```

#### 昂貴操作 (Expensive Operations)
```typescript
// Aggressive rate limiting for searches
const searchLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // 10 requests per minute
  message: 'Too many search requests'
})

app.use('/api/search', searchLimiter)
```

#### 驗證步驟 (Verification Steps)
- [ ] 所有 API 端點都有速率限制
- [ ] 對昂貴操作有更嚴格的限制
- [ ] 基於 IP 的速率限制
- [ ] 基於使用者的速率限制 (已認證)

### 8. 敏感資料暴露 (Sensitive Data Exposure)

#### 記錄 (Logging)
```typescript
// ❌ WRONG: Logging sensitive data
console.log('User login:', { email, password })
console.log('Payment:', { cardNumber, cvv })

// ✅ CORRECT: Redact sensitive data
console.log('User login:', { email, userId })
console.log('Payment:', { last4: card.last4, userId })
```

#### 錯誤訊息 (Error Messages)
```typescript
// ❌ WRONG: Exposing internal details
catch (error) {
  return NextResponse.json(
    { error: error.message, stack: error.stack },
    { status: 500 }
  )
}

// ✅ CORRECT: Generic error messages
catch (error) {
  console.error('Internal error:', error)
  return NextResponse.json(
    { error: 'An error occurred. Please try again.' },
    { status: 500 }
  )
}
```

#### 驗證步驟 (Verification Steps)
- [ ] Logs 中沒有密碼、tokens 或機密資訊
- [ ] 對使用者的錯誤訊息是一般性的 (Generic)
- [ ] 只有伺服器 logs 有詳細錯誤
- [ ] 沒有向使用者暴露堆疊追蹤 (Stack traces)

### 9. 區塊鏈安全 (Blockchain Security) (Solana)

#### 錢包驗證 (Wallet Verification)
```typescript
import { verify } from '@solana/web3.js'

async function verifyWalletOwnership(
  publicKey: string,
  signature: string,
  message: string
) {
  try {
    const isValid = verify(
      Buffer.from(message),
      Buffer.from(signature, 'base64'),
      Buffer.from(publicKey, 'base64')
    )
    return isValid
  } catch (error) {
    return false
  }
}
```

#### 交易驗證 (Transaction Verification)
```typescript
async function verifyTransaction(transaction: Transaction) {
  // Verify recipient
  if (transaction.to !== expectedRecipient) {
    throw new Error('Invalid recipient')
  }

  // Verify amount
  if (transaction.amount > maxAmount) {
    throw new Error('Amount exceeds limit')
  }

  // Verify user has sufficient balance
  const balance = await getBalance(transaction.from)
  if (balance < transaction.amount) {
    throw new Error('Insufficient balance')
  }

  return true
}
```

#### 驗證步驟 (Verification Steps)
- [ ] 錢包簽章已驗證
- [ ] 交易細節已驗證
- [ ] 交易前已檢查餘額
- [ ] 沒有盲目簽署交易

### 10. 相依性安全 (Dependency Security)

#### 定期更新 (Regular Updates)
```bash
# Check for vulnerabilities
npm audit

# Fix automatically fixable issues
npm audit fix

# Update dependencies
npm update

# Check for outdated packages
npm outdated
```

#### Lock Files
```bash
# ALWAYS commit lock files
git add package-lock.json

# Use in CI/CD for reproducible builds
npm ci  # Instead of npm install
```

#### 驗證步驟 (Verification Steps)
- [ ] 相依性是最新的
- [ ] 沒有已知的弱點 (npm audit clean)
- [ ] Lock files 已提交
- [ ] GitHub 上已啟用 Dependabot
- [ ] 定期的安全性更新

## 安全性測試 (Security Testing)

### 自動化安全性測試 (Automated Security Tests)
```typescript
// Test authentication
test('requires authentication', async () => {
  const response = await fetch('/api/protected')
  expect(response.status).toBe(401)
})

// Test authorization
test('requires admin role', async () => {
  const response = await fetch('/api/admin', {
    headers: { Authorization: `Bearer ${userToken}` }
  })
  expect(response.status).toBe(403)
})

// Test input validation
test('rejects invalid input', async () => {
  const response = await fetch('/api/users', {
    method: 'POST',
    body: JSON.stringify({ email: 'not-an-email' })
  })
  expect(response.status).toBe(400)
})

// Test rate limiting
test('enforces rate limits', async () => {
  const requests = Array(101).fill(null).map(() =>
    fetch('/api/endpoint')
  )

  const responses = await Promise.all(requests)
  const tooManyRequests = responses.filter(r => r.status === 429)

  expect(tooManyRequests.length).toBeGreaterThan(0)
})
```

## 部署前安全性檢查清單 (Pre-Deployment Security Checklist)

在任何生產環境部署之前：

- [ ] **機密資訊 (Secrets)**：沒有硬編碼的機密資訊，全部在環境變數中
- [ ] **輸入驗證 (Input Validation)**：所有使用者輸入都經過驗證
- [ ] **SQL 注入 (SQL Injection)**：所有查詢都參數化
- [ ] **XSS**：使用者內容已清理
- [ ] **CSRF**：保護已啟用
- [ ] **認證 (Authentication)**：正確的 token 處理
- [ ] **授權 (Authorization)**：角色檢查就位
- [ ] **速率限制 (Rate Limiting)**：在所有端點上啟用
- [ ] **HTTPS**：在生產環境強制使用
- [ ] **安全性 Headers (Security Headers)**：CSP, X-Frame-Options 已設定
- [ ] **錯誤處理 (Error Handling)**：錯誤中沒有敏感資料
- [ ] **記錄 (Logging)**：沒有記錄敏感資料
- [ ] **相依性 (Dependencies)**：最新且無弱點
- [ ] **Row Level Security**：在 Supabase 中啟用
- [ ] **CORS**：已正確設定
- [ ] **檔案上傳 (File Uploads)**：已驗證 (大小, 類型)
- [ ] **錢包簽章 (Wallet Signatures)**：已驗證 (如果是區塊鏈)

## 資源 (Resources)

- [OWASP Topp 10](https://owasp.org/www-project-top-ten/)
- [Next.js Security](https://nextjs.org/docs/security)
- [Supabase Security](https://supabase.com/docs/guides/auth)
- [Web Security Academy](https://portswigger.net/web-security)

---

**請記住**：安全性不是可選的。一個弱點可能會危害整個平台。如有疑問，請謹慎行事。
