# 效能最佳化 (Performance Optimization)

## 模型選擇策略

**Haiku 4.5** (Sonnet 能力的 90%，節省 3 倍成本):
- 頻繁呼叫的輕量級 agents
- 結對程式設計 (Pair programming) 和程式碼生成
- 多 Agent 系統中的工作者 (Worker) agents

**Sonnet 4.5** (最佳編碼模型):
- 主要開發工作
- 協調多 Agent 工作流程
- 複雜編碼任務

**Opus 4.5** (最深層推理):
- 複雜架構決策
- 最大推理需求
- 研究與分析任務

## 情境視窗管理 (Context Window Management)

避免將情境視窗的最後 20% 用於：
- 大規模重構
- 跨越多個檔案的功能實作
- 除錯複雜互動

較低情境敏感度的任務：
- 單檔編輯
- 獨立工具函式建立
- 文件更新
- 簡單錯誤修復

## Ultrathink + Plan 模式

對於需要深度推理的複雜任務：
1. 使用 `ultrathink` 增強思考
2. 啟用 **Plan Mode** 進行結構化方法
3. 透過多輪批評 "Rev the engine"
4. 使用分工子代理 (split role sub-agents) 進行多樣化分析

## 建置疑難排解 (Build Troubleshooting)

如果建置失敗：
1. 使用 **build-error-resolver** agent
2. 分析錯誤訊息
3. 增量修復
4. 每次修復後驗證
