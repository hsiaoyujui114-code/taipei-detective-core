/**
 * ============================================================================
 * EVIDENCE ENGINE (生活科學物證鑑識引擎)
 * ============================================================================
 * 嚴格依照企劃書 01A、04 節「108 課綱跨領域自然科學鑑識」實裝：
 * 1. 物理光學：光學放大鏡微痕觀察、紫外光螢光激發。
 * 2. 化學檢驗：廣用 pH 試紙酸鹼中和判定。
 * 3. 鑑識結果自動串聯至「證據鏈結案判定」，杜絕猜測，強調運算思維與實徵數據。
 */

class EvidenceEngine {
  constructor(storyLoader) {
    this.loader = storyLoader;
    this.examinedHistory = new Map();
  }

  /**
   * 使用鑑識工具檢驗物證
   */
  examineEvidence(evidenceId, toolId, investigator) {
    const caseList = this.loader.listCases();
    let targetEvidenceDef = null;
    let parentCase = null;

    for (const c of caseList) {
      const found = (c.evidenceChain || []).find(e => e.id === evidenceId);
      if (found) {
        targetEvidenceDef = found;
        parentCase = c;
        break;
      }
    }

    if (!targetEvidenceDef) {
      return { success: false, error: `未在任何案件中找到證物 ${evidenceId} 的鑑識規格。` };
    }

    // 檢查調查員是否持有此工具
    if (investigator) {
      const hasTool = investigator.inventory.tools.find(t => t.id === toolId);
      if (!hasTool) {
        return { success: false, error: `調查員尚未攜帶指定鑑識器材 [${toolId}]！` };
      }
    }

    const checkSpec = targetEvidenceDef.scienceCheck;
    if (!checkSpec) {
      return { success: false, error: '該物證未配置科學化驗參數。' };
    }

    if (checkSpec.tool !== toolId) {
      return {
        success: false,
        isMismatch: true,
        message: `鑑識工具無效：使用 ${toolId} 無法對 ${targetEvidenceDef.name} 產生明確化驗反應，請嘗試更換化學試紙、紫外光燈或光學放大鏡！`
      };
    }

    // 化驗成功，解鎖關鍵破案線索
    const record = {
      evidenceId,
      evidenceName: targetEvidenceDef.name,
      caseId: parentCase.id,
      toolId,
      result: checkSpec.expectedResult,
      clueUnlocked: checkSpec.clueUnlocked,
      examinedAt: new Date().toISOString()
    };
    this.examinedHistory.set(evidenceId, record);

    if (investigator) {
      investigator.addNotebookNote(
        `【鑑識報告】${targetEvidenceDef.name}`,
        `工具：${toolId}\n化驗數據：${checkSpec.expectedResult}\n科學推論：${checkSpec.clueUnlocked}`,
        ['物證化驗', '自然科學', parentCase.title]
      );
    }

    return {
      success: true,
      caseId: parentCase.id,
      evidenceId,
      evidenceName: targetEvidenceDef.name,
      result: checkSpec.expectedResult,
      clueUnlocked: checkSpec.clueUnlocked
    };
  }

  isEvidenceExamined(evidenceId) {
    return this.examinedHistory.has(evidenceId);
  }

  getExaminedRecord(evidenceId) {
    return this.examinedHistory.get(evidenceId) || null;
  }
}

module.exports = {
  EvidenceEngine
};
