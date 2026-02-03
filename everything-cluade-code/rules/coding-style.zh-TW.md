# 程式碼風格 (Coding Style)

## 不變性 (Immutability) (關鍵)

**始終**建立新物件，**絕不**變異 (mutate)：

```javascript
//錯誤 (WRONG): 變異 (Mutation)
function updateUser(user, name) {
  user.name = name  // 變異！
  return user
}

// 正確 (CORRECT): 不變性 (Immutability)
function updateUser(user, name) {
  return {
    ...user,
    name
  }
}
```

## 檔案組織 (File Organization)

許多小檔案 > 少數大檔案：
- 高內聚 (High cohesion)，低耦合 (low coupling)
- 典型 200-400 行，最大 800 行
- 將工具函式 (utilities) 從大型組件中提取出來
- 依功能/領域組織，而非依類型

## 錯誤處理 (Error Handling)

**始終**全面地處理錯誤：

```typescript
try {
  const result = await riskyOperation()
  return result
} catch (error) {
  console.error('Operation failed:', error)
  throw new Error('Detailed user-friendly message')
}
```

## 輸入驗證 (Input Validation)

**始終**驗證使用者輸入：

```typescript
import { z } from 'zod'

const schema = z.object({
  email: z.string().email(),
  age: z.number().int().min(0).max(150)
})

const validated = schema.parse(input)
```

## 程式碼品質檢查清單 (Code Quality Checklist)

在標記工作完成前：
- [ ] 程式碼可讀性高且命名良好
- [ ] 函式很小 (<50 行)
- [ ] 檔案專注 (<800 行)
- [ ] 無深層巢狀結構 (>4 層)
- [ ] 適當的錯誤處理
- [ ] 無 console.log 語句
- [ ] 無寫死 (hardcoded) 的值
- [ ] 無變異 (使用不可變模式)
