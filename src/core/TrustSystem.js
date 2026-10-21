/**
 * ============================================================================
 * TRUST SYSTEM (社區信賴度與 NPC 關係網系統)
 * ============================================================================
 * 落實企劃書 07 節「社區信賴度 Lv.1~Lv.5」：
 * Lv.1 陌生警戒：僅提供表面日常公務問答。
 * Lv.2 友善合作：提供目擊時間與粗略人影特徵。
 * Lv.3 深入信任：透露內部作業流程與關鍵矛盾點。
 * Lv.4 患難之交：交出私人物證、隱藏錄音或通聯線索。
 * Lv.5 都會盟友：主動通報現場異常移動或協助攔阻嫌犯。
 */

class TrustSystem {
  constructor() {
    this.npcTrustMap = new Map();     // npcId -> trustLevel (1..5)
    this.sectorTrustMap = new Map();  // sectorCode -> reputationPoints (0..100)
  }

  getNpcTrust(npcId) {
    return this.npcTrustMap.get(npcId) || 1;
  }

  increaseNpcTrust(npcId, delta = 1) {
    const cur = this.getNpcTrust(npcId);
    const next = Math.min(5, cur + delta);
    this.npcTrustMap.set(npcId, next);
    return next;
  }

  getSectorReputation(sectorCode) {
    return this.sectorTrustMap.get(sectorCode) || 10;
  }

  addSectorReputation(sectorCode, points) {
    const cur = this.getSectorReputation(sectorCode);
    const next = Math.min(100, cur + points);
    this.sectorTrustMap.set(sectorCode, next);
    return next;
  }
}

module.exports = {
  TrustSystem
};
