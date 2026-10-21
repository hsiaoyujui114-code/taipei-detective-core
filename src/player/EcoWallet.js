/**
 * ============================================================================
 * ECO WALLET (悠遊卡 ✕ TPASS 1200 通勤月票 ✕ 環保減塑積分錢包)
 * ============================================================================
 * 落實企劃書 06 節：生活慢活與雙軌貨幣機制。
 * 結合真實大眾運輸運價扣款與國小環保減塑日常實踐（自備購物袋、環保杯減塑）。
 */

class EcoWallet {
  constructor(initialEasyCard = 300, hasTpass = true) {
    this.easyCardBalance = initialEasyCard; // 悠遊卡儲值金 (NTD)
    this.hasTpass1200 = hasTpass;           // 是否持有基北北桃 1200 通勤月票
    this.ecoPoints = 50;                    // 環保減塑綠色積分
    this.transactionHistory = [];
  }

  /**
   * 支付捷運/公車/火車票價
   */
  payTransitFare(amount, transportType = 'mrt') {
    if (this.hasTpass1200 && ['mrt', 'bus', 'tra', 'light_rail'].includes(transportType)) {
      this.recordTx('TPASS_FREE_RIDE', 0, `TPASS 1200 基北北桃吃到飽：${transportType.toUpperCase()} 免費通行`);
      return { success: true, deducted: 0, balance: this.easyCardBalance, note: 'TPASS 暢行' };
    }

    if (this.easyCardBalance < amount) {
      return { success: false, error: '悠遊卡餘額不足，請至捷運站加值機儲值！', balance: this.easyCardBalance };
    }

    this.easyCardBalance -= amount;
    this.recordTx('FARE_DEDUCT', -amount, `${transportType.toUpperCase()} 票價扣款`);
    return { success: true, deducted: amount, balance: this.easyCardBalance };
  }

  /**
   * 實踐環保減塑行為獲得獎勵積分
   */
  awardEcoAction(actionType) {
    const rewards = {
      BRING_ECO_BAG: { points: 10, desc: '自備購物袋，減少 1 個塑膠袋' },
      BRING_TUMBLER: { points: 15, desc: '自備環保杯至飲料店，省 5 元並獲綠色積分' },
      E_RECEIPT_MOBILE: { points: 5, desc: '載具儲存雲端發票，落實無紙化' },
      DECLINE_PLASTIC_CUTLERY: { points: 8, desc: '外帶主動拒絕一次性塑膠餐具' },
      RIDE_PUBLIC_TRANSIT: { points: 12, desc: '全程搭乘大眾運輸綠色通勤' }
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
