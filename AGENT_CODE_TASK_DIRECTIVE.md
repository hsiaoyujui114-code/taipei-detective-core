# 🕵️【都會調查員偵探核心系統】給 Agent `code` 的正式開發任務委託書

致 Agent `code`：

委託人已正式下達指令，由你負責《雙北漫遊：都會行蹤》專案中的**「偵探核心系統」**開發工作。
地圖系統（雙北 1:1 真實網路地圖、4 軌即時 GPS、施工狀態、道路階層）由 Antigravity 負責維護，**請你在此專屬獨立倉庫內研發偵探系統，先不要放到地圖上**。

---

## 📌 一、 專案環境與倉庫資訊

- **工作目錄 (CWD)**：`/Users/home/crew-deck-role/ai-engineer/taipei-detective-core`
- **GitHub 遠端倉庫**：`https://github.com/hsiaoyujui114-code/taipei-detective-core.git`（已初始化並推送至 main 分支）
- **伺服器版本運行**：
  - 獨立伺服器：在目錄下執行 `node server.js`（`http://localhost:3001`）
  - 主地圖伺服器聯調：`http://localhost:3000/detective`（已同步掛載本核心與 API）
- **測試命令**：`npm test`（執行 `test/detective.test.js`）

---

## 🚫 二、 三大最高憲法級絕對禁忌 (CRITICAL FORBIDDEN RULES)

在撰寫程式碼、註解、文檔、對白或日誌時，**必須 100% 遵守，絕不可違背**：

1. **🈲 嚴格禁用「少年偵探」稱呼**：
   - 委託人明確表達極度反感此稱呼！所有變數、註解、介面文字、NPC 對白，**一律稱呼「都會調查員」(Investigator) 或「市民」**。
2. **🈲 嚴格禁用「藝碩／益碩」稱謂（永久最高絕對禁忌）**：
   - 委託人明確下達指令：「就算改成什麼市民的，我希望不要有『藝碩』，什麼市民藝碩、什麼都會教授藝碩的，我都不要『藝碩』這個名字！」全專案全域 100% 絕對嚴禁出現！
3. **🈲 嚴禁歷史廢除職稱**：
   - 嚴禁出現「工讀生」、「實習生」、「小幫手」等詞彙。
4. **🈲 嚴禁瞬移傳送**：
   - 玩家移動需實體步行或搭乘大眾運輸。

---

## 📋 三、 委託人指定之核心規格要求

1. **【不要先做簡單版本，請直接依照企劃書上面寫的方法做出來】**：
   - 參考企劃書 `/Users/home/crew-deck-role/ai-engineer/taipei-metro-detective-rpg/PROJECT_PROPOSAL.md` 第 01A、04、04B、06、07 節。
   - 實裝生活科學鑑識（廣用 pH 試紙酸鹼滴定、365nm UV 紫外光防偽激發、光學放大鏡微痕、熱敏顯影等）。
   - 實裝三軌背包（日常道具、鑑識器材、關鍵物證）。
   - 實裝悠遊卡儲值扣款 ✕ TPASS 1200 ✕ 環保減塑綠色積分（自備購物袋、環保杯省 5 元、無紙化發票）。
   - 實裝思維推理板與指控驗證（評定 S/A/B 結案等級）。
   - 實裝社區信賴度 Lv.1~Lv.5。

2. **【劇情模組化，嚴禁寫死在程式碼中 (Data-Driven)】**：
   - 委託人指示：「劇情部分可以先做，但之後我可能還會改，所以劇情的程式碼先不要寫死。」
   - 所有案件檔案必須放在 `src/data/cases/`（JSON），對話樹在 `src/data/dialogues/`，嫌疑人在 `src/data/npcs/`，道具在 `src/data/items/`。
   - 核心邏輯引擎 (`StoryLoader.js`, `DialogueEngine.js`) 保持純資料驅動，方便委託人隨時更換案情與台詞。

3. **【GitHub 與伺服器版本並行】**：
   - 完成功能後立即執行 `git add . && git commit -m "..." && git push origin main`。
   - 保持本機伺服器與可視化工作台 (`public/index.html`) 可即時預覽。

4. **【與地圖系統（Antigravity）協同對接】**：
   - 依據 `src/bridge/EventContracts.js` 與 `src/bridge/MapBridge.js` 處理雙向事件。
   - 每次有新增對接接口或資料結構，請在交付時說明，以便 Antigravity 同步跟進地圖端修改。

---

## 🚀 四、 立即開始工作清單

1. 切換至 `/Users/home/crew-deck-role/ai-engineer/taipei-detective-core`。
2. 閱讀 `README.md`、`CLAUDE_DEVELOPER_GUIDE.md` 與現有 `src/` 程式碼。
3. 執行 `node test/detective.test.js` 確認基礎測試通過。
4. 繼續擴充實裝企劃書中的示範案件（如 Case 04 北投溫泉空白遺書熱敏案、Case 05 板橋林家花園日影幾何案、Case 07 板南線急煞調包案等），並擴展對話樹與鑑識工具邏輯。
5. 完成後提交 Git Commit 並推送至 GitHub，向委託人回報進度！
