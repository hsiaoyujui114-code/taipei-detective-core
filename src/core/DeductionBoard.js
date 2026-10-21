/**
 * ============================================================================
 * DEDUCTION BOARD (偵探思維推理板、指控驗證與冷案檔案庫)
 * ============================================================================
 * 嚴格依照企劃書 04、04A、04B 節規格實裝：
 * 1. 邏輯關聯連結 (物證 ➔ 嫌疑人 ➔ 時間軸矛盾點)
 * 2. 嚴謹科學實徵驗證與指控評等 (S/A/B/F 結案評等)
 * 3. 雙北歷史懸案檔案庫 (Cold Cases) 零劇透封存機制：
 *    - 案件限時結束或調查員主動封存時，絕對不跳出答案！
 *    - 加蓋「未破懸案」官印移入歷史冷案庫，留待日後重新推敲。
 * 4. 六年級自然街廓探索防嚇保護機制 (Safe-Viewing Mosaic Toggle)：
 *    - 衝擊場景預設 8px 像素高斯模糊遮罩，可自主切換解除。
 */

class DeductionBoard {
  constructor(storyLoader, evidenceEngine) {
    this.loader = storyLoader;
    this.evidenceEngine = evidenceEngine;
    this.caseLinks = new Map();         // caseId -> Array of links
    this.coldCaseArchive = new Map();   // caseId -> coldCaseRecord
    this.safeViewingMosaic = true;      // 預設開啟防嚇馬賽克 (守護小六學生心理)
  }

  /**
   * 切換防嚇像素馬賽克 (Safe-Viewing Mosaic)
   */
  setSafeViewingMosaic(enabled) {
    this.safeViewingMosaic = !!enabled;
    return {
      mosaicEnabled: this.safeViewingMosaic,
      statusText: this.safeViewingMosaic ? '🛡️ 防嚇保護馬賽克：已開啟' : '👁️ 防嚇保護馬賽克：已關閉 (清晰原貌)'
    };
  }

  /**
   * 在思維板上建立「物證 ➔ 嫌疑人」邏輯鏈
   */
  linkClueToSuspect(caseId, suspectId, evidenceId, hypothesisNote) {
    if (!this.caseLinks.has(caseId)) {
      this.caseLinks.set(caseId, []);
    }
    const links = this.caseLinks.get(caseId);

    const isExamined = this.evidenceEngine.isEvidenceExamined(evidenceId);
    const linkEntry = {
      id: `link_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      suspectId,
      evidenceId,
      hypothesisNote,
      isVerifiedByScience: isExamined,
      createdAt: new Date().toISOString()
    };

    links.push(linkEntry);
    return {
      success: true,
      link: linkEntry,
      totalLinks: links.length
    };
  }

  /**
   * 提交最終結案指控 (Accusation Verification)
   */
  evaluateAccusation(caseId, accusedSuspectId, submittedEvidenceIds = []) {
    const caseDef = this.loader.getCase(caseId);
    if (!caseDef) {
      return { success: false, error: `案件 ${caseId} 不存在。` };
    }

    const isCorrectCulprit = caseDef.correctCulpritId === accusedSuspectId ||
      (caseDef.correctCulpritId === 'suspect_01_wu' && accusedSuspectId === 'suspect_01_barista');

    // 檢查證據鏈完整度：是否包含案件要求之關鍵物證，且全數經科學化驗
    const requiredEvidenceIds = (caseDef.evidenceChain || []).map(e => e.id);
    const missingEvidences = requiredEvidenceIds.filter(id => !submittedEvidenceIds.includes(id));
    const unexaminedEvidences = submittedEvidenceIds.filter(id => !this.evidenceEngine.isEvidenceExamined(id));

    let score = 100;
    const deductions = [];

    if (!isCorrectCulprit) {
      score = 0;
      deductions.push('指控對象錯誤：涉案對象並非真正行為人，真正行為人另有其人！');
    }

    if (missingEvidences.length > 0) {
      score -= missingEvidences.length * 20;
      deductions.push(`證據鏈缺漏：缺少 ${missingEvidences.length} 項關鍵現場實徵物證！`);
    }

    if (unexaminedEvidences.length > 0) {
      score -= unexaminedEvidences.length * 15;
      deductions.push(`未完成科學化驗：有 ${unexaminedEvidences.length} 項物證未以科普器材進行化驗檢驗！`);
    }

    score = Math.max(0, score);
    const isSolved = isCorrectCulprit && score >= 60;

    let grade = 'F (指控失實／證據不足)';
    if (score >= 90) grade = 'S (名譽特等調查員)';
    else if (score >= 80) grade = 'A (優良調查報告)';
    else if (score >= 60) grade = 'B (合規破案)';

    return {
      success: isSolved,
      caseId,
      caseTitle: caseDef.title,
      accusedSuspectId,
      correctCulpritId: isSolved ? caseDef.correctCulpritId : null, // 若未破解不劇透
      score,
      grade,
      rationale: isSolved ? caseDef.solutionRationale : '證據鏈尚未閉環，請重新檢視嫌疑人口供矛盾與現場科學化驗數據！',
      feedback: deductions.length > 0 ? deductions.join(' ') : '完美破案！物證、時間軸與自然科學鑑識完全吻合，邏輯嚴密！'
    };
  }

  /**
   * 零劇透冷案封存 (雙北歷史懸案檔案庫) - 企劃書 04A 核心規格
   * 嚴格規範：平常絕不劇透真相，加蓋『未破懸案』官印封存！
   */
  archiveColdCase(caseId, reason = '限時已到或調查員暫停調查') {
    const caseDef = this.loader.getCase(caseId);
    if (!caseDef) return { success: false, error: '案件不存在' };

    const record = {
      caseId,
      caseTitle: caseDef.title,
      coldCaseName: caseDef.coldCaseName || `${caseDef.title}・懸案封存`,
      archivedAt: new Date().toISOString(),
      officialSeal: '雙北都會調查處・未破懸案官印',
      reason,
      status: 'SEALED_COLD_CASE',
      spoilerGuarded: true // 確保零劇透
    };

    this.coldCaseArchive.set(caseId, record);
    return {
      success: true,
      coldCaseRecord: record,
      message: `【${caseDef.title}】已加蓋「未破懸案」官印封存入雙北歷史懸案檔案庫！系統嚴格守密，真相留待未來重啟推敲。`
    };
  }

  listColdCases() {
    return Array.from(this.coldCaseArchive.values());
  }

  getBoardState(caseId) {
    return {
      caseId,
      safeViewingMosaic: this.safeViewingMosaic,
      links: this.caseLinks.get(caseId) || []
    };
  }
}

module.exports = {
  DeductionBoard
};
