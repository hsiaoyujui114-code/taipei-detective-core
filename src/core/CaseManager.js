/**
 * ============================================================================
 * CASE MANAGER (案件全生命週期狀態機總控)
 * ============================================================================
 * 管理案件 6 大狀態階層：
 * [未接取] ➔ [調查中] ➔ [搜查現場] ➔ [關鍵質詢] ➔ [推論指控] ➔ [結案歸檔 / 冷案封存]
 *
 * 協同地圖系統 (Antigravity) 自動派發警戒區、生成與移除閃爍物證標記、
 * 解鎖動森感特產擺設、執行冷案官印封存。
 * 兼容 10 宗首發示範案與 50 宗歷史生活科學全集案件。
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
   * 輔助解析案件之經緯度座標 (支援結構化 coords 或由行政區/地標智能推算)
   * @param {Object} caseDef
   * @returns {[number, number]} [lat, lon]
   */
  resolveCoordsForCase(caseDef) {
    if (caseDef.location && Array.isArray(caseDef.location.coords)) {
      return caseDef.location.coords;
    }
    if (typeof caseDef.lat === 'number' && typeof caseDef.lon === 'number') {
      return [caseDef.lat, caseDef.lon];
    }

    const text = `${caseDef.district || ''} ${caseDef.location || ''} ${caseDef.title || ''}`;
    if (text.includes('淡水') || text.includes('紅毛城') || text.includes('海關碼頭')) return [25.1725, 121.4385];
    if (text.includes('北投') || text.includes('溫泉') || text.includes('地熱谷') || text.includes('硫磺谷')) return [25.1375, 121.5065];
    if (text.includes('西門') || text.includes('萬華') || text.includes('艋舺') || text.includes('剝皮寮')) return [25.0425, 121.5072];
    if (text.includes('大稻埕') || text.includes('迪化街') || text.includes('大同')) return [25.0560, 121.5100];
    if (text.includes('台北車站') || text.includes('北門') || text.includes('中正') || text.includes('植物園')) return [25.0465, 121.5170];
    if (text.includes('板橋') || text.includes('林家花園') || text.includes('府中')) return [25.0110, 121.4580];
    if (text.includes('大安') || text.includes('森林公園') || text.includes('台灣大學') || text.includes('醉月湖')) return [25.0270, 121.5360];
    if (text.includes('士林') || text.includes('科教館') || text.includes('天文館') || text.includes('故宮')) return [25.0960, 121.5200];
    if (text.includes('信義') || text.includes('松菸') || text.includes('101')) return [25.0340, 121.5645];
    if (text.includes('文山') || text.includes('貓空')) return [24.9680, 121.5880];
    if (text.includes('新莊') || text.includes('廟街') || text.includes('中港大排')) return [25.0360, 121.4520];
    if (text.includes('中和') || text.includes('緬甸街')) return [24.9870, 121.5130];
    if (text.includes('永和') || text.includes('世界豆漿')) return [25.0140, 121.5160];
    if (text.includes('三重') || text.includes('空軍一村') || text.includes('大都會公園')) return [25.0590, 121.4980];
    if (text.includes('三峽') || text.includes('藍染')) return [24.8710, 121.3710];
    if (text.includes('鶯歌') || text.includes('陶瓷')) return [24.9530, 121.3530];
    if (text.includes('瑞芳') || text.includes('金瓜石') || text.includes('九份')) return [25.1090, 121.8580];
    if (text.includes('陽明山') || text.includes('小油坑') || text.includes('竹子湖')) return [25.1760, 121.5450];

    return [25.0465, 121.5170];
  }

  /**
   * 都會調查員接取案件
   * @param {string} caseId
   * @param {Object} investigator
   * @returns {{ success: boolean, case?: Object, message?: string, error?: string }}
   */
  acceptCase(caseId, investigator) {
    const caseDef = this.loader.getCase(caseId);
    if (!caseDef) return { success: false, error: `找不到案件 [${caseId}]` };

    this.activeCase = caseDef;
    if (investigator) investigator.activeCaseId = caseDef.id;

    this.caseProgress.set(caseDef.id, {
      state: 'INVESTIGATING',
      startedAt: new Date().toISOString(),
      collectedEvidence: [],
      accused: null,
      grade: null
    });

    const coords = this.resolveCoordsForCase(caseDef);
    const sector = (caseDef.location && caseDef.location.sector)
      ? caseDef.location.sector
      : (caseDef.district || '雙北都會區');

    const difficultyNum = typeof caseDef.difficulty === 'number'
      ? caseDef.difficulty
      : (typeof caseDef.difficulty === 'string' ? (caseDef.difficulty.match(/★/g) || []).length : 2);

    const horrorNum = typeof caseDef.horrorLevel === 'number'
      ? caseDef.horrorLevel
      : (typeof caseDef.spookiness === 'string' ? (caseDef.spookiness.match(/👻/g) || []).length : 1);

    // 透過橋樑通知地圖系統在目標經緯度劃設搜查警戒圈
    this.bridge.dispatch(MapDetectiveEvents.DETECTIVE.CASE_ACCEPTED, {
      caseId: caseDef.id,
      title: caseDef.title,
      centerCoords: coords,
      radiusMeters: 300,
      sector,
      category: caseDef.category || caseDef.type || '都會事件',
      difficulty: difficultyNum,
      horrorLevel: horrorNum
    });

    // 預設將現場可見物證放置於背包待驗 (符合生活科學化驗機制)
    const evidences = Array.isArray(caseDef.evidenceChain) && caseDef.evidenceChain.length > 0
      ? caseDef.evidenceChain
      : this.loader.getEvidencesForCase(caseDef.id);

    evidences.forEach(ev => {
      if (investigator) {
        investigator.inventory.addEvidence({
          id: ev.id,
          name: ev.name,
          desc: ev.description || ev.desc,
          caseId: caseDef.id
        });
      }
      // 要求地圖生成現場閃爍標記
      this.bridge.dispatch(MapDetectiveEvents.DETECTIVE.MARKER_SPAWN_REQUEST, {
        markerId: `marker_${ev.id}`,
        caseId: caseDef.id,
        lat: coords[0],
        lon: coords[1],
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
   * 零劇透冷案封存 (雙北歷史懸案檔案庫) - 企劃書 04A 核心規格
   * 嚴格規範：平常絕不劇透真相，加蓋『未破懸案』官印封存！
   */
  archiveColdCase(caseId, reason = '限時已到或調查員暫停調查', investigator) {
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

  listColdCases() {
    return this.deductionBoard.listColdCases();
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
