# Everything Claude Code 完整詳解指南 (The Longform Guide)

![Header: The Longform Guide to Everything Claude Code](./assets/images/longform/01-header.png)

---

> **先決條件**：本指南建立在 [Everything Claude Code 速查指南](./the-shortform-guide.zh-TW.md) 的基礎上。如果您還沒設定 skills、hooks、subagents、MCPs 和 plugins，請先閱讀該篇。

![Reference to Shorthand Guide](./assets/images/longform/02-shortform-reference.png)
*速查指南 - 請先閱讀*

在速查指南中，我介紹了基礎設定：skills 與 commands、hooks、subagents、MCPs、plugins，以及構成有效 Claude Code 工作流程骨幹的設定模式。那是設定指南和基礎設施。

這份詳解指南將深入探討區分「高效能階段」與「浪費階段」的技巧。如果您還沒讀過速查指南，請回去先完成設定。接下來的內容假設您已經配置好並能運作 skills、agents、hooks 和 MCPs。

這裡的主題包括：Token 經濟學、記憶持久化、驗證模式、平行化策略，以及建立可重用工作流程的複利效應。這些是我經過 10 個月以上日常使用提煉出的模式，它們讓您能夠維持數小時的高效工作，而不是在第一小時就被 Context 腐爛 (context rot) 困擾。

速查與詳解指南涵蓋的所有內容都可在 GitHub 上找到：`github.com/affaan-m/everything-claude-code`

---

## 技巧與竅門 (Tips and Tricks)

### 某些 MCPs 是可替換的，且能釋放您的 Context Window

對於如版本控制 (GitHub)、資料庫 (Supabase)、部署 (Vercel, Railway) 等 MCPs - 這些平台大多數已經有強大的 CLI，MCP 本質上只是包裝了它們。MCP 是個不錯的包裝，但它有代價。

要讓 CLI 像 MCP 一樣運作但不需要實際使用 MCP (以及隨之而來的 Context window 縮減)，可以考慮將功能打包進 skills 和 commands。去除 MCP 暴露的那些讓事情變簡單的工具，將其轉為 commands。

範例：不要隨時掛載 GitHub MCP，而是建立一個 `/gh-pr` 指令，用您偏好的選項包裝 `gh pr create`。不要讓 Supabase MCP 吃掉 context，而是建立直接使用 Supabase CLI 的 skills。

透過延遲載入 (lazy loading)，Context window 問題大部分解決了。但 Token 使用量和成本並未以相同方式解決。CLI + skills 方法仍然是一種 Token 最佳化手段。

---

## 重要事項 (IMPORTANT STUFF)

### 情境與記憶管理 (Context and Memory Management)

要在不同階段 (sessions) 間分享記憶，最好的賭注是使用一個 skill 或 command 來總結並檢查進度，然後儲存到您 `.claude` 資料夾中的 `.tmp` 檔案，並追加內容直到階段結束。隔天，它可以做為 Context 使用，讓您從上次中斷的地方繼續，並為每個階段建立新檔案，這樣就不會將舊的 Context 污染到新工作中。

![Session Storage File Tree](./assets/images/longform/03-session-storage.png)
*階段儲存範例 -> https://github.com/affaan-m/everything-claude-code/tree/main/examples/sessions*

讓 Claude 建立一個總結當前狀態的檔案。審查它，如果需要則要求編輯，然後重新開始。對於新對話，只需提供該檔案路徑。這在您遇到 Context 限制並需要繼續複雜工作時特別有用。這些檔案應包含：
- 哪些方法有效 (有證據驗證)
- 哪些方法嘗試過但無效
- 哪些方法尚未嘗試以及剩下什麼要做

**策略性清除 Context：**

一旦您設定好計畫並清除了 Context (現在是 Claude Code 計畫模式中的預設選項)，您就可以根據計畫工作。這在您累積了大量但與執行不再相關的探索 Context 時很有用。對於策略性壓縮，請關閉自動壓縮。在邏輯間隔手動壓縮，或建立一個 skill 為您執行此操作。

**進階：動態系統提示注入 (Dynamic System Prompt Injection)**

我學到的一個模式：不要只把所有東西都放在 `CLAUDE.md` (使用者範圍) 或 `.claude/rules/` (專案範圍) 這些每個階段都會載入的地方，而是使用 CLI flags 動態注入 Context。

```bash
claude --system-prompt "$(cat memory.md)"
```

這讓您可以更精確地控制何時載入什麼 Context。系統提示內容的權限高於使用者訊息，而使用者訊息的權限高於工具結果。

**實用設定：**

```bash
# 日常開發
alias claude-dev='claude --system-prompt "$(cat ~/.claude/contexts/dev.md)"'

# PR 審查模式
alias claude-review='claude --system-prompt "$(cat ~/.claude/contexts/review.md)"'

# 研究/探索模式
alias claude-research='claude --system-prompt "$(cat ~/.claude/contexts/research.md)"'
```

**進階：記憶持久化 Hooks**

大多數人不知道有些 hooks 可以幫助記憶：

- **PreCompact Hook**: 在 Context 壓縮發生前，將重要狀態儲存至檔案
- **Stop Hook (Session End)**: 在階段結束時，將學習到的內容持久化至檔案
- **SessionStart Hook**: 在新階段開始時，自動載入先前的 Context

我已經建立了這些 hooks，它們在 repo 的 `github.com/affaan-m/everything-claude-code/tree/main/hooks/memory-persistence`。

---

### 持續學習 / 記憶 (Continuous Learning / Memory)

如果您必須多次重複同一個提示，而 Claude 遇到相同的問題或給您之前聽過的回應 - 那些模式必須被追加到 skills 中。

**問題：** 浪費 Tokens，浪費 Context，浪費時間。

**解決方案：** 當 Claude Code 發現非瑣碎的事物 - 除錯技巧、變通方法、某些專案特定模式 - 它將該知識儲存為新的 skill。下次類似問題出現時，該 skill 會自動載入。

我已經建立了一個持續學習 skill 來做這件事：`github.com/affaan-m/everything-claude-code/tree/main/skills/continuous-learning`

**為什麼是用 Stop Hook (而非 UserPromptSubmit)：**

關鍵的設計決策是使用 **Stop hook** 而非 UserPromptSubmit。UserPromptSubmit 在每條訊息都會執行 - 增加每個提示的延遲。Stop 在階段結束時執行一次 - 輕量，不會在階段期間拖慢您的速度。

---

### Token 最佳化 (Token Optimization)

**主要策略：Subagent 架構**

最佳化您使用的工具，並設計 subagent 架構以委派足以完成任務的最便宜模型。

**模型選擇快速參考：**

![Model Selection Table](./assets/images/longform/04-model-selection.png)
*各種常見任務上的 subagents 假設設定及其選擇背後的推論*

| 任務類型 | 模型 | 原因 |
| ------------------------- | ------ | ------------------------------------------ |
| 探索/搜尋 (Exploration/search) | Haiku | 快速、便宜，足以尋找檔案 |
| 簡單編輯 (Simple edits) | Haiku | 單檔修改，指令清晰 |
| 多檔實作 (Multi-file) | Sonnet | 編碼的最佳平衡 |
| 複雜架構 (Complex architecture) | Opus | 需要深度推理 |
| PR 審查 (PR reviews) | Sonnet | 理解 Context，捕捉細微差別 |
| 安全性分析 (Security analysis) | Opus | 不能錯過漏洞 |
| 撰寫文件 (Writing docs) | Haiku | 結構簡單 |
| 除錯複雜 bugs | Opus | 需要在腦中掌握整個系統 |

90% 的編碼任務預設使用 Sonnet。當第一次嘗試失敗、任務跨越 5+ 檔案、架構決策或安全關鍵程式碼時，升級到 Opus。

**定價參考：**

![Claude Model Pricing](./assets/images/longform/05-pricing-table.png)
*來源: https://platform.claude.com/docs/en/about-claude/pricing*

**特定工具最佳化：**

將 grep 替換為 mgrep - 平均比傳統 grep 或 ripgrep 減少約 50% 的 token：

![mgrep Benchmark](./assets/images/longform/06-mgrep-benchmark.png)
*在我們的 50 項任務基準測試中，mgrep + Claude Code 使用的 tokens 比基於 grep 的工作流少約 2 倍，且品質相當或更好。來源: https://github.com/mixedbread-ai/mgrep*

**模組化程式碼庫的好處：**

擁有更模組化的程式碼庫，主要檔案為數百行而非數千行，這有助於 Token 最佳化成本，並能一次就把任務做好。

---

### 驗證迴圈與評估 (Verification Loops and Evals)

**基準測試工作流：**

比較有使用與沒使用 skill 的情況下要求同一件事，並檢查輸出差異：

Fork 對話，在其中一個 fork 啟動不含 skill 的新 worktree，最後拉出 diff，看看記錄了什麼。

**Eval 模式類型：**

- **基於檢查點的 Evals (Checkpoint-Based)**: 設定明確檢查點，針對定義的標準驗證，在繼續前修復
- **持續 Evals (Continuous)**: 每 N 分鐘或重大變更後執行，完整測試套件 + lint

**關鍵指標：**

```
pass@k: k 次嘗試中至少有一次成功
        k=1: 70%  k=3: 91%  k=5: 97%

pass^k: 所有 k 次嘗試都必須成功
        k=1: 70%  k=3: 34%  k=5: 17%
```

當您只需要它能運作時使用 **pass@k**。當一致性至關重要時使用 **pass^k**。

---

## 平行化 (PARALLELIZATION)

在多 Claude 終端機設定中 fork 對話時，確保 fork 中的動作與原始對話的範圍定義明確。在程碼變更方面，目標是最小化重疊。

**我偏好的模式：**

主聊天室用於程式碼變更，fork 用於詢問關於程式碼庫及其當前狀態的問題，或研究外部服務。

**關於任意終端機數量：**

![Boris on Parallel Terminals](./assets/images/longform/07-boris-parallel.png)
*Boris (Anthropic) 談執行多個 Claude 實例*

Boris 對平行化有一些提示。他建議像是在本地執行 5 個 Claude 實例，上游執行 5 個。我不建議設置任意數量的終端機。增加終端機應該出於真正的必要。

您的目標應該是：**以最小可行數量的平行化完成最多的工作。**

**Git Worktrees 用於平行實例：**

```bash
# 為平行工作建立 worktrees
git worktree add ../project-feature-a feature-a
git worktree add ../project-feature-b feature-b
git worktree add ../project-refactor refactor-branch

# 每個 worktree 都有自己的 Claude 實例
cd ../project-feature-a && claude
```

**如果**您要開始擴展實例**並且**您有多個 Claude 實例在彼此重疊的程式碼上工作，您**必須**使用 git worktrees 並為每個實例制定定義非常明確的計畫。使用 `/rename <name here>` 來命名您所有的聊天室。

![Two Terminal Setup](./assets/images/longform/08-two-terminals.png)
*起始設定：左終端機用於編碼，右終端機用於提問 - 使用 /rename 和 /fork*

**級聯方法 (The Cascade Method):**

當執行多個 Claude Code 實例時，以「級聯」模式組織：

- 在右側新分頁開啟新任務
- 從左到右，從舊到新掃視
- 一次專注於最多 3-4 個任務

---

## 基礎工作 (GROUNDWORK)

**雙實例啟動模式 (The Two-Instance Kickoff Pattern):**

為了我自己的工作流管理，我喜歡以 2 個開啟的 Claude 實例開始一個空 repo。

**實例 1: 鷹架 Agent (Scaffolding Agent)**
- 鋪設鷹架和基礎工作
- 建立專案結構
- 設定 configs (CLAUDE.md, rules, agents)

**實例 2: 深度研究 Agent (Deep Research Agent)**
- 連接到您所有的服務，網頁搜尋
- 建立詳細的 PRD
- 建立架構 mermaid圖表
- 彙編包含實際文件片段的參考資料

**llms.txt 模式:**

如果可用，在到達文件頁面後執行 `/llms.txt`，您可以在許多文件參考上找到 `llms.txt`。這給您一個乾淨、LLM 最佳化的文件版本。

**哲學：建立可重用模式**

來自 @omarsar0：「早期，我花時間建立可重用的工作流/模式。建立起來很乏味，但隨著模型和 agent 框架的改進，這產生了巨大的複利效應。」

**投資什麼：**

- Subagents
- Skills
- Commands
- 規劃模式 (Planning patterns)
- MCP 工具
- 情境工程模式 (Context engineering patterns)

---

## Agents 與 Sub-Agents 的最佳實踐 (Best Practices)

**Sub-Agent 情境問題：**

Sub-agents 的存在是為了透過返回摘要而非傾倒所有東西來節省 Context。但協調者 (主 agent) 擁有 sub-agent 缺乏的語義 Context。Sub-agent 只知道字面上的查詢，不知道請求背後的**目的**。

**迭代檢索模式 (Iterative Retrieval Pattern):**

1. 協調者評估每個 sub-agent 的回傳
2. 在接受之前提出後續問題
3. Sub-agent 回到來源，獲取答案，返回
4. 循環直到足夠 (最多 3 個週期)

**關鍵：** 傳遞目標 Context，而不僅僅是查詢。

**具順序階段的協調者：**

```markdown
Phase 1: RESEARCH (使用 Explore agent) → research-summary.md
Phase 2: PLAN (使用 planner agent) → plan.md
Phase 3: IMPLEMENT (使用 tdd-guide agent) → code changes
Phase 4: REVIEW (使用 code-reviewer agent) → review-comments.md
Phase 5: VERIFY (如果需要使用 build-error-resolver) → 完成或循環回去
```

**關鍵規則：**

1. 每個 agent 得到**一個**清晰的輸入並產生**一個**清晰的輸出
2. 輸出成為下一階段的輸入
3. 絕不跳過階段
4. 在 agents 之間使用 `/clear`
5. 將中間輸出儲存在檔案中

---

## 有趣的東西 / 非關鍵但有趣的提示 (FUN STUFF)

### 自訂狀態列 (Custom Status Line)

您可以使用 `/statusline` 設定它 - 然後 Claude 會說您還沒有狀態列，但可以為您設定，並詢問您想要什麼。

參閱：https://github.com/sirmalloc/ccstatusline

### 語音轉錄 (Voice Transcription)

用聲音跟 Claude Code 說話。對許多人來說比打字快。

- Mac 上的 superwhisper, MacWhisper
- 即使有轉錄錯誤，Claude 也能理解意圖

### 終端機別名 (Terminal Aliases)

```bash
alias c='claude'
alias gb='github'
alias co='code'
alias q='cd ~/Desktop/projects'
```

---

## 里程碑 (Milestone)

![25k+ GitHub Stars](./assets/images/longform/09-25k-stars.png)
*一週內獲得 25,000+ GitHub 星星*

---

## 資源 (Resources)

**Agent 協作 (Agent Orchestration):**

- https://github.com/ruvnet/claude-flow - 擁有 54+ 指定 agents 的企業級協作平台

**自我改進記憶 (Self-Improving Memory):**

- https://github.com/affaan-m/everything-claude-code/tree/main/skills/continuous-learning
- rlancemartin.github.io/2025/12/01/claude_diary/ - 階段反思模式

**系統提示參考 (System Prompts Reference):**

- https://github.com/x1xhlol/system-prompts-and-models-of-ai-tools - AI 工具系統提示合集 (110k stars)

**官方:**

- Anthropic Academy: anthropic.skilljar.com

---

## 參考資料 (References)

- [Anthropic: Demystifying evals for AI agents](https://www.anthropic.com/engineering/demystifying-evals-for-ai-agents)
- [YK: 32 Claude Code Tips](https://agenticcoding.substack.com/p/32-claude-code-tips-from-basics-to)
- [RLanceMartin: Session Reflection Pattern](https://rlancemartin.github.io/2025/12/01/claude_diary/)
- @PerceptualPeak: Sub-Agent Context Negotiation
- @menhguin: Agent Abstractions Tierlist
- @omarsar0: Compound Effects Philosophy

---

*兩份指南涵蓋的所有內容都可在 GitHub 上的 [everything-claude-code](https://github.com/affaan-m/everything-claude-code) 取得*
