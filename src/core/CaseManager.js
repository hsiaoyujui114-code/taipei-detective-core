/**
 * ============================================================================
 * CASE MANAGER (案件全生命週期狀態機總控)
 * ============================================================================
 * 管理案件 6 大狀態階層：
 * [未接取] ➔ [調查中] ➔ [搜查現場] ➔ [關鍵質詢] ➔ [推論指控] ➔ [結案歸檔]
 * 協同地圖系統自動派發警戒區與標記點。
 */

const { MapDetectiveEvents } = require('../bridge/EventContracts');

class CaseManager {
  constructor(storyLoader, evidenceEngine, dialogueEngine, deductionBoard, mapBridge) {
    this.loader = storyLoader;
    this.evidenceEngine = evidenceEngine;
    this.dialogueEngine = dialogueEngine;
    this.deductionBoard = deductionBoard;
    this.bridge = mapBridge;

    this.activeCase = null;
    this.caseProgress = new Map(); // caseId -> { state, collectedEvidence: [], notes: [] }
  }

  /**
   * 調查員接取案件
   */
  acceptCase(caseId, investigator) {
    const caseDef = this.loader.getCase(caseId);
    if (!caseDef) return { success: false, error: `找不到案件 [${caseId}]` };

    this.activeCase = caseDef;
    if (investigator) investigator.activeCaseId = caseId;

    this.caseProgress.set(caseId, {
      state: 'INVESTIGATING',
      startedAt: new Date().toISOString(),
      collectedEvidence: [],
      accused: null
    });

    // 透過橋樑通知地圖系統在目標經緯度劃設搜查警戒圈
    this.bridge.dispatch(MapDetectiveEvents.DETECTIVE.CASE_ACCEPTED, {
      caseId: caseDef.id,
      title: caseDef.title,
      centerCoords: caseDef.location.coords,
      radiusMeters: 300,
      sector: caseDef.location.sector
    });

    // 預設將現場物證放置於背包待驗
    (caseDef.evidenceChain || []).forEach(ev => {
      if (investigator) {
        investigator.inventory.addEvidence({
          id: ev.id,
          name: ev.name,
          desc: ev.description,
          caseId: caseDef.id
        });
      }
    });

    return {
      success: true,
      case: caseDef,
      message: `已接取案件【${caseDef.title}】，地圖系統已同步標記警戒搜查區！`
    };
  }

  /**
   * 結案處置
   */
  resolveCase(caseId, accusedSuspectId, submittedEvidenceIds, investigator) {
    const progress = this.caseProgress.get(caseId);
    if (!progress) return { success: false, error: '該案件尚未接取。' };

    const result = this.deductionBoard.evaluateAccusation(caseId, accusedSuspectId, submittedEvidenceIds);

    if (result.success) {
      progress.state = 'RESOLVED';
      progress.resolvedAt = new Date().toISOString();
      progress.grade = result.grade;

      if (investigator) {
        investigator.solvedCases.push(caseId);
        investigator.activeCaseId = null;
        investigator.wallet.awardEcoAction('DECLINE_PLASTIC_CUTLERY'); // 結案獲得綠色點數獎勵
      }

      // 通知地圖系統撤銷搜查警戒，廣播破案成就
      this.bridge.dispatch(MapDetectiveEvents.DETECTIVE.CASE_RESOLVED, {
        caseId,
        grade: result.grade,
        isSuccess: true
      });
    }

    return result;
  }

  getActiveCaseState() {
    if (!this.activeCase) return null;
    return {
      case: this.activeCase,
      progress: this.caseProgress.get(this.activeCase.id)
    };
  }
}

module.exports = {
  CaseManager
};
