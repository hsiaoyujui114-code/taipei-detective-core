/**
 * ============================================================================
 * INVESTIGATOR (都會調查員狀態模型與物理移動系統)
 * ============================================================================
 * 嚴格恪守三大憲法級最高絕對規範：
 * 1. 稱謂一律稱呼「都會調查員」(Investigator) 或「市民」。
 * 2. 名字一律使用真實專業華人全名，永久嚴禁違規舊名。
 * 3. 嚴禁任何歷史廢除職稱。
 * 4. 嚴禁瞬移傳送：玩家移動必須依據雙北地理座標實體步行或搭乘大眾運輸！
 *
 * 實裝企劃書 06 節「動森感事務所特產收藏」與「調查員換裝衣櫃」。
 */

const { Inventory } = require('./Inventory');
const { EcoWallet } = require('./EcoWallet');

// 計算地球表面兩點大圓經緯度距離 (公尺) - Haversine Formula
function calculateDistanceMeters(coords1, coords2) {
  const [lat1, lon1] = coords1;
  const [lat2, lon2] = coords2;
  const R = 6371000; // 地球半徑 (公尺)
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

class Investigator {
  constructor(name = '雙北行蹤調查員') {
    // 嚴格校驗：若傳入名字包含違規字樣則強制校正為預設名
    const tabooWords = ['\u85dd\u78a9', '\u76ca\u78a9'];
    if (tabooWords.some(t => name.includes(t))) {
      name = '雙北行蹤調查員';
    }

    this.name = name;
    this.roleTitle = '都會調查員'; // 憲法級稱謂
    this.level = 1;
    this.experience = 0;
    this.maxStamina = 100;
    this.stamina = 100;

    // 當前地理座標 (預設在西門町都會調查員事務所)
    this.currentCoords = [25.0425, 121.5072];
    this.currentLocationName = '西門町都會調查員事務所';

    this.inventory = new Inventory();
    this.wallet = new EcoWallet(350, true);

    this.activeCaseId = null;
    this.solvedCases = [];
    this.notebook = []; // 調查筆記本

    // 換裝衣櫃系統 (企劃書 06 節規格)
    this.currentOutfit = '英倫福爾摩斯格子風衣';
    this.availableOutfits = [
      '台北小學校服套裝',
      '英倫福爾摩斯格子風衣',
      '梅雨季通勤斗篷',
      '科學研究員工作白袍'
    ];

    // 事務所微型特產收藏擺設 (破案解鎖)
    this.roomSouvenirs = [];
  }

  // ─── 物理移動與防瞬移機制 ───

  /**
   * 步行移動 (計算實際距離、步速與體力消耗)
   */
  walkTo(targetCoords, locationName = '目標街區') {
    const distanceMeters = calculateDistanceMeters(this.currentCoords, targetCoords);
    const staminaCost = Math.max(1, Math.round(distanceMeters / 80)); // 每 80 公尺消耗 1 點體力

    if (this.stamina < staminaCost) {
      return {
        success: false,
        error: `體力不足 (需消耗 ${staminaCost} 點體力，目前剩餘 ${this.stamina})，請在路旁長椅稍作休息或進超商飲用補給！`,
        distanceMeters,
        staminaRequired: staminaCost
      };
    }

    // 步行速度約 4.5 km/h (75 m/min)
    const minutesNeeded = Math.max(1, Math.round(distanceMeters / 75));
    this.stamina -= staminaCost;
    this.currentCoords = targetCoords;
    this.currentLocationName = locationName;
    this.wallet.awardEcoAction('WALK_LOW_CARBON');

    return {
      success: true,
      movementType: 'WALK',
      distanceMeters,
      durationMinutes: minutesNeeded,
      staminaSpent: staminaCost,
      staminaRemaining: this.stamina,
      newCoords: this.currentCoords,
      locationName: this.currentLocationName,
      message: `實體步行抵達【${locationName}】(步行距離 ${distanceMeters}m，耗時約 ${minutesNeeded} 分鐘，消耗體力 ${staminaCost})`
    };
  }

  /**
   * 搭乘大眾運輸移動 (捷運 / 公車 / 輕軌)
   */
  transitTo(targetCoords, destinationStation, transportType = 'mrt') {
    const distanceMeters = calculateDistanceMeters(this.currentCoords, targetCoords);
    const distanceKm = distanceMeters / 1000;

    let baseFare = 20;
    let avgSpeedKmH = 32;

    if (transportType === 'bus') {
      baseFare = distanceKm > 8 ? 30 : 15;
      avgSpeedKmH = 18;
    } else {
      baseFare = EcoWallet.calculateMrtFare(distanceKm);
      avgSpeedKmH = 32;
    }

    const payResult = this.wallet.payTransitFare(baseFare, transportType);
    if (!payResult.success) {
      return payResult;
    }

    const minutesNeeded = Math.max(2, Math.round((distanceKm / avgSpeedKmH) * 60));
    this.currentCoords = targetCoords;
    this.currentLocationName = destinationStation;

    return {
      success: true,
      movementType: 'TRANSIT',
      transportType,
      distanceKm: Number(distanceKm.toFixed(2)),
      durationMinutes: minutesNeeded,
      fareDeducted: payResult.deducted,
      walletBalance: payResult.balance,
      newCoords: this.currentCoords,
      locationName: this.currentLocationName,
      message: `搭乘【${transportType.toUpperCase()}】抵達【${destinationStation}】(運程 ${distanceKm.toFixed(1)}km，行車約 ${minutesNeeded} 分鐘，${payResult.note || '扣款 $' + payResult.deducted})`
    };
  }

  /**
   * 瞬移判定 (全面嚴格攔截禁止！)
   */
  teleportTo(targetCoords) {
    return {
      success: false,
      isForbidden: true,
      error: '🈲 憲法級最高禁忌：都會調查員嚴禁瞬移！雙北都會講求真實空間感，請選擇步行或搭乘大眾運輸通勤。'
    };
  }

  // ─── 體力與筆記本管理 ───

  consumeStamina(amount) {
    if (this.stamina < amount) return false;
    this.stamina -= amount;
    return true;
  }

  recoverStamina(amount) {
    this.stamina = Math.min(this.maxStamina, this.stamina + amount);
  }

  addNotebookNote(title, content, tags = []) {
    const note = {
      id: 'note_' + Date.now(),
      timestamp: new Date().toISOString(),
      title,
      content,
      tags
    };
    this.notebook.push(note);
    return note;
  }

  // ─── 動森感衣櫃與特產收藏 (企劃書 06 節規格) ───

  changeOutfit(outfitName) {
    if (this.availableOutfits.includes(outfitName)) {
      this.currentOutfit = outfitName;
      return { success: true, outfit: outfitName, message: `已更換為【${outfitName}】！` };
    }
    return { success: false, error: '衣櫃中無此款服裝。' };
  }

  unlockCaseSouvenir(caseId) {
    const souvenirMap = {
      case_01: { id: 'souvenir_ximen', name: '西門紅樓潮流街頭塗鴉滑板架', desc: '街頭藝術與潮流文化的迷你縮影。' },
      case_02: { id: 'souvenir_tpe_station', name: '復刻台灣鐵路排骨便當盒造型收納盒', desc: '台北車站鐵道經典記憶。' },
      case_03: { id: 'souvenir_danshui', name: '淡水小渡船精緻木雕模型', desc: '淡水河口開港夕照紀念木雕。' },
      case_04: { id: 'souvenir_beitou', name: '北投香杉檜木泡澡小木桶', desc: '散發淡淡檜木香氣之迷你溫泉桶。' },
      case_05: { id: 'souvenir_lin_garden', name: '板橋林家花園方鑑齋八角漏窗微雕', desc: '秋分日影幾何光學紀念擺件。' },
      case_06: { id: 'souvenir_ximen_card', name: '限定動漫特典亞克力紀念立牌', desc: '西門超商偵探見證特典。' },
      case_07: { id: 'souvenir_bannan', name: '台北捷運三鶯高運量列車仿真合金模型', desc: '板南線急煞力學紀念車模。' },
      case_08: { id: 'souvenir_dadaocheng', name: '復古老藥鋪三十格百寶小抽屜櫃', desc: '迪化街百年南北貨藥材木工。' },
      case_09: { id: 'souvenir_bus_307', name: '首都客運 307 公車之王紀念銘牌', desc: '雙北運量冠軍路線徽章。' },
      case_10: { id: 'souvenir_daan', name: '大安綠樹小松鼠生態木雕', desc: '大安森林公園泥地生態紀念品。' }
    };

    const item = souvenirMap[caseId];
    if (item && !this.roomSouvenirs.find(s => s.id === item.id)) {
      this.roomSouvenirs.push({
        ...item,
        unlockedAt: new Date().toISOString()
      });
      return item;
    }
    return null;
  }

  getStatus() {
    return {
      name: this.name,
      roleTitle: this.roleTitle,
      level: this.level,
      stamina: `${this.stamina}/${this.maxStamina}`,
      currentCoords: this.currentCoords,
      currentLocation: this.currentLocationName,
      easyCard: `$${this.wallet.easyCardBalance}`,
      ecoPoints: this.wallet.ecoPoints,
      tpassActive: this.wallet.hasTpass1200,
      currentOutfit: this.currentOutfit,
      activeCase: this.activeCaseId,
      solvedCount: this.solvedCases.length,
      souvenirCount: this.roomSouvenirs.length,
      itemCount: this.inventory.listAll().totalCount
    };
  }
}

module.exports = {
  Investigator,
  calculateDistanceMeters
};
