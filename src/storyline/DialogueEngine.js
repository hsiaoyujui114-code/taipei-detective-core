/**
 * ============================================================================
 * DIALOGUE ENGINE (多輪 NPC 詰問與物證對質打臉引擎)
 * ============================================================================
 * 嚴格依照企劃書 04B 節「虛構偵查筆錄程序與物證對質打臉」實裝：
 * 1. 條件分支對話樹 (人別 ➔ 不在場 ➔ 見聞 ➔ 交叉質詢)。
 * 2. 證物出示機制 (Present Evidence)：
 *    - 必須攜帶該物證且「已完成科普器材化驗」，方能出示打臉謊言！
 * 3. 矛盾破解即時解鎖線索，自動記入調查員筆記本，並提升社區信賴度。
 */

class DialogueEngine {
  constructor(storyLoader) {
    this.loader = storyLoader;
    this.activeSessions = new Map(); // sessionId -> { npcId, currentNodeId, history }
  }

  /**
   * 開啟與 NPC 的多輪對話會話
   */
  startDialogue(sessionId, npcId) {
    const tree = this.loader.getDialogueTree(npcId);
    if (!tree) {
      return { success: false, error: `找不到涉案關係人 [${npcId}] 的對話樹配置。` };
    }

    const rootNode = tree.root;
    if (!rootNode) {
      return { success: false, error: '對話樹缺少 root 根節點配置。' };
    }

    const session = {
      npcId,
      currentNodeId: 'root',
      history: [],
      startedAt: new Date().toISOString()
    };
    this.activeSessions.set(sessionId, session);

    return {
      success: true,
      npcId,
      currentNodeId: 'root',
      npcText: rootNode.npcText,
      options: this.formatOptions(rootNode.options || [])
    };
  }

  /**
   * 調查員選擇對話分支或出示證物
   */
  selectOption(sessionId, optionIndex, investigator) {
    const session = this.activeSessions.get(sessionId);
    if (!session) {
      return { success: false, error: '對話會話不存在或已過期，請重新發起對話。' };
    }

    const tree = this.loader.getDialogueTree(session.npcId);
    if (!tree) {
      return { success: false, error: '對話資料已失效。' };
    }

    const currentNode = tree[session.currentNodeId];
    if (!currentNode || !currentNode.options || !currentNode.options[optionIndex]) {
      return { success: false, error: '無效的對話選項序號。' };
    }

    const selectedOption = currentNode.options[optionIndex];

    // 檢查物證出示要求 (物證對質打臉機制)
    if (selectedOption.requiredEvidence) {
      if (!investigator) {
        return { success: false, error: '需要調查員背包以驗證證物！' };
      }

      const evidenceItem = investigator.inventory.getEvidence(selectedOption.requiredEvidence);
      if (!evidenceItem) {
        return {
          success: false,
          error: `出示證物失敗：調查員尚未取得關鍵物證 [${selectedOption.requiredEvidence}]！`
        };
      }

      // 核心科學鑑識檢驗：證物若未經科學化驗，不能作為有效對質依據
      if (!evidenceItem.examined) {
        return {
          success: false,
          isUnexamined: true,
          error: `物證尚未化驗：【${evidenceItem.name}】尚未以科普器材進行檢驗，缺乏實徵數據，無法在筆錄中直接反駁對質！`
        };
      }
    }

    const nextNodeId = selectedOption.next;
    const nextNode = tree[nextNodeId];
    if (!nextNode) {
      return { success: false, error: `對話節點 [${nextNodeId}] 未定義。` };
    }

    session.currentNodeId = nextNodeId;
    session.history.push({
      playerChoice: selectedOption.text,
      npcReply: nextNode.npcText,
      timestamp: new Date().toISOString()
    });

    // 若該節點獎勵新線索，自動登入筆記本
    let clueUnlocked = null;
    if (nextNode.clueAwarded) {
      clueUnlocked = nextNode.clueAwarded;
      if (investigator) {
        investigator.addNotebookNote(
          `【證詞矛盾突破】${session.npcId}`,
          nextNode.clueAwarded,
          ['證詞質詢', '物證打臉', session.npcId]
        );
      }
    }

    return {
      success: true,
      npcId: session.npcId,
      currentNodeId: nextNodeId,
      npcText: nextNode.npcText,
      clueUnlocked,
      caseClosed: !!nextNode.caseClosed,
      options: this.formatOptions(nextNode.options || [])
    };
  }

  formatOptions(options) {
    return options.map((opt, idx) => ({
      index: idx,
      text: opt.text,
      requiresEvidence: !!opt.requiredEvidence,
      requiredEvidenceId: opt.requiredEvidence || null
    }));
  }

  getSessionHistory(sessionId) {
    const session = this.activeSessions.get(sessionId);
    return session ? session.history : [];
  }
}

module.exports = {
  DialogueEngine
};
