/**
 * ============================================================================
 * DIALOGUE ENGINE (多輪 NPC 詰問與對話樹引擎)
 * ============================================================================
 * 支援：
 * 1. 條件分支選項 (若未持有關鍵證物或信賴度不足，選項鎖定或反饋不同)。
 * 2. 證物出示機制 (Present Evidence 破除口供謊言)。
 * 3. 獲取線索與矛盾點自動記入調查筆記本。
 */

class DialogueEngine {
  constructor(storyLoader) {
    this.loader = storyLoader;
    this.activeSessions = new Map(); // sessionId -> { npcId, currentNodeId, history }
  }

  /**
   * 開啟對話
   */
  startDialogue(sessionId, npcId) {
    const tree = this.loader.getDialogueTree(npcId);
    if (!tree) {
      return { success: false, error: `找不到 NPC ${npcId} 的對話樹配置。` };
    }

    const rootNode = tree.root;
    if (!rootNode) {
      return { success: false, error: '對話樹缺少 root 根節點。' };
    }

    const session = {
      npcId,
      currentNodeId: 'root',
      history: []
    };
    this.activeSessions.set(sessionId, session);

    return {
      success: true,
      npcId,
      currentNodeId: 'root',
      npcText: rootNode.npcText,
      options: this.filterAvailableOptions(rootNode.options || [], sessionId)
    };
  }

  /**
   * 選擇對話選項
   */
  selectOption(sessionId, optionIndex, investigator) {
    const session = this.activeSessions.get(sessionId);
    if (!session) return { success: false, error: '對話會話不存在或已過期。' };

    const tree = this.loader.getDialogueTree(session.npcId);
    const currentNode = tree[session.currentNodeId];
    if (!currentNode || !currentNode.options || !currentNode.options[optionIndex]) {
      return { success: false, error: '無效的對話選項。' };
    }

    const selectedOption = currentNode.options[optionIndex];

    // 檢查證物要求
    if (selectedOption.requiredEvidence) {
      const hasItem = investigator && investigator.inventory.getEvidence(selectedOption.requiredEvidence);
      if (!hasItem) {
        return {
          success: false,
          error: `出示證物失敗：調查員背包尚未蒐集到關鍵證物 [${selectedOption.requiredEvidence}]！`
        };
      }
    }

    const nextNodeId = selectedOption.next;
    const nextNode = tree[nextNodeId];
    if (!nextNode) {
      return { success: false, error: `對話節點 ${nextNodeId} 不存在。` };
    }

    session.currentNodeId = nextNodeId;
    session.history.push({
      playerChoice: selectedOption.text,
      npcReply: nextNode.npcText
    });

    // 如果該節點獎勵新線索，自動記錄
    let clueUnlocked = null;
    if (nextNode.clueAwarded) {
      clueUnlocked = nextNode.clueAwarded;
      if (investigator) {
        investigator.addNotebookNote(`【證詞線索】${session.npcId}`, nextNode.clueAwarded, ['證詞', '口供']);
      }
    }

    return {
      success: true,
      npcId: session.npcId,
      currentNodeId: nextNodeId,
      npcText: nextNode.npcText,
      clueUnlocked,
      caseClosed: !!nextNode.caseClosed,
      options: this.filterAvailableOptions(nextNode.options || [], sessionId)
    };
  }

  filterAvailableOptions(options) {
    return options.map((opt, idx) => ({
      index: idx,
      text: opt.text,
      requiresEvidence: !!opt.requiredEvidence
    }));
  }
}

module.exports = {
  DialogueEngine
};
