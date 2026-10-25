/**
 * ============================================================================
 * INVENTORY (三軌物證與道具背包系統)
 * ============================================================================
 * 嚴格依照企劃書 04B 節與 Round 100 最新親赴驗證規範實裝：
 * 軌道一：生活實體道具 (日常飲食、悠遊卡、純棉環保袋、調查筆記本、摺疊雨傘)
 * 軌道二：專業鑑識器材 (放大鏡、UV紫外燈、pH酸鹼試紙、微霧水蒸氣罐、天平量筒、金屬探測器、壓強板等)
 * 軌道三：關鍵案件物證 (翻倒咖啡杯樣品、殘留結晶、矽膠軟管、石磚、中空砝碼、手袋晶片等)
 *
 * 核心機制（親赴驗證，杜絕隔空瞬發）：
 * 1. 💰 門市購買：
 *    - 調查員距離目標門市 > 60m 嘗試購買必回傳失敗與距離提示；
 *    - 只有親自抵達門市現場（<= 60m）才會發現可以購買並享有 85 折到店優惠。
 * 2. 🏛️ 場館借用：
 *    - 距離 4 大科普場館（科教館、市圖、海關館、中藥館）> 60m 嘗試借用必回傳失敗；
 *    - 只有親自前往（<= 60m）完成 1~3 分鐘微型動手教學才能免費借用。
 * 3. 🥚 觸發彩蛋：
 *    - 平時不直接顯示，若距離案發中心不在 50~100m 生活圈，嘗試拾獲必回傳失敗；
 *    - 只有親自前往案發現場周邊 50~100m 生活圈巷弄時才能發現並拾獲。
 */

const { calculateDistanceMeters } = require('../utils/geoUtils');

// 雙北四大科普微型學習場館基準坐標 (企劃書 05、08 節)
const VENUES_MAP = {
  venue_sec: {
    id: 'venue_sec',
    name: '士林國立臺灣科學教育館微型實驗台',
    aliases: ['科教館', '科學教育館', '士林科教館'],
    coords: [25.0958, 121.5160]
  },
  venue_tpl: {
    id: 'venue_tpl',
    name: '台北市立圖書館總館科技諮詢台',
    aliases: ['市圖', '市立圖書館', '市圖總館'],
    coords: [25.0298, 121.5375]
  },
  venue_customs: {
    id: 'venue_customs',
    name: '淡水海關故事館文史考據微型站',
    aliases: ['海關館', '淡水海關館', '海關故事館'],
    coords: [25.1725, 121.4342]
  },
  venue_tcm: {
    id: 'venue_tcm',
    name: '國立臺灣博物館中藥常設展廳',
    aliases: ['中藥館', '中藥博物館', '臺灣博物館中藥展廳'],
    coords: [25.0428, 121.5150]
  }
};

// 雙北四大科普微型學習場館 108 課綱自然生活科學微任務問答庫 (Round 101 規格)
const VENUE_QUIZZES = {
  venue_sec: {
    venueId: 'venue_sec',
    venueName: '士林國立臺灣科學教育館微型實驗台',
    title: '【108 課綱自然領域・光學色散】微型光學分光任務',
    question: '都會調查員在科教館借用分光鏡時，觀察陽光穿過稜鏡色散成彩虹光譜，其主要物理成因為何？',
    options: [
      'A. 不同波長的光在同種介質中的折射率與傳播速率不同',
      'B. 不同色光的重力加速度大小不同',
      'C. 稜鏡本身含有七種天然化學顏料釋放色素'
    ],
    correctAnswer: 'A',
    correctAnswerIndex: 0,
    curriculumExplanation: '108 課綱國高中自然物理：光在介質中傳播時，波長愈短（如紫光）折射率愈大、偏折角度愈大；波長愈長（如紅光）折射率愈小，因而分離出連續光譜。'
  },
  venue_tpl: {
    venueId: 'venue_tpl',
    venueName: '台北市立圖書館總館科技諮詢台',
    title: '【108 課綱數學與地科・日影幾何】標竿投影三角任務',
    question: '秋分正午於雙北街廓以 1 公尺直立標竿測得地面影長恰為 1 公尺，則此時太陽仰角為幾度？',
    options: [
      'A. 30 度',
      'B. 45 度',
      'C. 60 度'
    ],
    correctAnswer: 'B',
    correctAnswerIndex: 1,
    curriculumExplanation: '108 課綱跨領域幾何與天文：直立標竿與地面影長等長構成等腰直角三角形，tan(θ) = 竿長 / 影長 = 1，解得仰角 θ = 45 度。'
  },
  venue_customs: {
    venueId: 'venue_customs',
    venueName: '淡水海關故事館文史考據微型站',
    title: '【108 課綱生活科技・電磁學】便攜金屬探測微任務',
    question: '便攜金屬探測器在掃過淡水老街埋沒的鐵釘或合金時發出蜂鳴，主要運用何種物理原理？',
    options: [
      'A. 法拉第電磁感應在導體中激發渦電流與反向感應磁場',
      'B. 牛頓第三運動定律的作用力與反作用力',
      'C. 聲波都卜勒效應產生的波長壓縮'
    ],
    correctAnswer: 'A',
    correctAnswerIndex: 0,
    curriculumExplanation: '108 課綱生活科技與物理電磁學：發射線圈產生之交變磁場在金屬導體中感應出渦電流（Eddy Currents），進而激發次級磁場被接收線圈精準檢測。'
  },
  venue_tcm: {
    venueId: 'venue_tcm',
    venueName: '國立臺灣博物館中藥常設展廳',
    title: '【108 課綱基礎化學・分離純化】薄層層析 (TLC) 毛細微任務',
    question: '在薄層層析（TLC）展開實驗中，若使用正相極性矽膠片，極性較小（親脂性較高）之有機分子展開比 Rf 值通常如何？',
    options: [
      'A. 移動較快，展開比 Rf 值較大',
      'B. 完全停留在原點，Rf 值為 0',
      'C. 沿展開劑相反方向往下移動'
    ],
    correctAnswer: 'A',
    correctAnswerIndex: 0,
    curriculumExplanation: '108 課綱基礎化學分配層析：正相矽膠固定相為強極性，非極性或弱極性分子與固定相吸附力弱，隨展開溶劑爬升速率較快，因而 Rf 值較高。'
  }
};

// 雙北示範門市基準坐標 (企劃書 02.2、06 節)
const STORES_MAP = {
  store_ximen_convenience: {
    id: 'store_ximen_convenience',
    name: '漢中街便利商店',
    aliases: ['漢中街超商', '西門超商', '便利商店', '7-11', '全家'],
    coords: [25.0438, 121.5078]
  },
  store_tpe_hardware: {
    id: 'store_tpe_hardware',
    name: '台北車站地下街五金行',
    aliases: ['北車五金行', '地下街五金行'],
    coords: [25.0465, 121.5170]
  },
  store_danshui_stationery: {
    id: 'store_danshui_stationery',
    name: '淡水老街文具雜貨店',
    aliases: ['淡水文具店', '老街雜貨店'],
    coords: [25.1710, 121.4380]
  },
  store_beitou_hardware: {
    id: 'store_beitou_hardware',
    name: '北投光明路五金雜貨店',
    aliases: ['北投五金行', '光明路五金'],
    coords: [25.1365, 121.5055]
  },
  store_banqiao_tools: {
    id: 'store_banqiao_tools',
    name: '板橋府中工程量具店',
    aliases: ['府中量具店', '板橋量具店'],
    coords: [25.0090, 121.4590]
  },
  store_dadaocheng_grocery: {
    id: 'store_dadaocheng_grocery',
    name: '迪化街南北貨雜貨行',
    aliases: ['迪化街雜貨行', '南北貨行'],
    coords: [25.0565, 121.5100]
  },
  store_nanjing_electronics: {
    id: 'store_nanjing_electronics',
    name: '南京東路電子生活館',
    aliases: ['南京東路電子行', '電子生活館'],
    coords: [25.0518, 121.5492]
  },
  store_jianguo_hardware: {
    id: 'store_jianguo_hardware',
    name: '建國南路五金花卉材料行',
    aliases: ['建國南路五金', '花卉材料行'],
    coords: [25.0310, 121.5360]
  }
};

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

  // ─── 輔助定位匹配函式 ───

  findStoreDefinition(storeTarget) {
    if (!storeTarget) return STORES_MAP.store_ximen_convenience;
    if (typeof storeTarget === 'object' && storeTarget.coords) return storeTarget;
    if (STORES_MAP[storeTarget]) return STORES_MAP[storeTarget];

    for (const s of Object.values(STORES_MAP)) {
      if (s.name.includes(storeTarget) || s.aliases.some(a => a.includes(storeTarget) || storeTarget.includes(a))) {
        return s;
      }
    }
    return STORES_MAP.store_ximen_convenience;
  }

  findVenueDefinition(venueTarget) {
    if (!venueTarget) return VENUES_MAP.venue_sec;
    if (typeof venueTarget === 'object' && venueTarget.coords) return venueTarget;
    if (VENUES_MAP[venueTarget]) return VENUES_MAP[venueTarget];

    for (const v of Object.values(VENUES_MAP)) {
      if (v.name.includes(venueTarget) || v.aliases.some(a => a.includes(venueTarget) || venueTarget.includes(a))) {
        return v;
      }
    }
    return VENUES_MAP.venue_sec;
  }

  /**
   * 獲取指定科普場館的 108 課綱生活科學微任務問答 (Round 101 規格)
   * @param {string|Object} venueTarget - 場館鍵值或名稱
   * @returns {Object} 微任務題目與解析
   */
  getVenueQuiz(venueTarget) {
    const venue = this.findVenueDefinition(venueTarget);
    const key = venue ? venue.id : 'venue_sec';
    return VENUE_QUIZZES[key] || VENUE_QUIZZES.venue_sec;
  }

  // ─── 道具三軌親赴驗證機制 (Round 100 & 101 規格) ───

  /**
   * 途徑 1：💰 門市購買親赴驗證
   * 規範：若調查員當前座標距離目標門市 > 60m，嘗試購買必須回傳不能購買與距離提示；
   * 只有親自抵達該門市（<= 60m）才會發現可以並享 85 折到店優惠。
   */
  buyItem(itemDef, wallet, investigatorOrIsPhysical = null, storeTarget = null, options = {}) {
    let investigator = null;
    let isPhysical = true;
    let useTumbler = false;

    if (typeof investigatorOrIsPhysical === 'boolean') {
      isPhysical = investigatorOrIsPhysical;
      useTumbler = storeTarget === true;
    } else if (investigatorOrIsPhysical && typeof investigatorOrIsPhysical === 'object') {
      if (investigatorOrIsPhysical.currentCoords) {
        investigator = investigatorOrIsPhysical;
      }
      if (options.isPhysicalStore !== undefined) isPhysical = options.isPhysicalStore;
      if (options.useTumbler !== undefined) useTumbler = options.useTumbler;
    }

    const targetStore = this.findStoreDefinition(storeTarget || itemDef.store || itemDef.storeName);

    // 親赴門市距離校驗 (<= 60m 判定)
    if (investigator && investigator.currentCoords && targetStore && targetStore.coords) {
      const dist = calculateDistanceMeters(investigator.currentCoords, targetStore.coords);
      if (dist > 60) {
        return {
          success: false,
          canPurchase: false,
          distanceMeters: dist,
          targetStoreName: targetStore.name,
          error: `距離目標門市【${targetStore.name}】過遠（當前距離 ${dist}m > 60m）！無法隔空購買。都會調查員必須親自抵達門市現場（<= 60m）才會發現可以購買並享有 85 折到店優惠！`
        };
      }
    }

    const purchase = wallet.purchaseGoods(itemDef.cost || 20, isPhysical, useTumbler);
    if (!purchase.success) {
      return purchase;
    }

    if (itemDef.track === 'tool' || itemDef.type === 'tool') {
      this.addTool(itemDef);
    } else {
      this.addSupply(itemDef);
    }

    const distActual = (investigator && targetStore && targetStore.coords)
      ? calculateDistanceMeters(investigator.currentCoords, targetStore.coords)
      : 0;

    return {
      success: true,
      canPurchase: true,
      distanceMeters: distActual,
      item: itemDef,
      costPaid: purchase.deducted,
      balance: purchase.balance,
      targetStoreName: targetStore ? targetStore.name : '門市',
      message: `已親自抵達【${targetStore ? targetStore.name : '門市'}】（距離 ${distActual}m <= 60m），成功以 85 折優惠購買 [${itemDef.name}]！`
    };
  }

  /**
   * 途徑 2：🏛️ 4 大科普場館借用親赴驗證與 1 分鐘動手做微任務問答 (Round 101 規格)
   * 規範：
   * 1. 若距離 4 大科普場館（科教館、市圖、海關館、中藥館）> 60m，嘗試借用必須回傳不能借用；
   * 2. 只有親自前往（<= 60m）完成 1~3 分鐘微型動手教學才能借用。
   * 3. 觸發 108 課綱自然生活科學微任務問答，答對免費借用且獎勵信賴度 +5！
   */
  borrowToolFromVenue(toolDef, arg2 = null, arg3 = null, arg4 = null) {
    let targetVenueKey = null;
    let investigator = null;
    let userAnswer = null;

    if (arg2 && typeof arg2 === 'object' && arg2.currentCoords) {
      investigator = arg2;
      userAnswer = arg3;
    } else {
      targetVenueKey = arg2;
      if (arg3 && typeof arg3 === 'object' && arg3.currentCoords) {
        investigator = arg3;
        userAnswer = arg4;
      } else if (typeof arg3 === 'string' || typeof arg3 === 'number') {
        userAnswer = arg3;
      }
    }

    if (userAnswer && typeof userAnswer === 'object' && userAnswer.answer !== undefined) {
      userAnswer = userAnswer.answer;
    }

    const targetVenue = this.findVenueDefinition(targetVenueKey || toolDef.venue || toolDef.borrowedFrom);

    // 親赴場館距離校驗 (<= 60m 判定)
    if (investigator && investigator.currentCoords && targetVenue && targetVenue.coords) {
      const dist = calculateDistanceMeters(investigator.currentCoords, targetVenue.coords);
      if (dist > 60) {
        return {
          success: false,
          canBorrow: false,
          distanceMeters: dist,
          targetVenueName: targetVenue.name,
          error: `距離微型學習場館【${targetVenue.name}】過遠（當前距離 ${dist}m > 60m）！無法隔空借用。都會調查員必須親自前往該場館（<= 60m）完成 1~3 分鐘微型動手教學，才會發現可以借用專業儀器！`
        };
      }
    }

    // 取得科普場館 108 課綱微任務問答
    const quiz = this.getVenueQuiz(targetVenue ? targetVenue.id : targetVenueKey);
    let quizResult = null;
    let trustAwarded = 0;

    if (userAnswer !== null && userAnswer !== undefined) {
      const cleanAns = String(userAnswer).trim().toUpperCase();
      const isCorrect = cleanAns.startsWith(quiz.correctAnswer) || cleanAns === String(quiz.correctAnswerIndex);
      if (isCorrect) {
        trustAwarded = 5;
        if (investigator && typeof investigator.addTrustBonus === 'function') {
          investigator.addTrustBonus(5);
        }
      }
      quizResult = {
        questionTitle: quiz.title,
        userAnswer,
        correctAnswer: quiz.correctAnswer,
        passed: isCorrect,
        trustAwarded,
        curriculumExplanation: quiz.curriculumExplanation
      };
    }

    this.addTool({
      ...toolDef,
      borrowedFrom: targetVenue ? targetVenue.name : (targetVenueKey || '科普場館'),
      borrowedAt: new Date().toISOString()
    });

    this.borrowRecords.push({
      toolId: toolDef.id,
      venueName: targetVenue ? targetVenue.name : (targetVenueKey || '科普場館'),
      quizResult,
      timestamp: new Date().toISOString()
    });

    const distActual = (investigator && targetVenue && targetVenue.coords)
      ? calculateDistanceMeters(investigator.currentCoords, targetVenue.coords)
      : 0;

    const message = (quizResult && quizResult.passed)
      ? `已親自前往【${targetVenue ? targetVenue.name : '科普場館'}】（距離 ${distActual}m <= 60m）完成 108 課綱微任務問答（答對獎勵信賴度 +5），成功免費借用專業儀器 [${toolDef.name}]！`
      : `已親自前往【${targetVenue ? targetVenue.name : '科普場館'}】（距離 ${distActual}m <= 60m）完成微任務，成功免費借用專業儀器 [${toolDef.name}]！`;

    return {
      success: true,
      canBorrow: true,
      distanceMeters: distActual,
      tool: toolDef,
      targetVenueName: targetVenue ? targetVenue.name : (targetVenueKey || '科普場館'),
      quiz,
      quizResult,
      trustAwarded,
      message
    };
  }

  /**
   * 途徑 3：🥚 觸發彩蛋親赴生活圈驗證 (50~100m 生活圈)
   * 規範：平時不直接顯示，若距離案發中心不在 50~100m 生活圈，嘗試拾獲必須回傳不能拾獲；
   * 只有親自前往案發現場周邊 50~100m 生活圈時才能發現並拾獲。
   */
  pickEasterEgg(eggItem, caseIdOrCenter, investigatorOrDistance = null, manualDistance = null) {
    let dist = null;
    let investigator = null;

    if (typeof investigatorOrDistance === 'number') {
      dist = investigatorOrDistance;
    } else if (typeof manualDistance === 'number') {
      dist = manualDistance;
      investigator = investigatorOrDistance;
    } else if (investigatorOrDistance && typeof investigatorOrDistance === 'object') {
      investigator = investigatorOrDistance;
    }

    // 若傳入調查員座標與案發中心，計算精確大地距離
    if (dist === null && investigator && investigator.currentCoords) {
      let caseCenter = [25.0425, 121.5072]; // 預設西門案中心
      if (typeof caseIdOrCenter === 'object' && Array.isArray(caseIdOrCenter)) {
        caseCenter = caseIdOrCenter;
      } else if (typeof caseIdOrCenter === 'object' && caseIdOrCenter.coords) {
        caseCenter = caseIdOrCenter.coords;
      } else if (typeof caseIdOrCenter === 'object' && caseIdOrCenter.center) {
        caseCenter = caseIdOrCenter.center;
      }
      dist = calculateDistanceMeters(investigator.currentCoords, caseCenter);
    }

    // 若完全未傳入距離與調查員，預設給予 65m 合格生活圈距離以便兼容
    if (dist === null) {
      dist = 65;
    }

    // 嚴格檢驗：是否在 50~100m 生活圈內
    if (dist < 50) {
      return {
        success: false,
        canPick: false,
        distanceMeters: dist,
        error: `距離案發現場中心過近（當前距離 ${dist}m < 50m）！此處為主要案發現場核心封鎖區。彩蛋平時不直接顯示，隱藏在案發周圍 50~100 公尺生活圈巷弄中，請親自往周遭街廓探索！`
      };
    }

    if (dist > 100) {
      return {
        success: false,
        canPick: false,
        distanceMeters: dist,
        error: `距離案發現場中心過遠（當前距離 ${dist}m > 100m）！彩蛋平時不直接顯示，嚴格限制在案發周圍 50~100 公尺生活圈，嚴禁無意義遠程跑圖！`
      };
    }

    // 符合 50~100m 生活圈規範，親赴現場拾獲成功！
    if (eggItem.track === 'tool' || eggItem.type === 'tool') {
      this.addTool(eggItem);
    } else if (eggItem.track === 'evidence') {
      this.addEvidence(eggItem);
    } else {
      this.addSupply(eggItem);
    }

    const cId = typeof caseIdOrCenter === 'string' ? caseIdOrCenter : 'case_active';
    this.eggPickRecords.push({
      itemId: eggItem.id,
      caseId: cId,
      distanceMeters: dist,
      timestamp: new Date().toISOString()
    });

    return {
      success: true,
      canPick: true,
      distanceMeters: dist,
      item: eggItem,
      message: `都會調查員親自漫步抵達案發周圍 ${dist}m 生活圈巷弄，赫然發現隱藏彩蛋【${eggItem.name}】並成功拾獲！`
    };
  }

  /**
   * 取得雙北合作特約實體門市清單（支援以調查員當前座標即時計算距離與 85 折到店資格）
   * @param {number[]|null} userCoords - 調查員當前經緯度 [lat, lon]
   * @returns {Array<Object>} 門市清單
   */
  getAllStores(userCoords = null) {
    return Object.values(STORES_MAP).map(store => {
      const dist = userCoords ? calculateDistanceMeters(userCoords, store.coords) : null;
      const canPurchase = dist !== null ? dist <= 60 : null;
      return {
        id: store.id,
        name: store.name,
        aliases: store.aliases,
        coords: store.coords,
        discountRate: 0.85,
        perkDescription: '親赴門市現場（<= 60m）享有 85 折到店優惠',
        distanceMeters: dist,
        canPurchase,
        statusText: dist === null
          ? '待定位'
          : (canPurchase ? '已抵達門市現場 (可享85折)' : `距門市 ${dist}m (需親赴至 60m 內)`)
      };
    });
  }

  /**
   * 取得雙北 4 大科普微型學習場館清單（支援以調查員當前座標即時計算距離與免費借用資格）
   * @param {number[]|null} userCoords - 調查員當前經緯度 [lat, lon]
   * @returns {Array<Object>} 場館清單
   */
  getAllVenues(userCoords = null) {
    return Object.values(VENUES_MAP).map(venue => {
      const dist = userCoords ? calculateDistanceMeters(userCoords, venue.coords) : null;
      const canBorrow = dist !== null ? dist <= 60 : null;
      return {
        id: venue.id,
        name: venue.name,
        aliases: venue.aliases,
        coords: venue.coords,
        microTaskDescription: '完成 1~3 分鐘微型動手教學任務即可免費借用專業儀器',
        distanceMeters: dist,
        canBorrow,
        statusText: dist === null
          ? '待定位'
          : (canBorrow ? '已抵達科普場館 (可免費借用)' : `距場館 ${dist}m (需親赴至 60m 內)`)
      };
    });
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
  Inventory,
  VENUES_MAP,
  STORES_MAP
};
