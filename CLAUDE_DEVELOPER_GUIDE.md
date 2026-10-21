# 🕵️《雙北漫遊：都會行蹤》Claude 專屬開發交接規格手冊
> **Master Specification & Architecture Handbook for Claude (Detective System Core)**  
> **專屬 GitHub 倉庫**：`https://github.com/hsiaoyujui114-code/taipei-detective-core`  
> **伺服器版本運行位址**：`http://localhost:3001` (獨立測試台) ✕ `http://localhost:3000/detective` (主伺服器聯調)  
> **版本**：2026 年 10 月最新獨立劃分版

---

## 📌 一、 專案核心背景與架構分工說明

本專案為國小六年級獨立研究專題：《雙北漫遊：都會行蹤》✕《城市脈動：通勤偵探》（Taipei Metro Detective RPG）。
結合**真實雙北生活科學鑑識**、**大眾運輸通勤大數據**與**環保減塑日常實踐**。

### 🔄 雙核心獨立分工架構：
1. **「地圖系統」（由 Antigravity 負責）**：
   - 倉庫：`taipei-metro-detective-rpg` ✕ `city-pulse-detective`
   - 職責：1:1 真實雙北網路地圖（NLSC、Esri 街道、OSM、衛星、暗黑）、四軌大眾運輸即時 GPS、道路階層雙層包邊、施工狀態即時同步、周遭 850m 生活圈視野限制、導航方位羅盤 HUD。
2. **「偵探系統」（由 Claude 負責，即本倉庫 `taipei-detective-core`）**：
   - 倉庫：`taipei-detective-core`
   - 職責：**調查員角色核心、三軌道具與物證背包、生活科學物證鑑識、多輪 NPC 詰問樹、思維推理板、案件全生命週期狀態機、悠遊卡與環保減塑錢包**。
   - **重點要求**：先不要放到地圖上，獨立在此倉庫與本地伺服器研發，最後兩方再進行合併對接！

---

## 🚫 二、 三大最高憲法級絕對禁忌 (CRITICAL FORBIDDEN RULES)

在撰寫程式碼、註解、文檔或對話時，**必須 100% 嚴格遵守，違者將被直接退件**：

1. **🈲 嚴格禁用「少年偵探」稱呼**：
   - 委託人明確表達極度反感此稱呼！
   - 所有變數、註解、介面文字、NPC 對白，**一律稱呼為「都會調查員」(Investigator) 或「市民」**。
2. **🈲 嚴格禁用「藝碩／益碩」稱謂（永久最高絕對禁忌）**：
   - 委託人明確下達絕對指令：「就算改成什麼市民的，我希望不要有『藝碩』，什麼市民藝碩、什麼都會教授藝碩的，我都不要『藝碩』這個名字！」
   - 無論是調查員預設名、NPC、教授、代碼變數或文件，全專案全域 100% 絕對嚴禁出現「藝碩」或「益碩」！
3. **🈲 嚴禁歷史廢除職稱**：
   - 嚴禁出現「工讀生」、「實習生」、「小幫手」等詞彙。
4. **🈲 嚴禁點地圖直接瞬移傳送**：
   - 遊戲講求真實空間感，玩家移動皆需走路或搭乘大眾運輸。

---

## 📐 三、 委託人指定之核心規格要求

### 1. 拒絕做簡單版本，直接依照企劃書方法完整做出來
- **生活科學鑑識**：必須結合國小自然科學課綱（如：pH 酸鹼試紙中和滴定、365nm UV 螢光防偽章激發、流體力學虹吸裝置、日影幾何等），物證不能點一下就破案，必須經過科學工具化驗！
- **三軌道具背包**：
  - 軌道一：生活實體道具 (日常飲食、悠遊卡、環保購物袋、調查筆記本)
  - 軌道二：專業鑑識器材 (放大鏡、UV 燈、pH 試紙、熱敏顯影筆)
  - 軌道三：關鍵案件物證 (中毒樣品、殘留結晶、含水纖維、時間戳刷卡紀錄)
- **環保減塑積分 (Eco Points)**：落實自備環保杯省 5 元、自備購物袋、無紙化雲端發票、拒絕一次性餐具之綠色積分累積。

### 2. 劇情模組化（嚴禁寫死在程式碼中）
- 委託人指示：「**劇情部分可以先做，但之後我可能還會改，所以劇情的程式碼先不要寫死。**」
- **架構規範**：
  - 案件主檔：`src/data/cases/*.json`
  - NPC 對白與詰問樹：`src/data/dialogues/*.json`
  - 嫌疑人檔案：`src/data/npcs/*.json`
  - 道具物證庫：`src/data/items/*.json`
  - 核心邏輯引擎 (`StoryLoader.js` / `DialogueEngine.js`) 純粹負責資料解析與狀態流轉，隨時可抽換 JSON，絕不可 hardcode 劇情台詞。

### 3. 雙軌並行：GitHub 倉庫與伺服器版本
- 委託人指示：「**請先幫我做 GitHub 跟伺服器版本並行。因為我希望最後是以伺服器版本呈現，但現在伺服器沒辦法讓其他地方看到，所以兩個都要做，並且隨時更新起來。**」
- **伺服器支援**：
  - 本倉庫內建 `server.js`，執行 `npm start` 即可於 `http://localhost:3001` 開啟視覺化測試台與完整 REST API。
  - 主伺服器在 `http://localhost:3000` 亦並行運作中。

---

## 🔌 四、 與地圖系統（Antigravity）協同對接合約 (MapBridge)

本系統與地圖系統透過標準事件協議 [`src/bridge/EventContracts.js`](./src/bridge/EventContracts.js) 通信：

### 1. 地圖 ➔ 偵探 (`MapDetectiveEvents.MAP`)
- `map:player_moved`：`{ lat, lon, sectorCode, sectorName }`
- `map:station_arrived`：`{ stationName, lineName, transportType }`
- `map:store_entered`：`{ storeId, brand, name, lat, lon }`
- `map:transit_boarded`：`{ vehicleType: 'bus'|'mrt'|'thsr'|'tra', routeId }`
- `map:investigation_poi_clicked`：`{ poiId, caseId, coords }`

### 2. 偵探 ➔ 地圖 (`MapDetectiveEvents.DETECTIVE`)
- `detective:case_accepted`：`{ caseId, title, centerCoords, radiusMeters }`（地圖在目標地點繪製警戒搜查圈）
- `detective:marker_spawn_request`：`{ markerId, lat, lon, title }`（地圖產生閃爍物證標記）
- `detective:fare_deduct_request`：`{ amount, fareType }`（地圖驗票閘門扣除悠遊卡儲值金）
- `detective:case_resolved`：`{ caseId, grade, isSuccess }`（地圖解除警戒區並廣播成就）

---

## 🛠️ 五、 開發與驗收工作流程 (協同規定)

1. **獨立測試**：
   - 執行 `npm test`：自動執行 `test/detective.test.js`，驗證 6 大階段測試。
   - 執行 `npm start`：啟動網頁測試台 `http://localhost:3001`，進行可視化點擊測試。
2. **協同規範**：
   - 每完成一個新功能或修改資料結構，請立即 commit & push 至 GitHub 倉庫，並在交接日誌中說明新增了哪些方法或事件。
   - 地圖端 Antigravity 也會即時讀取並同步修改地圖對應接口，確保雙方在最後整併時 100% 零衝突順利合體！
