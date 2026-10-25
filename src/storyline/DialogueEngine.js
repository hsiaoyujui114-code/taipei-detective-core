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
      sessionId,
      npcId,
      currentNodeId: 'root',
      psychologicalDefense: 100, // 初始心理防線 100%
      defenseHistory: [{ defense: 100, reason: '初始展開筆錄對話', timestamp: new Date().toISOString() }],
      history: [],
      startedAt: new Date().toISOString()
    };
    this.activeSessions.set(sessionId, session);

    return {
      success: true,
      npcId,
      currentNodeId: 'root',
      npcText: rootNode.npcText,
      psychologicalDefense: session.psychologicalDefense,
      options: this.formatOptions(rootNode.options || [])
    };
  }

  /**
   * 獲取指定會話中涉案人的心理防線值 (0~100%)
   */
  getPsychologicalDefense(sessionId) {
    const session = this.activeSessions.get(sessionId);
    return session ? session.psychologicalDefense : null;
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

    // 檢查物證出示要求 (物證對質打臉與心理防線崩潰機制)
    if (selectedOption.requiredEvidence) {
      if (!investigator) {
        return { success: false, error: '需要調查員背包以驗證證物！' };
      }

      const evidenceItem = investigator.inventory.getEvidence(selectedOption.requiredEvidence);
      if (!evidenceItem) {
        // 出示無關或未取得之物證：嫌犯反唇相譏，防線上升
        session.psychologicalDefense = Math.min(100, (session.psychologicalDefense ?? 100) + 10);
        session.defenseHistory.push({
          defense: session.psychologicalDefense,
          reason: `出示未持有之物證 [${selectedOption.requiredEvidence}] 被反譏`,
          timestamp: new Date().toISOString()
        });
        return {
          success: false,
          isIrrelevant: true,
          psychologicalDefense: session.psychologicalDefense,
          defenseChange: +10,
          sarcasm: `『調查員先生，手上空無一物就想套我的話？這未免太可笑了！』嫌犯冷笑反嘲，心理防線鞏固至 ${session.psychologicalDefense}%！`,
          error: `出示證物失敗：調查員尚未取得關鍵物證 [${selectedOption.requiredEvidence}]！`
        };
      }

      // 核心科學鑑識檢驗：證物若未經科學化驗，不能作為有效對質依據
      if (!evidenceItem.examined) {
        // 出示未經科學化驗的物證：嫌犯冷笑嘲諷，防線上升
        session.psychologicalDefense = Math.min(100, (session.psychologicalDefense ?? 100) + 10);
        session.defenseHistory.push({
          defense: session.psychologicalDefense,
          reason: `出示未化驗物證 [${evidenceItem.name}] 缺乏數據被反嘲`,
          timestamp: new Date().toISOString()
        });
        return {
          success: false,
          isUnexamined: true,
          psychologicalDefense: session.psychologicalDefense,
          defenseChange: +10,
          sarcasm: `『調查員先生，拿這種未經生活科學化驗的空泛猜測，能證明什麼？請拿出客觀數據再來吧！』嫌犯冷笑一聲，心理防線鞏固至 ${session.psychologicalDefense}%！`,
          error: `物證尚未化驗：【${evidenceItem.name}】尚未以科普器材進行檢驗，缺乏實徵數據，無法在筆錄中直接反駁對質！`
        };
      }

      // 成功出示經科學化驗之關鍵物證：心理防線大幅瓦解 (-40% ~ -50%)
      const defenseDamage = selectedOption.defenseDamage || 50;
      session.psychologicalDefense = Math.max(0, (session.psychologicalDefense ?? 100) - defenseDamage);
      session.defenseHistory.push({
        defense: session.psychologicalDefense,
        reason: `出示已化驗關鍵物證 [${evidenceItem.name}]，科學實徵鐵證擊潰心防`,
        timestamp: new Date().toISOString()
      });
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
      psychologicalDefense: session.psychologicalDefense,
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

    // 若心防已降至 0%，自動達成口供全面瓦解閉環
    const isDefenseBroken = session.psychologicalDefense === 0;
    const isClosed = !!nextNode.caseClosed || isDefenseBroken;

    return {
      success: true,
      npcId: session.npcId,
      currentNodeId: nextNodeId,
      npcText: nextNode.npcText,
      clueUnlocked,
      caseClosed: isClosed,
      psychologicalDefense: session.psychologicalDefense,
      defenseChange: selectedOption.requiredEvidence ? -(selectedOption.defenseDamage || 50) : 0,
      isDefenseBroken,
      options: this.formatOptions(nextNode.options || [])
    };
  }

  /**
   * 自由出示物證進行詰問 (Direct Evidence Presentation)
   * 支持玩家自主主動出示背包中的任何物證
   */
  presentEvidenceDirectly(sessionId, evidenceId, investigator) {
    const session = this.activeSessions.get(sessionId);
    if (!session) {
      return { success: false, error: '對話會話不存在。' };
    }

    if (!investigator) {
      return { success: false, error: '需要調查員背包以驗證物證。' };
    }

    const evidenceItem = investigator.inventory.getEvidence(evidenceId);
    if (!evidenceItem) {
      session.psychologicalDefense = Math.min(100, (session.psychologicalDefense ?? 100) + 10);
      return {
        success: false,
        psychologicalDefense: session.psychologicalDefense,
        defenseChange: +10,
        sarcasm: '『你根本沒有這項東西，是在虛張聲勢嗎？』嫌犯警覺反問，心防加固！',
        error: `調查員尚未取得證物 [${evidenceId}]。`
      };
    }

    if (!evidenceItem.examined) {
      session.psychologicalDefense = Math.min(100, (session.psychologicalDefense ?? 100) + 10);
      return {
        success: false,
        isUnexamined: true,
        psychologicalDefense: session.psychologicalDefense,
        defenseChange: +10,
        sarcasm: `『這件【${evidenceItem.name}】連科學化驗都沒有做，就想拿來指控？真是不入流的推論。』嫌犯冷笑，心防提升至 ${session.psychologicalDefense}%！`,
        error: `證物【${evidenceItem.name}】未經科學化驗。`
      };
    }

    // 檢查當前對話樹是否有匹配該物證的節點或選項
    const tree = this.loader.getDialogueTree(session.npcId);
    let matchedOptionIndex = -1;
    let currentNode = tree ? tree[session.currentNodeId] : null;

    if (currentNode && currentNode.options) {
      matchedOptionIndex = currentNode.options.findIndex(opt => opt.requiredEvidence === evidenceId);
    }

    if (matchedOptionIndex !== -1) {
      // 命中對質選項，執行突破
      return this.selectOption(sessionId, matchedOptionIndex, investigator);
    }

    // 若非當前節點對質物證，但為已化驗之物證
    return {
      success: true,
      matched: false,
      psychologicalDefense: session.psychologicalDefense,
      npcReply: `嫌犯端詳了【${evidenceItem.name}】的化驗報告，眼神飄移了一下：『這確實是科學化驗沒錯，但這能證明我做了什麼？』`
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
