# 🕵️ 雙北漫遊：都會行蹤 - 調查員偵探系統核心 (Taipei Detective Core)

> 國小六年級獨立研究專題：《雙北漫遊：都會行蹤》✕《城市脈動：通勤偵探》  
> 專屬偵探系統核心模組（由 Claude 開發與維護）

## 🚀 快速開始

```bash
# 1. 執行單元與全流程整合測試 (6大階段自動化測試)
npm test

# 2. 啟動獨立可視化偵探測試伺服器 (Port 3001)
npm start
```
開啟瀏覽器訪問：`http://localhost:3001` 即可進入可視化調查員測試工作台。

## 📖 核心架構目錄

- `src/core/`：核心推理與狀態機（CaseManager, EvidenceEngine, DeductionBoard, TrustSystem）
- `src/player/`：調查員角色、三軌背包（Inventory）與減塑悠遊卡錢包（EcoWallet）
- `src/storyline/`：模組化非寫死劇情引擎（StoryLoader, DialogueEngine）
- `src/data/`：純 JSON 劇情、案件與對白配置（cases, dialogues, npcs, items）
- `src/bridge/`：地圖系統協同事件協議（MapBridge, EventContracts）
- `CLAUDE_DEVELOPER_GUIDE.md`：**給 Claude 的專屬接手開發手冊與企劃規格指南**

## 🚫 嚴格禁忌
- 🈲 嚴格禁用「少年偵探」，一律稱呼「都會調查員」或「市民」。
- 🈲 嚴格禁用「藝碩/益碩」稱謂。
- 🈲 嚴禁歷史廢除職稱。
- 🈲 嚴禁瞬移傳送。
