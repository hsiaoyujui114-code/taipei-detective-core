/**
 * ============================================================================
 * TRUST SYSTEM (社區信賴度 Lv.1~Lv.5 與特區聲譽系統)
 * ============================================================================
 * 嚴格依照企劃書 07 節「社區信賴度等級系統」實裝：
 * Lv.1 陌生警戒：僅提供表面日常公務問答，隱蔽矛盾點。
 * Lv.2 熟面孔：提供目擊時間與粗略人影特徵，解鎖周邊彩蛋提示。
 * Lv.3 小常客：透露內部作業流程、排班異常與人際衝突。
 * Lv.4 名偵探：交出私人物證、隱藏帳冊、通聯紀錄或私人鑰匙。
 * Lv.5 榮譽守護者：全力協同調查、主動出面指認真兇、協助封鎖現場。
 *
 * 雙北八大特區聲譽 (0~100 分)：
 * 萬華特區、中正特區、淡水特區、北投特區、板橋特區、大同特區、松山特區、大安特區。
 */

class TrustSystem {
  constructor() {
    this.npcTrustMap = new Map();     // npcId -> trustLevel (1..5)
    this.sectorReputation = new Map();// sectorCode -> reputationPoints (0..100)

    // 初始化雙北各特區預設市民聲譽
    const defaultSectors = [
      '萬華特區', '中正特區', '淡水特區', '北投特區',
      '板橋特區', '大同特區', '松山特區', '大安特區'
    ];
    defaultSectors.forEach(s => this.sectorReputation.set(s, 20));
  }

  static getTrustTierTitle(level) {
    const titles = {
      1: 'Lv.1 陌生警戒 (冷淡防禦)',
      2: 'Lv.2 熟面孔 (日常友善)',
      3: 'Lv.3 小常客 (透露內情)',
      4: 'Lv.4 名偵探 (信賴託付)',
      5: 'Lv.5 榮譽守護者 (生死盟友)'
    };
    return titles[level] || 'Lv.1 陌生警戒';
  }

  getNpcTrust(npcId) {
    return this.npcTrustMap.get(npcId) || 1;
  }

  increaseNpcTrust(npcId, delta = 1) {
    const cur = this.getNpcTrust(npcId);
    const next = Math.min(5, Math.max(1, cur + delta));
    this.npcTrustMap.set(npcId, next);
    return {
      npcId,
      oldLevel: cur,
      newLevel: next,
      tierTitle: TrustSystem.getTrustTierTitle(next),
      increased: next > cur
    };
  }

  /**
   * 判定 NPC 是否願意透露更深層之秘密線索
   */
  canAccessClueLevel(npcId, requiredLevel = 2) {
    return this.getNpcTrust(npcId) >= requiredLevel;
  }

  getSectorReputation(sectorName) {
    return this.sectorReputation.get(sectorName) || 20;
  }

  addSectorReputation(sectorName, points) {
    const cur = this.getSectorReputation(sectorName);
    const next = Math.min(100, Math.max(0, cur + points));
    this.sectorReputation.set(sectorName, next);
    return {
      sectorName,
      oldPoints: cur,
      newPoints: next,
      isPerkUnlocked: next >= 60 // 達到 60 分解鎖在地街廓專屬禮遇
    };
  }

  getAllSectorStatus() {
    const result = {};
    for (const [sector, pts] of this.sectorReputation.entries()) {
      result[sector] = {
        reputation: pts,
        status: pts >= 60 ? '特區榮譽市民 (解鎖街坊專屬協助)' : '一般市民探索中'
      };
    }
    return result;
  }
}

module.exports = {
  TrustSystem
};
