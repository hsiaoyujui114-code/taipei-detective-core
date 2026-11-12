# 🕵️《雙北漫遊：都會行蹤》都會調查員偵探核心系統 (Taipei Detective Core)

> 🌐 **【跨電腦 AI 開發必讀】如果你是在其他電腦接手本專案的 AI**：  
> 請立即閱讀 [REMOTE_AI_INSTRUCTIONS.md](REMOTE_AI_INSTRUCTIONS.md)，內含 3 大模組（1. 地圖、2. 故事、3. 偵探代碼）之核心檔案速查表、四大憲法紅線與一鍵調度規範！


> 國小六年級獨立研究專題：《雙北漫遊：都會行蹤》✕《城市脈動：通勤偵探》  
> 專屬偵探系統核心獨立倉庫（由 Agent `code` 獨立研發與維護）  
> 獨立測試台運行位址：`http://localhost:3001` ✕ 主地圖伺服器聯調：`http://localhost:3000/detective`  
> 🎮 **全倉庫統一線上試玩遊戲**：[https://hsiaoyujui114-code.github.io/city-pulse-detective/cyber-realmap.html](https://hsiaoyujui114-code.github.io/city-pulse-detective/cyber-realmap.html)

---

## 📦 四倉庫分工定位與 SSOT 權威來源對照表

| GitHub 倉庫 | 定位與職責 | 權威維護內容 (SSOT) |
| :--- | :--- | :--- |
| **`city-pulse-detective`** | **線上試玩與地圖主站** | `cyber-realmap.*`、`index.html`、`game.js`、`shared-data.js`、`server.js`（鏡像勿於他倉單邊改） |
| **`taipei-metro-detective-rpg`** | **地圖／多人在線鏡像倉** | 鏡像同步主站雙軌地圖、`shared-data.js`、`cases.json`、`PROPOSAL.md` 與 `server.js` |
| **`taipei-detective-rpg`** | **故事劇本與 50 案件展示倉** | 50 案件資料、`cases.html`、`cases.json`、`CASES_50_FULL_SPEC.md`、`PROPOSAL.md`、`proposal.html`（鏡像勿於他倉單邊改） |
| **`taipei-detective-core`** | **獨立偵探系統核心引擎（本倉為 SSOT）** | JSON 驅動案件／NPC／對話樹、`EcoWallet` 真實運價、`MapBridge`、`/detective` 工作台（Port 3001） |

> ⚙️ **現行實作 vs 未來規劃 (`ISSUE-09`)**：地圖端現行實作採用 **HTML5 Canvas 2D ＋ Leaflet 1.9.4 ＋ Node.js ＋ `ws`**；`PixiJS` 與 `Socket.io` 屬 Phase 2+ 未來擴充規劃，勿重寫引擎。GitHub Pages 靜態頁皆直接從 `main` 分支根目錄 (`/`) 部署，無 `.github/workflows/deploy.yml` (`ISSUE-07`)。  
> 🔧 **本機雙倉庫並排與雙服務前置條件 (`ISSUE-08`)**：若要從地圖端（`http://localhost:3000/detective` 與 `/api/detective/*`）聯調本核心，須在同一父目錄並排 `git clone` `city-pulse-detective` 與 `taipei-detective-core`，並分別啟動主站 (`3000`) 與本核心 (`3001`)；若未並排，地圖端 `/detective` 會回傳 `503` 友善安裝指引。本倉根目錄的 `cyber-realmap.*` 與 `shared-data.js` 為 `city-pulse-detective` 之鏡像副本，勿直接單邊修改 (`ISSUE-11`)。

---

## 📌 一、 專案核心特色與企劃書規格落實

1. **【100% 非寫死資料驅動架構 (Data-Driven)】**：
   - 所有案件檔案皆位於 `src/data/cases/`（JSON），人物檔案在 `src/data/npcs/`，對話詰問樹在 `src/data/dialogues/`，三軌道具在 `src/data/items/`。
   - `StoryLoader.js` 支援目錄動態自動掃描，隨時抽換 JSON 配置，無須修改任何核心程式碼。

2. **【企劃書 10 首發示範案完整實裝】**：
   - `CASE-01`：西門町連鎖咖啡店招牌熱焦糖瑪奇朵中毒案 (pH 弱酸檢測、365nm UV 螢光激發、TLC 薄層層析、Emulsin 苦杏仁酵素 65°C 活化催化水解、4 號桌杯蓋飲用孔汗液指紋)
   - `CASE-02`：台北車站三鐵連通長廊水力延時案 (虹吸流體延時機關、常溫聲速 340m/s 計算、滑輪鋼索高溫微痕)
   - `CASE-03`：淡水海關碼頭跳舞小人航海磚案 (單表替換式密碼頻率分析、淡水河口潮汐深度計算、光學微痕)
   - `CASE-04`：北投溫泉老旅店空白遺書熱敏案 (弱有機檸檬酸 85°C 溫泉蒸氣受熱脫水炭化、防熱竹夾)
   - `CASE-05`：板橋林家花園秋分漏窗日影幾何案 (秋分太陽高度角 66.5° 相似三角形日影直線投影、探針金屬斷面)
   - `CASE-06`：西門町超商冷藏櫃隱形指紋竊案 (4°C 低溫遇熱水汽露點凝結光學散射顯影指紋、365nm UV 螢光卡片)
   - `CASE-07`：捷運板南線末班車急煞調包案 (牛頓第一運動定律慣性向量、反向抓握立柱勒痕、防滑登山鞋底)
   - `CASE-08`：大稻埕百年中藥鋪消失的人蔘 (等臂中藥天平、排水量筒阿基米德浮力與密度 D=M/V 測量中空砝碼)
   - `CASE-09`：雙北 307 公車急煞皮夾調包案 (車輛右轉向心加速度與假想離心力左偏向量、金屬探測器鞋跟暗槽)
   - `CASE-10`：大安森林公園雨夜泥地無腳印案 (物理壓強 P=F/A、土壤剪切強度極限、2000cm² 軟木底板草葉折痕)

3. **【三軌物證背包與三軌取得機制】**：
   - 軌道一：生活實體道具 (雙北紀念悠遊卡 TPASS 1200 暢行版、純棉環保購物袋、隨行杯、調查筆記本)
   - 軌道二：專業鑑識器材 (多倍率光學放大鏡、廣用 pH 試紙、365nm UV 手電筒、蒸氣顯影箱、排水量筒、金屬探測器等)
   - 軌道三：關鍵案件物證 (翻倒咖啡杯、矽膠軟管、石磚、中空砝碼、晶片手袋等)
   - 取得三途徑：💰 門市購買享 85 折優惠（外送加收 10 元）、🏛️ 科教館/市圖免費科普借用、🥚 案發 50~100m 生活圈彩蛋拾獲。

4. **【生活科學鑑識與 108 課綱自然科學深度融合】**：
   - 內建 `runPhTitration`、`runArchimedesDensity`、`runPressureCalculation`、`runInertiaVectorAnalysis`、`runAcousticDelayCalculation`。
   - 物證必須使用對應科普器材化驗，解鎖客觀實徵數據，杜絕憑空瞎猜。

5. **【雙北真實通勤與嚴格防瞬移】**：
   - 依據經緯度以 Haversine 公式計算真實物理距離。
   - 實體步行：以 4.5 km/h 步速推進並消耗體力，過度疲勞無法行動。
   - 大眾運輸：台北捷運官方里程票價階梯 (20~65元)、公車段次計費 (15/30元)、轉乘優惠 (折8元)、YouBike 2.0、基北北桃 TPASS 1200 暢行扣款。
   - 🈲 憲法級最高禁令：嚴禁任何瞬移傳送，瞬移請求一律回傳 403 禁令攔截！

6. **【思維推理板、指控驗證與雙北歷史懸案檔案庫】**：
   - 評定 S (名譽特等調查員) / A (優良調查報告) / B (合規破案) / F 結案等級。
   - 破案自動解鎖動森感特產擺設（淡水渡船木雕、迪化街藥櫃、北投檜木桶、西門滑板等）。
   - 零劇透冷案封存：案件逾期或暫停時，答案絕不對外公開，加蓋「未破懸案」官印移入歷史冷案庫。

7. **【地圖系統 (Antigravity) 雙向協同事件橋樑】**：
   - 依據 `src/bridge/EventContracts.js` 與 `src/bridge/MapBridge.js` 實現 Pub/Sub 事件解耦。
   - 支援警戒搜查圈派發與地圖閃爍物證生成移除（註：防嚇馬賽克已依委託人指示取消，案件現場一律自然清晰呈現）。

---

## 🚫 二、 三大最高憲法級絕對禁忌

在專案任何程式碼、註解、文件、介面或日誌中，**100% 嚴格遵守**：
1. 稱謂一律使用「都會調查員」(Investigator) 或「市民」，嚴禁任何少年稱謂。
2. 永久絕對嚴禁違規舊名，連音同字皆全面禁止。
3. 嚴禁任何歷史廢除職稱。
4. 嚴禁瞬移傳送，移動皆具備物理空間與大眾運輸真實性。

---

## 🚀 三、 快速啟動與測試

```bash
# 1. 執行 10 大階段全流程與禁忌自動化稽核測試
npm test

# 2. 啟動獨立可視化調查員測試伺服器 (Port 3001)
npm start
```

開啟瀏覽器訪問：`http://localhost:3001` 即可進入視覺化工作台。

---

## 📁 四、 架構目錄說明

- `src/core/`：核心推理與狀態機（CaseManager, EvidenceEngine, DeductionBoard, TrustSystem）
- `src/player/`：調查員角色（Investigator）、三軌背包（Inventory）與減塑悠遊卡錢包（EcoWallet）
- `src/storyline/`：模組化非寫死劇情引擎（StoryLoader, DialogueEngine）
- `src/data/`：純 JSON 劇情、案件、涉案人與道具配置（cases, dialogues, npcs, items）
- `src/bridge/`：地圖系統協同事件協議（MapBridge, EventContracts）
- `public/`：獨立可視化測試工作台（index.html）
- `server.js`：RESTful API 伺服器
- `test/`：10 大階段自動化驗證腳本
