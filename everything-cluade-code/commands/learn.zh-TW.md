# /learn - Extract Reusable Patterns

分析目前的工作階段並提取任何值得儲存為 Skill 的模式。

## 觸發時機 (Trigger)

在工作階段中，當您解決了一個非瑣碎的問題時，隨時執行 `/learn`。

## 提取什麼 (What to Extract)

尋找：

1. **錯誤解決模式 (Error Resolution Patterns)**
   - 發生了什麼錯誤？
   - 根本原因是什麼？
   - 什麼修復了它？
   - 這對於類似錯誤是否可重複使用？

2. **除錯技巧 (Debugging Techniques)**
   - 非顯而易見的除錯步驟
   - 有效的工具組合
   - 診斷模式

3. **解決方法 (Workarounds)**
   - 函式庫的怪癖 (quirks)
   - API 限制
   -特定版本的修復

4. **專案特定模式 (Project-Specific Patterns)**
   - 發現的程式碼庫慣例
   - 做出的架構決策
   - 整合模式

## 輸出格式 (Output Format)

在 `~/.claude/skills/learned/[pattern-name].md` 建立一個 skill 檔案：

```markdown
# [描述性模式名稱]

**Extracted:** [Date]
**Context:** [簡述何時適用]

## Problem
[解決的問題 - 請具體]

## Solution
[模式/技巧/解決方法]

## Example
[程式碼範例 (如果適用)]

## When to Use
[觸發條件 - 什麼應該啟動此 skill]
```

## 流程 (Process)

1. 審查工作階段以尋找可提取的模式
2. 識別最有價值/可重複使用的見解
3. 起草 skill 檔案
4. 在儲存前要求使用者確認
5. 儲存至 `~/.claude/skills/learned/`

## 注意事項 (Notes)

- 不要提取瑣碎的修復 (錯字、簡單語法錯誤)
- 不要提取一次性的問題 (特定 API 中斷等)
- 專注於能在未來工作階段節省時間的模式
- 保持 skills 聚焦 - 每個 skill 一個模式
