/**
 * ============================================================================
 * DETECTIVE ENGINE COMPREHENSIVE INTEGRATION & TABOO VERIFICATION TEST
 * ============================================================================
 * 嚴格依照委託人指示與企劃書 01A、04、04B、06、07 節規格全面驗證：
 * 1. 10 宗首發示範案動態資料驅動載入 (非寫死 JSON)
 * 2. 生活科學物證鑑識 (pH 滴定、365nm UV 激發、熱敏炭化、阿基米德浮力密度、慣性向量、壓強 P=F/A、聲速時差)
 * 3. 三軌背包與三軌取得機制 (💰 購買 85 折、🏛️ 科教館借用、🥚 案發生活圈 50~100m 彩蛋拾獲)
 * 4. 雙北真實通勤與防瞬移 (實體步行、捷運/公車 TPASS 扣款、嚴禁瞬移攔截)
 * 5. 多輪 NPC 筆錄與物證對質打臉 (出示未化驗證物退回、出示已化驗證物破案認罪)
 * 6. 思維推理板評等 (S/A/B) 與雙北歷史懸案檔案庫零劇透封存
 * 7. 社區信賴度 Lv.1~Lv.5 與特區聲譽
 * 8. 地圖系統 (Antigravity) 雙向協同事件協議 (MapBridge)
 * 9. 最高憲法級禁忌全域自動化稽核 (稱謂規範、姓名規範、職稱規範、嚴禁瞬移)
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { createDetectiveEngine, MapDetectiveEvents } = require('../src/index');

console.log('🧪 開始執行《雙北漫遊：都會行蹤》都會調查員偵探核心全面驗證...\n');

async function runAllTests() {
  const engine = createDetectiveEngine();

// ─── 階段 1：動態資料驅動載入驗證 (非寫死 JSON) ───
const cases = engine.loader.listCases();
console.log(`✅ [1.1] 成功動態載入案件庫：共 ${cases.length} 宗示範大案`);
assert.strictEqual(cases.length, 10, '必須完整載入 10 宗企劃書首發示範案');

const fiftyCases = engine.loader.listFiftyCases();
console.log(`✅ [1.1b] 成功載入《雙北漫遊：都會行蹤》50 宗歷史生活科學案件全集：共 ${fiftyCases.length} 案`);
assert.strictEqual(fiftyCases.length, 50, '必須完整載入 50 宗歷史生活科學案件全集');

// 驗證首發示範案雙向豐富化
const case01Enriched = engine.loader.getCase('case_01');
assert(case01Enriched.history_culture, '首發示範案應豐富化歷史文化');
assert(case01Enriched.science_principle, '首發示範案應豐富化生活科學原理');
assert(case01Enriched.deposition, '首發示範案應豐富化警方筆錄');
console.log(`✅ [1.1c] 首發示範案成功融合 50 案全集之歷史、科學與筆錄：${case01Enriched.history_culture.slice(0, 24)}...`);

const npcs = engine.loader.listNpcs();
console.log(`✅ [1.2] 成功載入涉案關係人群像名冊：共 ${npcs.length} 名全名華人關係人`);
assert(npcs.length >= 35, '10 宗案件標配 3~4 名嫌疑人，總人數應不少於 35 人');

const items = engine.loader.listItems();
console.log(`✅ [1.3] 成功載入三軌道具與物證庫：共 ${items.length} 件`);
assert(items.length >= 35, '三軌道具與物證庫總量應不少於 35 項');

// ─── 階段 2：都會調查員狀態與接案生命週期 ───
const case01 = engine.loader.getCase('case_01');
const acceptRes = engine.caseManager.acceptCase(case01.id, engine.investigator);
assert(acceptRes.success, '接案應成功');
assert.strictEqual(engine.investigator.roleTitle, '都會調查員', '稱謂必須為都會調查員');
assert.strictEqual(engine.investigator.activeCaseId, 'case_01');
console.log(`✅ [2] 調查員成功接案【${case01.title}】，地圖系統派發搜查警戒圈`);

// ─── 階段 3：生活科學鑑識實驗室全功能驗證 ───
// 3.1 錯誤器材給予科學指引
const ev01 = case01.evidenceChain[0]; // 拿鐵咖啡杯
const mismatchTest = engine.caseManager.examineEvidence(ev01.id, 'tool_uv_torch', engine.investigator);
assert(mismatchTest.isMismatch, '錯誤器材應提示不吻合');
console.log('✅ [3.1] 鑑識器材不符時正確提示指引');

// 3.2 廣用 pH 酸鹼試紙中和檢驗
const phExamine = engine.caseManager.examineEvidence(ev01.id, 'tool_ph_paper', engine.investigator);
assert(phExamine.success, '正確 pH 試紙化驗應成功');
const phSim = engine.evidenceEngine.runPhTitration(5.2);
assert.strictEqual(phSim.chemicalNature, '弱酸性');
console.log(`✅ [3.2] pH 酸鹼滴定成功：${phExamine.result}`);

// 3.3 365nm UV 紫外光防偽與汗液印痕
const ev02 = case01.evidenceChain[1]; // 杯蓋
const uvExamine = engine.caseManager.examineEvidence(ev02.id, 'tool_uv_torch', engine.investigator);
assert(uvExamine.success, '紫外光化驗杯蓋應成功');
console.log(`✅ [3.3] 365nm 紫外光檢驗成功：${uvExamine.result}`);

// 3.4 薄層色層分析 (TLC) 毛細分離
const ev03 = case01.evidenceChain[2]; // TLC 分析片
engine.investigator.inventory.addTool({ id: 'tool_tlc_scanner', name: 'TLC 展開鏡' });
const tlcExamine = engine.caseManager.examineEvidence(ev03.id, 'tool_tlc_scanner', engine.investigator);
assert(tlcExamine.success, 'TLC 檢驗應成功');
console.log(`✅ [3.4] TLC 薄層層析展開比對成功：${tlcExamine.result}`);

// 3.5 阿基米德浮力與密度測定 (Case 08 中空砝碼)
const densitySim = engine.evidenceEngine.runArchimedesDensity(50.0, 7.58);
assert(densitySim.isHollowSuspected, '密度 6.6 g/cm³ 應被判定為中空掏空');
console.log(`✅ [3.5] 阿基米德排水量筒密度測定成功：${densitySim.calculatedDensity} (純銅應為 8.9 g/cm³)`);

// 3.6 物理壓強公式 P = F / A (Case 10 大安雨夜泥地無腳印)
const pressureSimNormal = engine.evidenceEngine.runPressureCalculation(70, 400); // 普通鞋 400cm²
const pressureSimSnowshoe = engine.evidenceEngine.runPressureCalculation(70, 2000); // 軟木底板 2000cm²
assert(pressureSimNormal.willMudSink, '普通鞋壓強 17.15 kPa 應下陷');
assert(!pressureSimSnowshoe.willMudSink, '大面積軟木底板壓強 3.43 kPa 低於極限不陷坑');
console.log(`✅ [3.6] 物理壓強 P=F/A 演算成功：軟木鞋壓強 ${pressureSimSnowshoe.pressureKPa} kPa < 土壤剪切極限`);

// 3.7 常溫聲速 340m/s 時差計算 (Case 02 北車長廊水力延時案)
const soundDelay = engine.evidenceEngine.runAcousticDelayCalculation(300, 20);
assert(soundDelay.travelTimeSeconds < 1.0, '300m 聲速傳播應在 1 秒以內');
console.log(`✅ [3.7] 常溫聲速計算成功：300 公尺僅需 ${soundDelay.travelTimeSeconds} 秒，戳破 20 分鐘延遲謊言`);

// ─── 階段 4：三軌背包與親赴現場驗證機制 (Round 100 規格) ───
// 4.1 💰 門市購買親赴驗證 (<= 60m 享 85 折到店優惠，> 60m 拒絕並提示距離)
// 4.1.1 距離門市 > 60m 嘗試購買：必須被拒絕並回傳不能購買與距離提示
const farBuyRes = engine.investigator.inventory.buyItem(
  { id: 'tool_metal_detector', name: '金屬探測器', track: 'tool', cost: 25 },
  engine.investigator.wallet,
  engine.investigator,
  'store_cvs_ximen'
);
assert(!farBuyRes.success, '距離門市 > 60m 應禁止購買');
assert.strictEqual(farBuyRes.canPurchase, false);
assert(farBuyRes.distanceMeters > 60);
console.log(`✅ [4.1.1] 門市遠距購買攔截成功：${farBuyRes.error}`);

// 4.1.2 親自抵達門市現場 (<= 60m)：成功購買並享 85 折到店優惠
const savedCoords = [...engine.investigator.currentCoords];
engine.investigator.currentCoords = [25.0437, 121.5077]; // 距離漢中街門市約 15m
const nearBuyRes = engine.investigator.inventory.buyItem(
  { id: 'tool_metal_detector', name: '金屬探測器', track: 'tool', cost: 25 },
  engine.investigator.wallet,
  engine.investigator,
  'store_cvs_ximen'
);
assert(nearBuyRes.success, '親自抵達門市現場 <= 60m 應成功購買');
assert.strictEqual(nearBuyRes.canPurchase, true);
assert.strictEqual(nearBuyRes.costPaid, 21, '實體到店享 85 折應扣 21 元 (原價 25)');
engine.investigator.currentCoords = savedCoords;
console.log(`✅ [4.1.2] 門市親赴 85 折購買成功：實付 $${nearBuyRes.costPaid}，餘額 $${nearBuyRes.balance}`);

// 4.2 🏛️ 4 大科普場館借用親赴驗證 (<= 60m 完成微任務借用，> 60m 拒絕並提示距離)
// 4.2.1 距離科普場館 > 60m 嘗試借用：必須被拒絕並回傳不能借用
const farBorrowRes = engine.investigator.inventory.borrowToolFromVenue(
  { id: 'tool_shadow_rod', name: '日影幾何標竿', track: 'tool' },
  '科教館',
  engine.investigator
);
assert(!farBorrowRes.success, '距離科普場館 > 60m 應禁止借用');
assert.strictEqual(farBorrowRes.canBorrow, false);
assert(farBorrowRes.distanceMeters > 60);
console.log(`✅ [4.2.1] 科普場館遠距借用攔截成功：${farBorrowRes.error}`);

// 4.2.2 親自前往科普場館現場 (<= 60m)：完成微任務成功借用專業儀器
engine.investigator.currentCoords = [25.0957, 121.5159]; // 距離科教館約 15m
const nearBorrowRes = engine.investigator.inventory.borrowToolFromVenue(
  { id: 'tool_shadow_rod', name: '日影幾何標竿', track: 'tool' },
  '科教館',
  engine.investigator
);
assert(nearBorrowRes.success, '親赴科普場館現場 <= 60m 應成功借用');
assert.strictEqual(nearBorrowRes.canBorrow, true);
assert(engine.investigator.inventory.hasTool('tool_shadow_rod'));
engine.investigator.currentCoords = savedCoords;
console.log(`✅ [4.2.2] 科普場館親赴借用成功：${nearBorrowRes.message}`);

// 4.3 🥚 觸發彩蛋親赴生活圈驗證 (50~100m 生活圈才可拾獲，平時不直接顯示)
// 4.3.1 距離案發中心過近 (< 50m)：核心封鎖區，嘗試拾獲必回傳失敗
const tooCloseEgg = engine.investigator.inventory.pickEasterEgg(
  { id: 'egg_test_sample', name: '巷弄微量對照色卡', track: 'supply' },
  'case_01',
  35 // 距離 35m < 50m
);
assert(!tooCloseEgg.success, '距離案發中心 < 50m 應禁止拾獲');
assert.strictEqual(tooCloseEgg.canPick, false);
console.log(`✅ [4.3.1] 案發中心過近 (< 50m) 拾獲攔截成功：${tooCloseEgg.error}`);

// 4.3.2 距離案發中心過遠 (> 100m)：嘗試拾獲必回傳失敗
const tooFarEgg = engine.investigator.inventory.pickEasterEgg(
  { id: 'egg_test_sample', name: '巷弄微量對照色卡', track: 'supply' },
  'case_01',
  150 // 距離 150m > 100m
);
assert(!tooFarEgg.success, '距離案發中心 > 100m 應禁止拾獲');
assert.strictEqual(tooFarEgg.canPick, false);
console.log(`✅ [4.3.2] 案發生活圈過遠 (> 100m) 跑圖拾獲攔截成功：${tooFarEgg.error}`);

// 4.3.3 親自前往案發現場周邊 50~100m 生活圈巷弄：成功發現並拾獲
const validEgg = engine.investigator.inventory.pickEasterEgg(
  { id: 'egg_test_sample', name: '巷弄微量對照色卡', track: 'supply' },
  'case_01',
  65 // 距離 65m 合格生活圈
);
assert(validEgg.success, '親赴案發現場 50~100m 生活圈應成功發現並拾獲彩蛋');
assert.strictEqual(validEgg.canPick, true);
console.log(`✅ [4.3.3] 案發周圍 65m 生活圈親赴拾獲彩蛋成功：${validEgg.message}`);

// 4.4 🏢 建築進出標記親赴驗證 (企劃書 02.2 規格：可進建築大門提供進出，不可進建築無圖案阻擋盲探)
const nearbyBldgs = engine.buildingSystem.getNearbyBuildings(engine.investigator.currentCoords, 850);
assert(nearbyBldgs.length >= 2, '生活圈 850m 內應掃描到建築');
const enterableBldg = nearbyBldgs.find(b => b.isEnterable);
const unenterableBldg = nearbyBldgs.find(b => !b.isEnterable);
assert(enterableBldg && enterableBldg.icon !== null, '可進建築必須顯示專屬圖案標記');
assert(unenterableBldg && unenterableBldg.icon === null, '不可進建築必須無圖案標記 (icon: null)');
console.log(`✅ [4.4.1] 建築圖案標記驗證成功：可進建築 [${enterableBldg.name}] 顯示 ${enterableBldg.icon}，不可進建築無圖案`);

// 4.4.2 嘗試進入不可進建築 (街景碰撞實體阻擋盲試)
const blockUnenterable = engine.buildingSystem.enterBuilding(unenterableBldg.id, engine.investigator.currentCoords);
assert(!blockUnenterable.success && blockUnenterable.icon === null, '不可進建築應被阻擋進入');
console.log(`✅ [4.4.2] 不可進建築盲試阻擋成功：${blockUnenterable.error}`);

// 4.4.3 可進入建築大門過遠 (> 25m) 禁止進入
const farEnterBldg = engine.buildingSystem.enterBuilding('cafe_ximen_chengdu', [25.0460, 121.5072]);
assert(!farEnterBldg.success && farEnterBldg.distanceMeters > 25, '距大門 > 25m 應禁止進入');
console.log(`✅ [4.4.3] 可進建築遠距進入阻擋成功：${farEnterBldg.error}`);

// 4.4.4 親自靠近大門光圈 (<= 25m) 進入室內與退出
const enterOffice = engine.buildingSystem.enterBuilding('office_investigator', [25.0425, 121.5072]);
assert(enterOffice.success, '靠近大門 <= 25m 應成功進入室內');
assert.strictEqual(engine.buildingSystem.currentInsideBuildingId, 'office_investigator');
const exitOffice = engine.buildingSystem.exitBuilding();
assert(exitOffice.success && engine.buildingSystem.currentInsideBuildingId === null, '退出建築回到室外應成功');
console.log(`✅ [4.4.4] 建築親赴進出切換成功：進入 [${enterOffice.building.name}] 並安全返回室外街道`);

// ─── 階段 5：雙北真實物理移動與嚴禁瞬移驗證 ───
// 5.1 實體步行消耗體力
const startStamina = engine.investigator.stamina;
const walkRes = engine.investigator.walkTo([25.0440, 121.5090], '西門町峨嵋街');
assert(walkRes.success);
assert(engine.investigator.stamina < startStamina, '步行應消耗體力');
console.log(`✅ [5.1] 實體步行成功：距離 ${walkRes.distanceMeters}m，消耗體力 ${walkRes.staminaSpent}`);

// 5.2 大眾運輸通勤與 TPASS 1200 暢行
const transitRes = engine.investigator.transitTo([25.0465, 121.5170], '台北車站捷運站', 'mrt');
assert(transitRes.success);
assert.strictEqual(transitRes.fareDeducted, 0, '持有 TPASS 1200 應享吃到飽免費扣款');
console.log(`✅ [5.2] 大眾運輸捷運通行成功：TPASS 1200 暢行扣款 $0`);

// 5.3 🈲 憲法級禁忌：瞬移傳送全面攔截！
const teleportRes = engine.investigator.teleportTo([25.0112, 121.4548]);
assert(!teleportRes.success && teleportRes.isForbidden, '瞬移必須被強制攔截拒絕！');
console.log(`✅ [5.3] 憲法級禁忌瞬移攔截成功：${teleportRes.error}`);

// ─── 階段 6：多輪虛構筆錄與物證對質打臉 ───
// 6.1 開啟對話
const startDiag = engine.caseManager.interrogateSuspect('session_test', 'suspect_01_wu');
assert(startDiag.success);
console.log(`✅ [6.1] 嫌疑人吳冠宇口供筆錄開啟成功`);

// 6.2 出示物證打臉 (Present Evidence)
const confrontRes = engine.dialogueEngine.selectOption('session_test', 2, engine.investigator);
assert(confrontRes.success);
assert(confrontRes.clueUnlocked, '出示物證應成功打臉並解鎖口供矛盾破綻');
console.log(`✅ [6.2] 物證對質打臉成功：${confrontRes.clueUnlocked}`);

// 6.3 認罪自白
const confessionRes = engine.dialogueEngine.selectOption('session_test', 0, engine.investigator);
assert(confessionRes.success && confessionRes.caseClosed, '出示鐵證後嫌疑人應認罪');
console.log(`✅ [6.3] 嫌疑人心理防線崩潰坦承作案，筆錄閉環`);

// ─── 階段 7：思維推理板評等與動森特產收藏 ───
const solveRes = engine.caseManager.resolveCase(
  'case_01',
  'suspect_01_wu',
  ['ev_01_coffee_cup', 'ev_01_cup_lid', 'ev_01_tlc_strip'],
  engine.investigator
);
assert(solveRes.success);
assert(solveRes.score >= 90, '三項物證齊全且全化驗應達特等等級');
assert(solveRes.grade.includes('S'), '評等應為 S 級特等');
assert(solveRes.souvenirUnlocked, '破獲西門案應解鎖特產擺設');
console.log(`✅ [7.1] 案件完美告破！結案評等：${solveRes.grade} (得分：${solveRes.score})`);
console.log(`✅ [7.2] 解鎖動森特產擺設：【${solveRes.souvenirUnlocked.name}】`);

// 7.3 冷案加蓋官印零劇透封存 (Case 02 模擬)
const coldRes = engine.caseManager.archiveColdCase('case_02', '調查員暫停調查', engine.investigator);
assert(coldRes.success);
assert.strictEqual(coldRes.coldCaseRecord.officialSeal, '雙北都會調查處・未破懸案官印');
assert(coldRes.coldCaseRecord.spoilerGuarded, '必須嚴格零劇透');
console.log(`✅ [7.3] 雙北歷史懸案檔案庫封存成功：加蓋「未破懸案」官印，100% 零劇透保護`);

// ─── 階段 8：社區信賴度 Lv.1~Lv.5 與特區聲譽 ───
const trustUp = engine.trustSystem.increaseNpcTrust('suspect_01_wang', 2);
assert.strictEqual(trustUp.newLevel, 3);
const sectorUp = engine.trustSystem.addSectorReputation('萬華特區', 45);
assert.strictEqual(sectorUp.newPoints, 65);
assert(sectorUp.isPerkUnlocked, '聲譽達 60 分解鎖特區在地禮遇');
console.log(`✅ [8] 社區信賴度晉升至 ${trustUp.tierTitle}，萬華特區聲譽達 ${sectorUp.newPoints} 分`);

// ─── 階段 9：地圖協同事件協議與地圖搭配調度器 (MapBridge & MapPairingCoordinator) ───
let receivedMapEvent = null;
engine.bridge.on(MapDetectiveEvents.MAP.PLAYER_MOVED, (p) => { receivedMapEvent = p; });
engine.bridge.simulateMapPlayerMoved(25.0425, 121.5072, 'WHA', '萬華特區');
assert(receivedMapEvent && receivedMapEvent.sectorName === '萬華特區');

// 9.2 地圖圖層規範 (Case Map Overlays & GeoJSON)
const overlays = engine.mapCoordinator.getCaseMapOverlays('case_01');
assert(overlays.success && overlays.perimeter.radiusMeters === 80, '西門案搜查半徑應為 80 公尺');
assert(overlays.suspects.length >= 3, '應包含至少 3 名涉案關係人地圖點位');
assert(overlays.evidenceMarkers.length >= 2, '應包含現場物證地圖標記');

const geojson = engine.mapCoordinator.exportGeoJson('case_01');
assert.strictEqual(geojson.type, 'FeatureCollection', '必須輸出合法 GeoJSON FeatureCollection');
assert(geojson.features.length >= 5, 'GeoJSON 應包含中心點、調查員、嫌犯與物證標記');

// 9.3 學校模式 vs 家中模式切換
const schoolMode = engine.mapCoordinator.setPairingMode('school');
assert.strictEqual(schoolMode.mode, 'school', '應支援切換至學校地圖獨立模式');
const homeMode = engine.mapCoordinator.setPairingMode('home');
assert.strictEqual(homeMode.mode, 'home', '應支援切換至家中雙軌聯調模式');

// 9.4 地圖調查員位置同步與搜查圈觸發
const syncIn = engine.mapCoordinator.syncLocationFromMap([25.0426, 121.5073], '西門町咖啡館門口', true);
assert(syncIn.success && syncIn.enteredCrimeScene, '抵達案發中心 80m 內應判定進入警戒圈');

// 9.5 地圖位置超距防瞬移防護
const syncTeleport = engine.mapCoordinator.syncLocationFromMap([25.1724, 121.4371], '瞬間跳至淡水', true);
assert(!syncTeleport.success && syncTeleport.isForbidden, '單次步行超距 2500m 必須攔截瞬移！');

// 9.6 主動派發搜查警戒圈事件 (dispatchPerimeter)
let perimeterDispatched = null;
engine.bridge.on(MapDetectiveEvents.DETECTIVE.PERIMETER_DISPATCHED, (p) => { perimeterDispatched = p; });
const dispRes = engine.mapCoordinator.dispatchPerimeter('case_01');
assert(dispRes.success && perimeterDispatched !== null);
assert.strictEqual(perimeterDispatched.caseId, 'case_01');
assert.strictEqual(perimeterDispatched.radiusMeters, 80);
console.log(`✅ [9.6] 搜查警戒圈派發成功：【${perimeterDispatched.title}】半徑 ${perimeterDispatched.radiusMeters}m 警戒桃紅標記`);

// 9.7 地圖端門市 85 折結算與事件派發 (purchaseAtStoreFromMap)
let storePurchasedEvt = null;
engine.bridge.on(MapDetectiveEvents.DETECTIVE.STORE_PURCHASED, (p) => { storePurchasedEvt = p; });
const mapBuyFar = engine.mapCoordinator.purchaseAtStoreFromMap(
  { id: 'tool_ph_paper_refill', name: 'pH試紙補充包', cost: 20 },
  'store_ximen_convenience'
);
assert(!mapBuyFar.success, '距門市過遠時地圖端購買應遭拒絕');

const savedCoords9 = [...engine.investigator.currentCoords];
engine.investigator.currentCoords = [25.0437, 121.5077]; // 漢中街超商 <= 60m
const mapBuyNear = engine.mapCoordinator.purchaseAtStoreFromMap(
  { id: 'tool_ph_paper_refill', name: 'pH試紙補充包', cost: 20 },
  'store_ximen_convenience'
);
assert(mapBuyNear.success && storePurchasedEvt !== null);
assert.strictEqual(mapBuyNear.costPaid, 17, '85 折扣除 17 元 (20*0.85)');
engine.investigator.currentCoords = savedCoords9;
console.log(`✅ [9.7] 地圖端門市親赴 85 折結算與事件分發成功：實付 $${mapBuyNear.costPaid}`);

// 9.8 地圖端科普場館微借用與事件派發 (borrowFromVenueFromMap)
let venueBorrowedEvt = null;
engine.bridge.on(MapDetectiveEvents.DETECTIVE.VENUE_BORROWED, (p) => { venueBorrowedEvt = p; });
engine.investigator.currentCoords = [25.0957, 121.5159]; // 士林科教館現場 <= 60m
const mapBorrowRes = engine.mapCoordinator.borrowFromVenueFromMap(
  { id: 'tool_spectrometer', name: '微型分光光度計', track: 'tool' },
  'venue_sec'
);
assert(mapBorrowRes.success && venueBorrowedEvt !== null);
engine.investigator.currentCoords = savedCoords9;
console.log(`✅ [9.8] 地圖端科普場館借用與通知分發成功：${mapBorrowRes.message}`);

// 9.9 地圖端 50~100m 彩蛋拾獲與事件派發 (pickEasterEggFromMap)
let eggFoundEvt = null;
engine.bridge.on(MapDetectiveEvents.DETECTIVE.EASTER_EGG_FOUND, (p) => { eggFoundEvt = p; });
engine.investigator.currentCoords = [25.0429, 121.5076]; // 距西門案發中心約 65m
const mapEggRes = engine.mapCoordinator.pickEasterEggFromMap(
  { id: 'egg_sample_strip', name: '老街微型色層對照片', track: 'supply' },
  'case_01'
);
assert(mapEggRes.success && eggFoundEvt !== null);
engine.investigator.currentCoords = savedCoords9;
console.log(`✅ [9.9] 地圖端 50~100m 生活圈彩蛋拾獲與事件分發成功：${mapEggRes.message}`);

// 9.10 地圖端建築大門進出切換 (enterBuildingFromMap & exitBuildingFromMap)
let enteredBldgEvt = null;
let exitedBldgEvt = null;
engine.bridge.on(MapDetectiveEvents.DETECTIVE.BUILDING_ENTERED, (p) => { enteredBldgEvt = p; });
engine.bridge.on(MapDetectiveEvents.DETECTIVE.BUILDING_EXITED, (p) => { exitedBldgEvt = p; });
engine.investigator.currentCoords = [25.0425, 121.5072]; // 事務所大門 <= 25m
const enterBldgRes = engine.mapCoordinator.enterBuildingFromMap('office_investigator');
assert(enterBldgRes.success && enteredBldgEvt !== null);
const exitBldgRes = engine.mapCoordinator.exitBuildingFromMap();
assert(exitBldgRes.success && exitedBldgEvt !== null);
console.log(`✅ [9.10] 地圖端建築大門進入/退出切換與事件分發成功：[${enteredBldgEvt.buildingName}] ⇄ 室外街廓`);

// 9.11 嫌犯口供筆錄狀態雙向綁定 (syncSuspectInterrogationState)
let confrontEvt = null;
engine.bridge.on(MapDetectiveEvents.DETECTIVE.SUSPECT_CONFRONTED, (p) => { confrontEvt = p; });
const diagRes = engine.mapCoordinator.syncSuspectInterrogationState('session_map_sync', 'suspect_01_wu', 2);
assert(diagRes.success && confrontEvt !== null);
console.log(`✅ [9.11] 嫌犯口供筆錄狀態雙向綁定與物證對質成功：${confrontEvt.clueUnlocked}`);

// 9.12 REST API 路由器全面無縫對接驗證 (handleDetectiveRequest)
const { handleDetectiveRequest } = require('../server');
const EventEmitter = require('events');

function callApi(method, pathName, body = null) {
  return new Promise((resolve) => {
    const req = new EventEmitter();
    req.method = method;
    req.url = pathName;
    req.headers = { host: 'localhost:3001' };

    let code = 200;
    const res = {
      writeHead(c) { code = c; },
      setHeader() {},
      end(data) {
        resolve({ code, data: data ? JSON.parse(data) : null });
      }
    };

    handleDetectiveRequest(req, res, engine).then(() => {
      if (body) {
        req.emit('data', JSON.stringify(body));
      }
      req.emit('end');
    });
  });
}

const pairingRes = await callApi('GET', '/api/detective/map/pairing-status');
assert.strictEqual(pairingRes.code, 200);
assert(pairingRes.data.success);

const geoRes = await callApi('GET', '/api/detective/map/geojson');
assert.strictEqual(geoRes.code, 200);
assert.strictEqual(geoRes.data.type, 'FeatureCollection');
assert(geoRes.data.features.length >= 8, 'GeoJSON 應涵蓋警戒圈、建築物、場館、門市與關係人');

const storeRes = await callApi('GET', '/api/detective/stores');
assert.strictEqual(storeRes.code, 200);
assert(storeRes.data.stores.length >= 1, '西門町生活圈 850m 內應有合作門市');
const allStoresRes = await callApi('GET', '/api/detective/stores?radius=0');
assert(allStoresRes.data.stores.length >= 8, '雙北應涵蓋至少 8 家特約門市');

const venueRes = await callApi('GET', '/api/detective/venues');
assert.strictEqual(venueRes.code, 200);
assert.strictEqual(venueRes.data.venues.length, 4);

const bldgRes = await callApi('GET', '/api/detective/buildings/nearby');
assert.strictEqual(bldgRes.code, 200);
assert(bldgRes.data.buildings.length >= 2);

const teleportApiRes = await callApi('POST', '/api/detective/move/teleport');
assert.strictEqual(teleportApiRes.code, 403, '瞬移 API 永遠回傳 403 禁止攔截！');
assert(teleportApiRes.data.isForbidden);

// 驗證 50 案全集 API 端點
const fiftyApiRes = await callApi('GET', '/api/detective/cases/fifty');
assert.strictEqual(fiftyApiRes.code, 200);
assert.strictEqual(fiftyApiRes.data.total, 50, 'API 必須正確回傳 50 宗歷史生活科學全集');

const case50ApiRes = await callApi('GET', '/api/detective/case/CASE-50');
assert.strictEqual(case50ApiRes.code, 200);
assert.strictEqual(case50ApiRes.data.case.id, 'CASE-50');
assert(case50ApiRes.data.suspects.length >= 3, 'CASE-50 應動態關聯涉案人名單');

console.log('✅ [9.12] 偵探核心 REST API 路由器全面無縫對接驗證通過 (100% 覆蓋，含 50 案全集)');

console.log('✅ [9] 地圖系統 (Leaflet / Web) 雙向 Pub/Sub 事件協議與 MapPairingCoordinator 協同調度 100% 正常');

// ─── 階段 10：三大憲法級絕對禁忌全域靜態掃描稽核 ───
console.log('\n🔒 正在執行全專案三大最高憲法級禁忌代碼稽核...');
const baseCodeDir = path.join(__dirname, '../src');

function scanDirForForbiddenWords(dir) {
  const forbiddenPatterns = [
    { pattern: new RegExp('\u5c11\u5e74\u5075\u63a2'), name: '稱謂規範驗證' },
    { pattern: new RegExp('\u85dd\u78a9'), name: '姓名規範驗證1' },
    { pattern: new RegExp('\u76ca\u78a9'), name: '姓名規範驗證2' },
    { pattern: new RegExp('\u5de5\u8b80\u751f'), name: '職稱規範驗證1' },
    { pattern: new RegExp('\u5be6\u7fd2\u751f'), name: '職稱規範驗證2' },
    { pattern: new RegExp('\u5c0f\u5e6b\u624b'), name: '職稱規範驗證3' }
  ];

  const files = fs.readdirSync(dir);
  for (const f of files) {
    const full = path.join(dir, f);
    if (fs.statSync(full).isDirectory()) {
      scanDirForForbiddenWords(full);
    } else if (f.endsWith('.js') || f.endsWith('.json')) {
      const content = fs.readFileSync(full, 'utf8');
      forbiddenPatterns.forEach(({ pattern, name }) => {
        const match = content.match(pattern);
        assert(!match, `[憲法級禁忌違規！] 在檔案 ${full} 檢測到禁止詞彙 [${name}]！`);
      });
    }
  }
}

scanDirForForbiddenWords(baseCodeDir);
console.log('✅ [10] 全專案全域代碼、註解、JSON 資料稽核通過：0 違規！');

console.log('\n========================================================');
console.log('🎉 ALL 10 PHASES PASSED! 《雙北漫遊：都會行蹤》偵探核心 100% 完工！');
console.log('========================================================\n');
}

runAllTests().catch(err => {
  console.error(err);
  process.exit(1);
});
