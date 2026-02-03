# Plugin Manifest 架構筆記 (Schema Notes)

這份文件記錄了 Claude Code plugin manifest 驗證器**未記載但強制執行的限制 (undocumented but enforced constraints)**。

這些規則是基於實際的安裝失敗案例、驗證器行為，以及與已知正常運作的 plugin 比較歸納而來。
它們的存在是為了防止無聲的崩壞和重複的回歸問題。

如果您要編輯 `.claude-plugin/plugin.json`，請先閱讀此文。

---

## 摘要 (請先閱讀)

Claude plugin manifest 驗證器是**嚴格且固執的**。
它強制執行一些在公開架構參考文件中未完全記載的規則。

最常見的失敗模式是：

> Manifest 看起來很合理，但驗證器以含糊的錯誤拒絕它，例如：
> `agents: Invalid input`

本文件解釋了原因。

---

## 必要欄位

### `version` (強制性)

即使在某些範例中省略了 `version` 欄位，驗證器也**要求**必須有此欄位。

如果缺少，可能會在市集安裝期間或 CLI 驗證時失敗。

範例：

```json
{
  "version": "1.1.0"
}
```

---

## 欄位形狀規則 (Field Shape Rules)

以下欄位**必須始終為陣列 (arrays)**：

* `agents`
* `commands`
* `skills`
* `hooks` (如果存在)

即使只有一個項目，**也不接受字串**。

### 無效

```json
{
  "agents": "./agents"
}
```

### 有效

```json
{
  "agents": ["./agents/planner.md"]
}
```

這一致地適用於所有組件路徑欄位。

---

## 路徑解析規則 (關鍵)

### Agents 必須使用明確的檔案路徑

驗證器**不接受 `agents` 使用目錄路徑**。

即使是以下寫法也會失敗：

```json
{
  "agents": ["./agents/"]
}
```

相反地，您必須明確列舉 agent 檔案：

```json
{
  "agents": [
    "./agents/planner.md",
    "./agents/architect.md",
    "./agents/code-reviewer.md"
  ]
}
```

這是最常見的驗證錯誤來源。

### Commands 和 Skills

* `commands` 和 `skills` 僅在**包在陣列中時**接受目錄路徑
* 明確的檔案路徑是最安全且最經得起未來考驗的

---

## 驗證器行為筆記

* `claude plugin validate` 比某些市集預覽更嚴格
* 驗證可能在本地通過，但在安裝時若路徑不明確則會失敗
* 錯誤通常是通用的 (`Invalid input`) 且不指出根本原因
* 跨平台安裝 (特別是 Windows) 對於路徑假設較不寬容

假設驗證器是充滿敵意且拘泥字義的。

---

## `hooks` 欄位：請勿新增

> ⚠️ **關鍵：** 請勿在 `plugin.json` 中新增 `"hooks"` 欄位。這由回歸測試強制執行。

### 為什麼這很重要

Claude Code v2.1+ 依慣例會**自動載入**任何已安裝插件中的 `hooks/hooks.json`。如果您也在 `plugin.json` 中宣告它，您會得到：

```
Duplicate hooks file detected: ./hooks/hooks.json resolves to already-loaded file.
The standard hooks/hooks.json is loaded automatically, so manifest.hooks should
only reference additional hook files.
```

### 變更歷史 (Flip-Flop History)

這在此 repo 造成了重複的修復/還原循環：

| Commit | 動作 | 觸發原因 |
|--------|--------|---------|
| `22ad036` | 新增 hooks | 使用者回報 "hooks 未載入" |
| `a7bc5f2` | 移除 hooks | 使用者回報 "重複 hooks 錯誤" (#52) |
| `779085e` | 新增 hooks | 使用者回報 "agents 未載入" (#88) |
| `e3a1306` | 移除 hooks | 使用者回報 "重複 hooks 錯誤" (#103) |

**根本原因：** Claude Code CLI 在版本間改變了行為：
- Pre-v2.1: 需要明確的 `hooks` 宣告
- v2.1+: 依慣例自動載入，重複宣告會報錯

### 目前規則 (由測試強制執行)

在 `tests/hooks/hooks.test.js` 中的測試 `plugin.json does NOT have explicit hooks declaration` 防止此問題再次發生。

**如果您要新增額外的 hook 檔案** (非 `hooks/hooks.json`)，那些**可以**被宣告。但標準的 `hooks/hooks.json` 絕不能被宣告。

---

## 已知反模式 (Anti-Patterns)

這些看起來正確但會被拒絕：

* 字串值而非陣列
* `agents` 使用目錄陣列
* 缺少 `version`
* 依賴推斷的路徑
* 假設市集行為與本地驗證相符
* **新增 `"hooks": "./hooks/hooks.json"`** - 依慣例已自動載入，會導致重複錯誤

避免耍小聰明。保持明確。

---

## 最小已知良好範例

```json
{
  "version": "1.1.0",
  "agents": [
    "./agents/planner.md",
    "./agents/code-reviewer.md"
  ],
  "commands": ["./commands/"],
  "skills": ["./skills/"]
}
```

此結構已通過 Claude plugin 驗證器的驗證。

**重要：** 注意這裡**沒有** `"hooks"` 欄位。`hooks/hooks.json` 檔案會依慣例自動載入。明確新增它會導致重複錯誤。

---

## 給貢獻者的建議

在提交涉及 `plugin.json` 的變更之前：

1. 使用明確的檔案路徑指定 agents
2. 確保所有組件欄位都是陣列
3. 包含 `version`
4. 執行：

```bash
claude plugin validate .claude-plugin/plugin.json
```

如果有疑問，選擇冗長明確而非便利。

---

## 為什麼這份檔案存在

此儲存庫被廣泛 fork 並作為參考實作使用。

在此記錄驗證器的怪癖 (quirks)：

* 防止重複的問題
* 減少貢獻者的挫折感
* 在生態系統演進時保持插件穩定性

如果驗證器變更了，請先更新此文件。
