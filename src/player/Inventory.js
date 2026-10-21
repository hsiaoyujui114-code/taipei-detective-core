/**
 * ============================================================================
 * INVENTORY (三軌物證與道具背包系統)
 * ============================================================================
 * 嚴格依照企劃書 04 節「破案道具三軌機制」實裝：
 * 軌道一：生活實體道具 (日常飲食、悠遊卡、環保袋、筆記本)
 * 軌道二：專業鑑識器材 (放大鏡、UV紫外燈、pH酸鹼試紙、熱敏紙顯影筆、指紋碳粉)
 * 軌道三：關鍵案件物證 (中毒咖啡杯樣品、殘留結晶、含水纖維泥土、時間戳刷卡紀錄)
 */

class Inventory {
  constructor() {
    this.supplies = [];     // 軌道一：生活道具
    this.tools = [];        // 軌道二：鑑識工具
    this.evidences = [];    // 軌道三：關鍵證物
    this.maxSlots = 30;

    // 預設攜帶基礎調查工具 (無毒校園科普器材)
    this.addTool({
      id: 'tool_magnifier',
      name: '多倍率手持光學放大鏡',
      type: 'optical',
      desc: '觀察指紋脊線、纖維走向與微痕破壞。'
    });
    this.addTool({
      id: 'tool_ph_paper',
      name: '廣用 pH 酸鹼試紙組',
      type: 'chemical',
      desc: '國小自然科學必備，快速檢驗液體酸鹼度（pH 1~14）。'
    });
    this.addTool({
      id: 'tool_uv_torch',
      name: '365nm 紫外光手電筒',
      type: 'fluorescence',
      desc: '激發隱形螢光墨水、熱敏顯色劑與微量纖維反應。'
    });
  }

  addSupply(item) {
    this.supplies.push({ ...item, collectedAt: new Date().toISOString() });
    return true;
  }

  addTool(tool) {
    if (!this.tools.find(t => t.id === tool.id)) {
      this.tools.push(tool);
    }
    return true;
  }

  addEvidence(evidence) {
    const exists = this.evidences.find(e => e.id === evidence.id);
    if (!exists) {
      this.evidences.push({
        ...evidence,
        examined: false,
        collectedAt: new Date().toISOString()
      });
      return true;
    }
    return false;
  }

  getEvidence(evidenceId) {
    return this.evidences.find(e => e.id === evidenceId) || null;
  }

  listAll() {
    return {
      supplies: this.supplies,
      tools: this.tools,
      evidences: this.evidences,
      totalCount: this.supplies.length + this.tools.length + this.evidences.length
    };
  }
}

module.exports = {
  Inventory
};
