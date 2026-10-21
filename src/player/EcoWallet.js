/**
 * ============================================================================
 * ECO WALLET (悠遊卡 ✕ TPASS 1200 通勤月票 ✕ 環保減塑積分錢包)
 * ============================================================================
 * 嚴格依照企劃書 02A、06 節規格實裝：
 * 1. 雙北官方真實大眾運輸運價：
 *    - 台北捷運里程計費 (0~5km 20元 至 >31km 65元)。
 *    - 雙北公車段次計費 (一段票 15元 / 二段票 30元)。
 *    - 捷運公車雙向轉乘享 8 元轉乘優惠。
 *    - YouBike 2.0 台北市前 30 分鐘免費、新北市 5 元。
 *    - TPASS 1200 基北北桃都會通通勤月票 30 天無限搭乘。
 * 2. 實體門市 85 折優惠與手機虛擬外送機制 (防卡關)。
 * 3. 綠色減塑生活實踐：自備隨行杯折 5 元、自備購物袋、無紙化發票積分累積。
 */

class EcoWallet {
  constructor(initialEasyCard = 300, hasTpass = true) {
    this.easyCardBalance = initialEasyCard; // 悠遊卡儲值金 (NTD)
    this.hasTpass1200 = hasTpass;           // 是否持有基北北桃 1200 通勤月票
    this.ecoPoints = 50;                    // 環保減塑綠色積分
    this.transactionHistory = [];
    this.lastTransitTime = null;
    this.lastTransitType = null;
  }

  /**
   * 官方台北捷運里程階梯費率 (公里 ➔ 票價)
   */
  static calculateMrtFare(distanceKm) {
    if (distanceKm <= 5) return 20;
    if (distanceKm <= 8) return 25;
    if (distanceKm <= 11) return 30;
    if (distanceKm <= 14) return 35;
    if (distanceKm <= 17) return 40;
    if (distanceKm <= 20) return 45;
    if (distanceKm <= 23) return 50;
    if (distanceKm <= 27) return 55;
    if (distanceKm <= 31) return 60;
    return 65;
  }

  /**
   * 雙北公車段次計費 (一段票 15 元, 二段票 30 元)
   */
  static calculateBusFare(sections = 1) {
    return Math.max(1, sections) * 15;
  }

  /**
   * YouBike 2.0 費率計算
   */
  static calculateYouBikeFare(durationMinutes, city = 'Taipei') {
    if (durationMinutes <= 30) {
      return city.toLowerCase() === 'taipei' ? 0 : 5; // 台北市前30分免費，新北市5元
    }
    const extraBlocks = Math.ceil((durationMinutes - 30) / 30);
    const baseFee = city.toLowerCase() === 'taipei' ? 0 : 5;
    return baseFee + extraBlocks * 10;
  }

  /**
   * 支付捷運/公車/火車票價 (含轉乘優惠與 TPASS 扣抵)
   */
  payTransitFare(baseFare, transportType = 'mrt') {
    // 1. TPASS 1200 全面吃到飽
    if (this.hasTpass1200 && ['mrt', 'bus', 'tra', 'light_rail', 'youbike'].includes(transportType)) {
      this.recordTx('TPASS_FREE_RIDE', 0, `TPASS 1200 基北北桃暢行：${transportType.toUpperCase()} 免費通行`);
      this.lastTransitTime = Date.now();
      this.lastTransitType = transportType;
      this.awardEcoAction('RIDE_PUBLIC_TRANSIT');
      return { success: true, deducted: 0, balance: this.easyCardBalance, note: 'TPASS 1200 暢行' };
    }

    // 2. 雙向轉乘優惠判定 (60 分鐘內捷運 ⇄ 公車折抵 8 元)
    let actualFare = baseFare;
    const now = Date.now();
    let isTransferDiscount = false;
    if (this.lastTransitTime && (now - this.lastTransitTime <= 60 * 60 * 1000)) {
      if ((this.lastTransitType === 'mrt' && transportType === 'bus') ||
          (this.lastTransitType === 'bus' && transportType === 'mrt')) {
        actualFare = Math.max(0, baseFare - 8);
        isTransferDiscount = true;
      }
    }

    if (this.easyCardBalance < actualFare) {
      return {
        success: false,
        error: `悠遊卡餘額不足 (目前餘額 $${this.easyCardBalance}，應付 $${actualFare})，請至捷運站加值機儲值！`,
        balance: this.easyCardBalance
      };
    }

    this.easyCardBalance -= actualFare;
    this.lastTransitTime = now;
    this.lastTransitType = transportType;
    const note = isTransferDiscount
      ? `${transportType.toUpperCase()} 轉乘優惠扣款 $${actualFare} (折抵 8 元)`
      : `${transportType.toUpperCase()} 票價扣款 $${actualFare}`;

    this.recordTx('FARE_DEDUCT', -actualFare, note);
    this.awardEcoAction('RIDE_PUBLIC_TRANSIT');

    return {
      success: true,
      deducted: actualFare,
      balance: this.easyCardBalance,
      isTransferDiscount
    };
  }

  /**
   * 門市購物扣款 (支援實體到店 85 折優惠與手機虛擬配送加收 10 元外送費)
   */
  purchaseGoods(itemPrice, isPhysicalStore = true, useTumblerDiscount = false) {
    let finalPrice = itemPrice;
    let discountNote = '';

    if (isPhysicalStore) {
      // 實體到店享 85 折優惠 (企劃書 06 節規格)
      finalPrice = Math.round(itemPrice * 0.85);
      discountNote = '實體到店 85 折優惠';
    } else {
      // 手機虛擬配送需加收 10 元無人機運費 (防卡關備用)
      finalPrice = itemPrice + 10;
      discountNote = '手機虛擬外送 (含 10 元外送費)';
    }

    if (useTumblerDiscount) {
      finalPrice = Math.max(0, finalPrice - 5);
      discountNote += ' + 自備隨行杯折抵 5 元';
      this.awardEcoAction('BRING_TUMBLER');
    }

    if (this.easyCardBalance < finalPrice) {
      return {
        success: false,
        error: `悠遊卡餘額不足，應付 $${finalPrice}，目前餘額 $${this.easyCardBalance}`,
        balance: this.easyCardBalance
      };
    }

    this.easyCardBalance -= finalPrice;
    this.recordTx('PURCHASE', -finalPrice, `商品消費：${discountNote}，扣款 $${finalPrice}`);
    this.awardEcoAction('E_RECEIPT_MOBILE');

    return {
      success: true,
      deducted: finalPrice,
      balance: this.easyCardBalance,
      discountNote
    };
  }

  /**
   * 悠遊卡儲值加值 (支援台北捷運單程票/加值機)
   */
  topUp(amount) {
    if (amount <= 0) return { success: false, error: '儲值金額必須大於 0' };
    this.easyCardBalance += amount;
    this.recordTx('TOP_UP', amount, `捷運加值機儲值 +$${amount}`);
    return { success: true, balance: this.easyCardBalance };
  }

  /**
   * 實踐環保減塑行為獲得獎勵積分
   */
  awardEcoAction(actionType) {
    const rewards = {
      BRING_ECO_BAG: { points: 10, desc: '自備環保購物袋，減少 1 個塑膠袋' },
      BRING_TUMBLER: { points: 15, desc: '自備環保杯至飲料店，現省 5 元並獲綠色積分' },
      E_RECEIPT_MOBILE: { points: 5, desc: '載具儲存雲端發票，落實無紙化' },
      DECLINE_PLASTIC_CUTLERY: { points: 8, desc: '外帶主動拒絕一次性塑膠餐具' },
      RIDE_PUBLIC_TRANSIT: { points: 12, desc: '全程搭乘大眾運輸綠色通勤' },
      WALK_LOW_CARBON: { points: 6, desc: '雙北街廓健康步行低碳探索' }
    };

    const action = rewards[actionType] || { points: 5, desc: '一般減塑生活實踐' };
    this.ecoPoints += action.points;
    this.recordTx('ECO_REWARD', action.points, action.desc);
    return {
      pointsAwarded: action.points,
      totalPoints: this.ecoPoints,
      description: action.desc
    };
  }

  recordTx(type, amount, note) {
    this.transactionHistory.unshift({
      timestamp: new Date().toISOString(),
      type,
      amount,
      note,
      balance: this.easyCardBalance,
      ecoPoints: this.ecoPoints
    });
    if (this.transactionHistory.length > 50) this.transactionHistory.pop();
  }
}

module.exports = {
  EcoWallet
};
