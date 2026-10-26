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
    this.deductionGraphs = new Map();   // caseId -> { nodes: Map, edges: Array, eurekaTriggered: boolean }
    this.crossCaseNetwork = {           // 跨案件宏觀暗線思維導圖 (Grand Conspiracy DAG)
      nodes: new Map(),
      edges: [],
      eurekaTriggered: false
    };
    this.safeViewingMosaic = true;      // 預設開啟防嚇馬賽克 (守護小六學生心理)
  }

  /**
   * 建立跨案件暗線伏筆有向引線 (Cross-case Grand Deduction Edge)
   * 專門用於串接 story 模組的篇章伏筆 (例如 CASE-01 咖啡店晶片 ➔ CASE-26 跨區鐵路局機房)
   */
  addCrossCaseEdge(sourceCaseId, sourceNodeId, targetCaseId, targetNodeId, correlationNote = '跨案暗線關聯') {
    const srcKey = `${sourceCaseId}:${sourceNodeId}`;
    const tgtKey = `${targetCaseId}:${targetNodeId}`;

    if (!this.crossCaseNetwork.nodes.has(srcKey)) {
      this.crossCaseNetwork.nodes.set(srcKey, {
        id: srcKey,
        caseId: sourceCaseId,
        nodeId: sourceNodeId,
        label: `${sourceCaseId}・${sourceNodeId}`
      });
    }

    if (!this.crossCaseNetwork.nodes.has(tgtKey)) {
      this.crossCaseNetwork.nodes.set(tgtKey, {
        id: tgtKey,
        caseId: targetCaseId,
        nodeId: targetNodeId,
        label: `${targetCaseId}・${targetNodeId}`
      });
    }

    const edge = {
      id: `cross_edge_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      from: srcKey,
      to: tgtKey,
      sourceCaseId,
      targetCaseId,
      correlationNote,
      createdAt: new Date().toISOString()
    };

    this.crossCaseNetwork.edges.push(edge);

    return {
      success: true,
      edge,
      totalCrossEdges: this.crossCaseNetwork.edges.length,
      message: `成功建立跨案件思維引線：【${sourceCaseId}】➔【${targetCaseId}】(${correlationNote})`
    };
  }

  /**
   * 導出跨案件宏觀暗線網絡資料 (供地圖與思維導圖 UI 繪製)
   */
  getCrossCaseGraph() {
    return {
      nodes: Array.from(this.crossCaseNetwork.nodes.values()),
      edges: this.crossCaseNetwork.edges,
      totalConnections: this.crossCaseNetwork.edges.length
    };
  }

  /**
   * 取得或初始化指定案件的有向思維導圖實例
   */
  _getOrCreateGraph(caseId) {
    if (!this.deductionGraphs.has(caseId)) {
      this.deductionGraphs.set(caseId, {
        caseId,
        nodes: new Map(), // nodeId -> { id, label, type, metadata }
        edges: [],        // [{ from, to, relation, verified }]
        eurekaTriggered: false
      });
    }
    return this.deductionGraphs.get(caseId);
  }

  /**
   * 在思維導圖中新增推論節點
   * @param {string} caseId
   * @param {Object} node - { id, label, type: 'evidence'|'science'|'contradiction'|'suspect', metadata }
   */
  addGraphNode(caseId, node) {
    const graph = this._getOrCreateGraph(caseId);
    graph.nodes.set(node.id, {
      id: node.id,
      label: node.label || node.id,
      type: node.type || 'evidence',
      metadata: node.metadata || {},
      addedAt: new Date().toISOString()
    });
    return { success: true, node: graph.nodes.get(node.id), totalNodes: graph.nodes.size };
  }

  /**
   * 在思維導圖中建立有向關聯引線 (Directed Edge)
   * @param {string} caseId
   * @param {string} fromNodeId
   * @param {string} toNodeId
   * @param {string} relation - 關聯類型 (如 'reveals_science', 'contradicts_alibi', 'pinpoints_culprit')
   */
  addGraphEdge(caseId, fromNodeId, toNodeId, relation = 'proves') {
    const graph = this._getOrCreateGraph(caseId);

    // 自動補齊預設節點若尚未明確宣告
    if (!graph.nodes.has(fromNodeId)) {
      this.addGraphNode(caseId, { id: fromNodeId, label: fromNodeId, type: fromNodeId.startsWith('ev_') ? 'evidence' : 'clue' });
    }
    if (!graph.nodes.has(toNodeId)) {
      this.addGraphNode(caseId, { id: toNodeId, label: toNodeId, type: toNodeId.startsWith('suspect_') ? 'suspect' : 'clue' });
    }

    const edge = {
      id: `edge_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      from: fromNodeId,
      to: toNodeId,
      relation,
      createdAt: new Date().toISOString()
    };
    graph.edges.push(edge);

    // 每次新增引線後，自動檢驗是否達成有向邏輯閉環
    const closureCheck = this.checkDeductionClosure(caseId);

    return {
      success: true,
      edge,
      totalEdges: graph.edges.length,
      closureStatus: closureCheck
    };
  }

  /**
   * 有向思維導圖閉環判定演算法 (Deduction Graph Closure Verification)
   * 檢驗從「現場實徵物證」經過「生活科學化驗數據」與「證詞破綻」，最終指向「嫌疑真凶」是否形成完整因果鏈
   * 達成閉環時觸發 Eureka 頓悟事件！
   */
  checkDeductionClosure(caseId) {
    const graph = this._getOrCreateGraph(caseId);
    const caseDef = this.loader.getCase(caseId);
    if (!caseDef) return { isClosed: false, error: '案件不存在' };

    // 構建有向圖鄰接表
    const adj = new Map();
    for (const [nodeId] of graph.nodes) {
      adj.set(nodeId, []);
    }
    for (const edge of graph.edges) {
      if (!adj.has(edge.from)) adj.set(edge.from, []);
      adj.get(edge.from).push(edge.to);
    }

    // 尋找由任何物證起點 (type === 'evidence' 或以 'ev_' 開頭) 通往嫌疑人節點的有向路徑
    const evidenceNodes = Array.from(graph.nodes.values()).filter(n =>
      n.type === 'evidence' || n.id.startsWith('ev_')
    );

    const targetCulpritId = caseDef.correctCulpritId;
    let foundClosurePath = null;

    for (const evNode of evidenceNodes) {
      // 檢查該物證是否經生活科學化驗
      const isExamined = this.evidenceEngine.isEvidenceExamined(evNode.id);
      if (!isExamined && !evNode.metadata?.isVerifiedByScience) {
        continue; // 未化驗之物證不能形成閉環
      }

      // BFS 遍歷尋找指向真凶的路徑
      const queue = [[evNode.id]];
      const visited = new Set([evNode.id]);

      while (queue.length > 0) {
        const currentPath = queue.shift();
        const currentId = currentPath[currentPath.length - 1];

        // 若抵達正確真凶節點，閉環成立！
        if (currentId === targetCulpritId || (targetCulpritId === 'suspect_01_wu' && currentId.includes('wu'))) {
          foundClosurePath = currentPath;
          break;
        }

        const neighbors = adj.get(currentId) || [];
        for (const next of neighbors) {
          if (!visited.has(next)) {
            visited.add(next);
            queue.push([...currentPath, next]);
          }
        }
      }

      if (foundClosurePath) break;
    }

    if (foundClosurePath) {
      graph.eurekaTriggered = true;
      return {
        isClosed: true,
        eurekaTriggered: true,
        eurekaTitle: '💡 【Eureka! 邏輯自洽頓悟】',
        eurekaMessage: `【${caseDef.title}】關鍵實徵物證、自然生活科學數據與嫌犯證詞矛盾已形成完整有向因果閉環！指控已牢不可破！`,
        closurePath: foundClosurePath,
        culpritId: targetCulpritId,
        timestamp: new Date().toISOString()
      };
    }

    return {
      isClosed: false,
      eurekaTriggered: false,
      message: '有向思維導圖尚未形成邏輯閉環，請繼續透過科學化驗與破綻鏈接物證與嫌犯！'
    };
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
   * 在思維板上建立「物證 ➔ 嫌疑人」邏輯鏈 (同步更新有向思維導圖)
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

    // 同步注入有向思維導圖
    this.addGraphNode(caseId, { id: evidenceId, label: `物證: ${evidenceId}`, type: 'evidence', metadata: { isVerifiedByScience: isExamined } });
    this.addGraphNode(caseId, { id: suspectId, label: `涉案人: ${suspectId}`, type: 'suspect' });
    this.addGraphEdge(caseId, evidenceId, suspectId, 'links_to_suspect');

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
    const graph = this.deductionGraphs.get(caseId);
    return {
      caseId,
      safeViewingMosaic: this.safeViewingMosaic,
      links: this.caseLinks.get(caseId) || [],
      graph: graph ? {
        nodes: Array.from(graph.nodes.values()),
        edges: graph.edges,
        eurekaTriggered: graph.eurekaTriggered
      } : { nodes: [], edges: [], eurekaTriggered: false }
    };
  }
}

module.exports = {
  DeductionBoard
};
