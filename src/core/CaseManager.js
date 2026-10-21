/**
 * ============================================================================
 * CASE MANAGER (案件全生命週期狀態機總控)
 * ============================================================================
 * 管理案件 6 大狀態階層：
 * [未接取] ➔ [調查中] ➔ [搜查現場] ➔ [關鍵質詢] ➔ [推論指控] ➔ [結案歸檔 / 冷案封存]
 *
 * 協同地圖系統 (Antigravity) 自動派發警戒區、生成與移除閃爍物證標記、
 * 解鎖動森感特產擺設、執行冷案官印封存。
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
   * 都會調查員接取案件
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
      accused: null,
      grade: null
    });

    // 透過橋樑通知地圖系統在目標經緯度劃設搜查警戒圈
    this.bridge.dispatch(MapDetectiveEvents.DETECTIVE.CASE_ACCEPTED, {
      caseId: caseDef.id,
      title: caseDef.title,
      centerCoords: caseDef.location.coords,
      radiusMeters: 300,
      sector: caseDef.location.sector,
      category: caseDef.category,
      difficulty: caseDef.difficulty,
      horrorLevel: caseDef.horrorLevel
    });

    // 預設將現場可見物證放置於背包待驗 (符合生活科學化驗機制)
    (caseDef.evidenceChain || []).forEach(ev => {
      if (investigator) {
        investigator.inventory.addEvidence({
          id: ev.id,
          name: ev.name,
          desc: ev.description,
          caseId: caseDef.id
        });
      }
      // 要求地圖生成現場閃爍標記
      this.bridge.dispatch(MapDetectiveEvents.DETECTIVE.MARKER_SPAWN_REQUEST, {
        markerId: `marker_${ev.id}`,
        caseId: caseDef.id,
        lat: caseDef.location.coords[0],
        lon: caseDef.location.coords[1],
        title: ev.name
      });
    });

    return {
      success: true,
      case: caseDef,
      message: `已接取案件【${caseDef.title}】，地圖系統已同步標記警戒搜查區與現場物證！`
    };
  }

  /**
   * 現場物證化驗
   */
  examineEvidence(evidenceId, toolId, investigator) {
    const progress = this.activeCase ? this.caseProgress.get(this.activeCase.id) : null;
    if (progress && progress.state === 'INVESTIGATING') {
      progress.state = 'SCENE_EXAMINATION';
    }

    const result = this.evidenceEngine.examineEvidence(evidenceId, toolId, investigator);
    if (result.success) {
      // 成功化驗後通知地圖移除現場閃爍標記
      this.bridge.dispatch(MapDetectiveEvents.DETECTIVE.MARKER_REMOVE_REQUEST, {
        markerId: `marker_${evidenceId}`,
        caseId: result.caseId
      });
    }
    return result;
  }

  /**
   * 與涉案關係人進行多輪詰問筆錄
   */
  interrogateSuspect(sessionId, suspectId) {
    const progress = this.activeCase ? this.caseProgress.get(this.activeCase.id) : null;
    if (progress && (progress.state === 'INVESTIGATING' || progress.state === 'SCENE_EXAMINATION')) {
      progress.state = 'INTERROGATION';
    }
    return this.dialogueEngine.startDialogue(sessionId, suspectId);
  }

  /**
   * 結案處置 (提交指控與評等)
   */
  resolveCase(caseId, accusedSuspectId, submittedEvidenceIds, investigator) {
    const progress = this.caseProgress.get(caseId);
    if (!progress) return { success: false, error: '該案件尚未接取。' };

    progress.state = 'DEDUCTION';
    const result = this.deductionBoard.evaluateAccusation(caseId, accusedSuspectId, submittedEvidenceIds);

    if (result.success) {
      progress.state = 'RESOLVED';
      progress.resolvedAt = new Date().toISOString();
      progress.grade = result.grade;
      progress.accused = accusedSuspectId;

      let souvenirUnlocked = null;
      if (investigator) {
        if (!investigator.solvedCases.includes(caseId)) {
          investigator.solvedCases.push(caseId);
        }
        investigator.activeCaseId = null;
        investigator.wallet.awardEcoAction('DECLINE_PLASTIC_CUTLERY'); // 結案獲得綠色點數獎勵
        souvenirUnlocked = investigator.unlockCaseSouvenir(caseId); // 解鎖動森感特產擺設
      }

      this.activeCase = null;

      // 通知地圖系統撤銷搜查警戒，廣播破案成就
      this.bridge.dispatch(MapDetectiveEvents.DETECTIVE.CASE_RESOLVED, {
        caseId,
        grade: result.grade,
        isSuccess: true,
        score: result.score,
        souvenir: souvenirUnlocked
      });

      result.souvenirUnlocked = souvenirUnlocked;
    }

    return result;
  }

  /**
   * 零劇透冷案封存 (雙北歷史懸案檔案庫)
   */
  archiveColdCase(caseId, reason = '限時已到或暫停偵辦', investigator) {
    const progress = this.caseProgress.get(caseId);
    const archiveResult = this.deductionBoard.archiveColdCase(caseId, reason);

    if (progress) {
      progress.state = 'COLD_CASE_ARCHIVED';
      progress.archivedAt = new Date().toISOString();
    }

    if (investigator && investigator.activeCaseId === caseId) {
      investigator.activeCaseId = null;
    }
    if (this.activeCase && this.activeCase.id === caseId) {
      this.activeCase = null;
    }

    // 通知地圖系統冷案封存，撤銷警戒區
    this.bridge.dispatch(MapDetectiveEvents.DETECTIVE.COLD_CASE_ARCHIVED, {
      caseId,
      coldCaseName: archiveResult.coldCaseRecord ? archiveResult.coldCaseRecord.coldCaseName : '未破懸案',
      reason
    });

    return archiveResult;
  }

  getActiveCaseState() {
    if (!this.activeCase) return null;
    return {
      case: this.activeCase,
      progress: this.caseProgress.get(this.activeCase.id)
    };
  }

  getAllProgress() {
    const list = {};
    for (const [k, v] of this.caseProgress.entries()) {
      list[k] = v;
    }
    return list;
  }
}

module.exports = {
  CaseManager
};
