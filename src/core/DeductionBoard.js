/**
 * ============================================================================
 * DEDUCTION BOARD (偵探思維推理板與指控驗證系統)
 * ============================================================================
 * 落實企劃書 04B 節：遊戲化偵查與鑑識系統、人物關係網與指控判定。
 * 玩家必須將物證化驗結果、目擊證詞與嫌疑人關聯，形成完整證據鏈方能結案。
 */

class DeductionBoard {
  constructor(storyLoader, evidenceEngine) {
    this.loader = storyLoader;
    this.evidenceEngine = evidenceEngine;
    this.caseLinks = new Map(); // caseId -> Array of { suspectId, evidenceId, rationale }
  }

  /**
   * 在推理板上建立「物證 ➔ 嫌疑人」邏輯連結
   */
  linkClueToSuspect(caseId, suspectId, evidenceId, hypothesisNote) {
    if (!this.caseLinks.has(caseId)) {
      this.caseLinks.set(caseId, []);
    }
    const links = this.caseLinks.get(caseId);

    // 檢查物證是否已鑑識
    const isExamined = this.evidenceEngine.isEvidenceExamined(evidenceId);
    const linkEntry = {
      id: `link_${Date.now()}`,
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

    const isCorrectCulprit = caseDef.correctCulpritId === accusedSuspectId;

    // 檢查證據鏈完整度：是否包含案件要求之關鍵物證，且全數經科學化驗
    const requiredEvidenceIds = (caseDef.evidenceChain || []).map(e => e.id);
    const missingEvidences = requiredEvidenceIds.filter(id => !submittedEvidenceIds.includes(id));
    const unexaminedEvidences = submittedEvidenceIds.filter(id => !this.evidenceEngine.isEvidenceExamined(id));

    let score = 100;
    const deductions = [];

    if (!isCorrectCulprit) {
      score = 0;
      deductions.push('指控對象錯誤：涉案人並非真正行為人！');
    }

    if (missingEvidences.length > 0) {
      score -= missingEvidences.length * 25;
      deductions.push(`證據鏈缺漏：缺少 ${missingEvidences.length} 項關鍵現場實徵物證！`);
    }

    if (unexaminedEvidences.length > 0) {
      score -= unexaminedEvidences.length * 15;
      deductions.push(`未完成科學化驗：有 ${unexaminedEvidences.length} 項物證未以科普器材進行檢驗！`);
    }

    score = Math.max(0, score);
    const isSolved = isCorrectCulprit && score >= 60;

    let grade = 'F';
    if (score >= 90) grade = 'S (名譽特等調查員)';
    else if (score >= 80) grade = 'A (優良調查報告)';
    else if (score >= 60) grade = 'B (合規破案)';

    return {
      success: isSolved,
      caseId,
      caseTitle: caseDef.title,
      accusedSuspectId,
      correctCulpritId: caseDef.correctCulpritId,
      score,
      grade,
      rationale: caseDef.solutionRationale,
      feedback: deductions.length > 0 ? deductions.join(' ') : '完美破案！物證、時間軸與自然科學鑑識完全吻合！'
    };
  }

  getBoardState(caseId) {
    return {
      caseId,
      links: this.caseLinks.get(caseId) || []
    };
  }
}

module.exports = {
  DeductionBoard
};
