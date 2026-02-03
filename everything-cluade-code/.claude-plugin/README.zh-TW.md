### Plugin Manifest 常見陷阱

如果您打算編輯 `.claude-plugin/plugin.json`，請注意 Claude plugin 驗證器強制執行數個**未記載但嚴格的限制**，這可能會導致安裝失敗並產生含糊不清的錯誤（例如 `agents: Invalid input`）。特別是，組件欄位必須是陣列，`agents` 必須使用明確的檔案路徑而非目錄，並且必須包含 `version` 欄位以確保可靠的驗證與安裝。

這些限制在公開範例中並不明顯，且過去曾造成重複的安裝失敗。它們在 `.claude-plugin/PLUGIN_SCHEMA_NOTES.md` 中有詳細記載，在對 plugin manifest 進行任何更改之前應先詳閱該文件。
