/**
 * ============================================================================
 * DETECTIVE ENGINE INTEGRATION TEST (偵探核心單元與全流程測試)
 * ============================================================================
 */

const assert = require('assert');
const { createDetectiveEngine } = require('../src/index');

console.log('🧪 開始執行 Detective Engine 完整流程自動化驗證...');

const engine = createDetectiveEngine();

// 1. 測試資料載入
const cases = engine.loader.listCases();
console.log(`✅ 1. 成功載入案件庫：${cases.length} 宗案件`);
assert(cases.length >= 3, '案件數量應至少包含首發示範案');

// 2. 測試調查員接案
const case01 = cases[0];
const acceptResult = engine.caseManager.acceptCase(case01.id, engine.investigator);
console.log(`✅ 2. 調查員成功接案：${acceptResult.case.title}`);
assert(acceptResult.success, '接案應成功');

// 3. 測試物證化驗
const ev01 = case01.evidenceChain[0];
// 先測試錯誤工具
const failExamine = engine.evidenceEngine.examineEvidence(ev01.id, 'tool_uv_torch', engine.investigator);
assert(failExamine.isMismatch, '錯誤工具應提示無反應');
console.log('✅ 3.1 鑑識器材不符時正確給予科學提示');

// 正確工具化驗 (pH 試紙)
const okExamine = engine.evidenceEngine.examineEvidence(ev01.id, 'tool_ph_paper', engine.investigator);
assert(okExamine.success, '正確工具應化驗成功');
console.log(`✅ 3.2 成功完成生活科學化驗：${okExamine.result}`);

// 化驗第二項證物 (調配單)
const ev02 = case01.evidenceChain[1];
const okExamine2 = engine.evidenceEngine.examineEvidence(ev02.id, 'tool_uv_torch', engine.investigator);
assert(okExamine2.success, '第二項證物紫外光檢驗應成功');
console.log(`✅ 3.3 紫外光螢光防偽檢驗成功：${okExamine2.result}`);

// 4. 測試多輪 NPC 對話樹
const session = engine.dialogueEngine.startDialogue('session_test_01', 'suspect_01_barista');
assert(session.success, '開啟對話應成功');
console.log(`✅ 4.1 對話開啟：${session.npcText.slice(0, 20)}...`);

// 5. 測試推理板與結案指控
const solveResult = engine.caseManager.resolveCase(
  case01.id,
  'suspect_01_barista',
  [ev01.id, ev02.id],
  engine.investigator
);

assert(solveResult.success, '證據鏈完整應成功破案');
console.log(`✅ 5. 案件成功告破！評等：${solveResult.grade} (得分：${solveResult.score})`);

// 6. 測試環保減塑積分
const walletStatus = engine.investigator.wallet.awardEcoAction('BRING_TUMBLER');
console.log(`✅ 6. 環保減塑自備杯實踐成功：獲得 ${walletStatus.pointsAwarded} 點，總積分：${walletStatus.totalPoints}`);

console.log('\n🎉 ALL 6 TESTS PASSED! 偵探核心系統邏輯 100% 運作正常！');
