# Update Documentation

從真實來源 (source-of-truth) 同步文件：

1. 讀取 package.json scripts 區段
   - 產生腳本參考表
   - 包含註釋中的描述

2. 讀取 .env.example
   - 提取所有環境變數
   - 記錄用途與格式

3. 產生 docs/CONTRIB.md 包含：
   - 開發工作流程
   - 可用腳本
   - 環境設定
   - 測試程序

4. 產生 docs/RUNBOOK.md 包含：
   - 部署程序
   - 監控與警報
   - 常見問題與修復
   - 回滾程序

5. 識別過時文件：
   - 找出 90 天以上未修改的文件
   - 列出以供手動審查

6. 顯示差異摘要

單一真實來源：package.json 與 .env.example
