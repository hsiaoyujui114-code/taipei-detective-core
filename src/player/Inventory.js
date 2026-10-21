/**
 * ============================================================================
 * INVENTORY (三軌物證與道具背包系統)
 * ============================================================================
 * 嚴格依照企劃書 04B 節「破案道具三軌取得機制」實裝：
 * 軌道一：生活實體道具 (日常飲食、悠遊卡、純棉環保袋、調查筆記本、摺疊雨傘)
 * 軌道二：專業鑑識器材 (放大鏡、UV紫外燈、pH酸鹼試紙、微霧水蒸氣罐、天平量筒、金屬探測器、壓強板等)
 * 軌道三：關鍵案件物證 (翻倒咖啡杯樣品、殘留結晶、矽膠軟管、石磚、中空砝碼、手袋晶片等)
 *
 * 支援三軌取得機制：
 * 1. 💰 花錢購買 (超商/五金行 85 折或手機外送)
 * 2. 🏛️ 親赴場館借用 (科教館/市圖/海關故事館/中藥博物館微互動免費借用)
 * 3. 🥚 案發周圍 50~100 公尺巷弄彩蛋拾獲 (半徑生活圈就近發現)
 */

class Inventory {
  constructor() {
    this.supplies = [];     // 軌道一：生活道具
    this.tools = [];        // 軌道二：鑑識工具
    this.evidences = [];    // 軌道三：關鍵證物
    this.maxSlots = 50;
    this.borrowRecords = [];
    this.eggPickRecords = [];

    // 初始化調查員預設日常道具 (軌道一)
    this.addSupply({
      id: 'supply_easycard',
      name: '雙北紀念悠遊卡 (基北北桃 TPASS 1200 暢行版)',
      type: 'transit',
      desc: '已綁定基北北桃 1200 通勤月票，大眾捷運、市區公車無限搭乘。'
    });
    this.addSupply({
      id: 'supply_eco_bag',
      name: '純棉加厚折疊環保購物袋',
      type: 'eco',
      desc: '外帶購物減少塑膠袋，累計綠色減塑積分。'
    });
    this.addSupply({
      id: 'supply_tumbler',
      name: '雙層不鏽鋼保溫隨行杯 (500ml)',
      type: 'eco',
      desc: '自備飲料隨行杯現省 5 元，累積綠色點數。'
    });
    this.addSupply({
      id: 'supply_notebook',
      name: '都會調查員防水便攜筆記本',
      type: 'record',
      desc: '記錄目擊證詞、矛盾破綻與科學實驗數據。'
    });

    // 初始化基礎科普鑑識器材 (軌道二：無毒校園科普器材)
    this.addTool({
      id: 'tool_magnifier',
      name: '多倍率手持光學放大鏡 (10x/30x)',
      type: 'optical',
      desc: '觀察指紋脊線、纖維走向、金屬微痕與斷裂面。'
    });
    this.addTool({
      id: 'tool_ph_paper',
      name: '廣用 pH 酸鹼試紙組 (pH 1~14)',
      type: 'chemical',
      desc: '國小自然科學必備，快速檢驗液體酸鹼度（紅酸綠中藍強鹼）。'
    });
    this.addTool({
      id: 'tool_uv_torch',
      name: '365nm 專業紫外光鑑識手電筒',
      type: 'fluorescence',
      desc: '激發隱形防偽螢光油墨、微量生物鹼色帶與螢光纖維反應。'
    });
  }

  // ─── 軌道一：生活道具管理 ───
  addSupply(item) {
    if (!this.supplies.find(s => s.id === item.id)) {
      this.supplies.push({
        ...item,
        collectedAt: new Date().toISOString()
      });
      return true;
    }
    return false;
  }

  getSupply(supplyId) {
    return this.supplies.find(s => s.id === supplyId) || null;
  }

  // ─── 軌道二：專業鑑識器材管理 ───
  addTool(tool) {
    if (!this.tools.find(t => t.id === tool.id)) {
      this.tools.push({
        ...tool,
        obtainedAt: new Date().toISOString()
      });
      return true;
    }
    return false;
  }

  hasTool(toolId) {
    return this.tools.some(t => t.id === toolId);
  }

  getTool(toolId) {
    return this.tools.find(t => t.id === toolId) || null;
  }

  // ─── 軌道三：案件關鍵物證管理 ───
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

  updateEvidenceStatus(evidenceId, examinedResult) {
    const ev = this.getEvidence(evidenceId);
    if (ev) {
      ev.examined = true;
      ev.examinedResult = examinedResult;
      ev.examinedAt = new Date().toISOString();
      return true;
    }
    return false;
  }

  // ─── 道具三軌取得途徑 (企劃書 04B 核心規格) ───

  /**
   * 途徑 1：💰 花錢在商店購買消耗器材
   */
  buyItem(itemDef, wallet, isPhysicalStore = true, useTumbler = false) {
    const purchase = wallet.purchaseGoods(itemDef.cost || 20, isPhysicalStore, useTumbler);
    if (!purchase.success) {
      return purchase;
    }

    if (itemDef.track === 'tool' || itemDef.type === 'tool') {
      this.addTool(itemDef);
    } else {
      this.addSupply(itemDef);
    }

    return {
      success: true,
      item: itemDef,
      costPaid: purchase.deducted,
      balance: purchase.balance,
      note: purchase.discountNote
    };
  }

  /**
   * 途徑 2：🏛️ 親赴科普場館免費借用專業儀器 (科教館/市圖/海關館/中藥館)
   */
  borrowToolFromVenue(toolDef, venueName) {
    this.addTool({
      ...toolDef,
      borrowedFrom: venueName,
      borrowedAt: new Date().toISOString()
    });
    this.borrowRecords.push({
      toolId: toolDef.id,
      venueName,
      timestamp: new Date().toISOString()
    });
    return {
      success: true,
      tool: toolDef,
      message: `已於【${venueName}】完成科普互動微任務，成功借用專業儀器 [${toolDef.name}]！`
    };
  }

  /**
   * 途徑 3：🥚 案發周圍 50~100 公尺巷弄彩蛋拾獲
   */
  pickEasterEgg(eggItem, caseId, distanceMeters = 40) {
    if (distanceMeters > 100) {
      return {
        success: false,
        error: `彩蛋距離超出 100 公尺規範 (目前距離 ${distanceMeters}m)，嚴禁無意義遠程跑圖！`
      };
    }

    if (eggItem.track === 'tool' || eggItem.type === 'tool') {
      this.addTool(eggItem);
    } else if (eggItem.track === 'evidence') {
      this.addEvidence(eggItem);
    } else {
      this.addSupply(eggItem);
    }

    this.eggPickRecords.push({
      itemId: eggItem.id,
      caseId,
      distanceMeters,
      timestamp: new Date().toISOString()
    });

    return {
      success: true,
      item: eggItem,
      distanceMeters,
      message: `在案發生活圈周邊 ${distanceMeters} 公尺巷弄發現彩蛋，免費取得 [${eggItem.name}]！`
    };
  }

  listAll() {
    return {
      supplies: this.supplies,
      tools: this.tools,
      evidences: this.evidences,
      totalCount: this.supplies.length + this.tools.length + this.evidences.length,
      borrowCount: this.borrowRecords.length,
      eggPicksCount: this.eggPickRecords.length
    };
  }
}

module.exports = {
  Inventory
};
