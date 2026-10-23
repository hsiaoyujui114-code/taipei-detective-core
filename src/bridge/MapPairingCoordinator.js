/**
 * ============================================================================
 * MAP PAIRING COORDINATOR (地圖協同調度器)
 * ============================================================================
 * 專為《雙北漫遊：都會行蹤》偵探核心系統與 Web Leaflet 地圖系統深度無縫對接設計。
 *
 * 核心職責 (Architecture & Responsibilities)：
 * 1. 搜查警戒圈管理與派發 (Crime Scene Perimeter Dispatch)：
 *    - 10 大示範案件 GPS 中心點、半徑 (50~150m)、顏色與警戒黃線規範。
 * 2. 空間定位與案發距離感測 (Geospatial Proximity Tracking)：
 *    - 接收地圖回傳經緯度，實時演算距離、步程、體力扣減、防瞬移審查與進入現場判定。
 * 3. 現場物證與關係人地圖標記 (Map POI & Suspect Markers)：
 *    - 嫌疑人標記與口供筆錄狀態雙向綁定 (Interrogation State Binding)。
 *    - 物證標記與生活科學檢驗狀態綁定。
 * 4. 三軌親赴現場驗證對接 (Round 100 On-Site Physical Verification)：
 *    - 門市親赴 85 折結算 (<= 60m 判定)。
 *    - 4 大科普場館借用通知 (<= 60m 微任務判定)。
 *    - 案發 50~100m 巷弄生活圈彩蛋拾獲判定。
 * 5. 建築物進出切換 (Proposal 02.2 Building Entry / Collider System)：
 *    - 可進入建築圖案標記 (🏪, ☕, 🌿, 🏛️, 🚪, ♨️) 與 <= 25m 大門進出。
 *    - 不可進建築無圖案 (icon: null) 實體街景碰撞阻擋。
 * 6. 標準 GeoJSON 圖層輸出 (Leaflet Web Map Layer Feed)：
 *    - 單一資料來源供應所有地圖圖層，杜絕任何資料斷點。
 * 7. 雙軌模式適配器 (School vs Home Mode)：
 *    - 學校模式 (School Mode)：離線獨立開發，標準事件合約待命。
 *    - 家中模式 (Home Mode)：雙軌實時通訊，WebSocket / HTTP 事件雙向連動。
 *
 * 嚴守三大最高規範：
 * - 稱謂規範：全專案稱呼「都會調查員」或「市民」。
 * - 移動規範：嚴禁任何瞬移傳送，實體步行與大眾運輸物理位移。
 */

const { MapDetectiveEvents } = require('./EventContracts');
const { calculateDistanceMeters } = require('../utils/geoUtils');
const { BuildingSystem } = require('../world/BuildingSystem');

class MapPairingCoordinator {
  /**
   * @param {Object} storyLoader - 劇情動態資料載入器
   * @param {Object} caseManager - 案件全生命週期狀態機總控
   * @param {Object} investigator - 都會調查員模型
   * @param {Object} bridge - 雙向協同事件橋樑總線
   * @param {Object|null} buildingSystem - 建築進出系統 (可選，預設自動建構)
   */
  constructor(storyLoader, caseManager, investigator, bridge, buildingSystem = null) {
    this.loader = storyLoader;
    this.caseManager = caseManager;
    this.investigator = investigator;
    this.bridge = bridge;
    this.buildingSystem = buildingSystem || new BuildingSystem();

    // 學校 vs 家中模式狀態
    this.currentMode = 'home'; // 'home' (雙軌即時聯調) 或 'school' (學校地圖獨立模式)
    this.mainMapServerUrl = 'http://localhost:3000';

    // 案發搜查警戒圈配置 (10 大案件專屬半徑、中心座標、色系與捷運站對照)
    this.casePerimeters = {
      case_01: {
        caseId: 'case_01',
        title: '西門町連鎖咖啡店拿鐵中毒案',
        center: [25.0425, 121.5072],
        radiusMeters: 80,
        sector: '萬華特區 (西門商圈)',
        nearestMrt: 'BL11/G12 西門站 6 號出口',
        color: '#fb7185', // 警戒桃紅
        crimeTapeActive: true
      },
      case_02: {
        caseId: 'case_02',
        title: '台北車站三鐵連通長廊水力延時案',
        center: [25.0478, 121.5170],
        radiusMeters: 120,
        sector: '中正特區 (台北車站核心樞紐)',
        nearestMrt: 'R10/BL12 台北車站 M8 出口',
        color: '#38bdf8', // 科技藍
        crimeTapeActive: true
      },
      case_03: {
        caseId: 'case_03',
        title: '淡水海關碼頭跳舞小人航海磚案',
        center: [25.1724, 121.4371],
        radiusMeters: 150,
        sector: '淡水特區 (老街碼頭紅磚倉庫)',
        nearestMrt: 'R28 淡水站轉乘紅26公車',
        color: '#fbbf24', // 歷史琥珀金
        crimeTapeActive: true
      },
      case_04: {
        caseId: 'case_04',
        title: '北投溫泉老旅店空白遺書熱敏案',
        center: [25.1368, 121.5065],
        radiusMeters: 90,
        sector: '北投特區 (溫泉路歷史街區)',
        nearestMrt: 'R22A 新北投站步行 5 分鐘',
        color: '#34d399', // 溫泉翡翠綠
        crimeTapeActive: true
      },
      case_05: {
        caseId: 'case_05',
        title: '板橋林家花園秋分漏窗日影幾何案',
        center: [25.0112, 121.4548],
        radiusMeters: 110,
        sector: '板橋特區 (林本源園邸方鑑齋)',
        nearestMrt: 'BL06 府中站 1 號出口步行 8 分鐘',
        color: '#c084fc', // 紫羅蘭文藝紫
        crimeTapeActive: true
      },
      case_06: {
        caseId: 'case_06',
        title: '西門町超商冷藏櫃隱形指紋竊案',
        center: [25.0445, 121.5078],
        radiusMeters: 60,
        sector: '萬華特區 (漢中街徒步區超商)',
        nearestMrt: 'BL11/G12 西門站 6 號出口',
        color: '#f43f5e',
        crimeTapeActive: true
      },
      case_07: {
        caseId: 'case_07',
        title: '捷運板南線末班車急煞調包案',
        center: [25.0416, 121.5438],
        radiusMeters: 100,
        sector: '大安特區 (忠孝復興捷運站月台與車廂)',
        nearestMrt: 'BL15/BR10 忠孝復興站',
        color: '#0284c7',
        crimeTapeActive: true
      },
      case_08: {
        caseId: 'case_08',
        title: '大稻埕百年中藥鋪消失的人蔘',
        center: [25.0558, 121.5098],
        radiusMeters: 85,
        sector: '大同特區 (迪化街一段中藥行聚落)',
        nearestMrt: 'O12 大橋頭站 1 號出口步行 10 分鐘',
        color: '#d97706',
        crimeTapeActive: true
      },
      case_09: {
        caseId: 'case_09',
        title: '雙北 307 公車急煞皮夾調包案',
        center: [25.0519, 121.5478],
        radiusMeters: 130,
        sector: '松山特區 (南京復興站公車專用道)',
        nearestMrt: 'G16/BR11 南京復興站',
        color: '#10b981',
        crimeTapeActive: true
      },
      case_10: {
        caseId: 'case_10',
        title: '大安森林公園雨夜泥地無腳印案',
        center: [25.0305, 121.5358],
        radiusMeters: 140,
        sector: '大安特區 (生態水池周邊草坪)',
        nearestMrt: 'R06 大安森林公園站 2 號出口',
        color: '#06b6d4',
        crimeTapeActive: true
      }
    };
  }

  // ─── 1. 搜查警戒圈管理與派發 ───

  /**
   * 取得指定案件之搜查警戒圈設定
   * @param {string|null} caseId
   * @returns {Object} 警戒圈配置
   */
  getPerimeter(caseId = null) {
    const cId = caseId || this.investigator.activeCaseId || 'case_01';
    return this.casePerimeters[cId] || this.casePerimeters['case_01'];
  }

  /**
   * 主動向地圖系統派發搜查警戒圈事件 (Detective -> Map)
   * @param {string|null} caseId
   * @returns {Object} 派發內容
   */
  dispatchPerimeter(caseId = null) {
    const perimeter = this.getPerimeter(caseId);
    const payload = {
      caseId: perimeter.caseId,
      title: perimeter.title,
      center: perimeter.center,
      radiusMeters: perimeter.radiusMeters,
      sector: perimeter.sector,
      color: perimeter.color,
      nearestMrt: perimeter.nearestMrt,
      crimeTapeActive: perimeter.crimeTapeActive
    };

    this.bridge.dispatch(MapDetectiveEvents.DETECTIVE.PERIMETER_DISPATCHED, payload);
    this.bridge.dispatch(MapDetectiveEvents.DETECTIVE.CASE_ACCEPTED, {
      caseId: perimeter.caseId,
      title: perimeter.title,
      centerCoords: perimeter.center,
      radiusMeters: perimeter.radiusMeters,
      hints: `請前往【${perimeter.sector}】(${perimeter.nearestMrt}) 開展現場調查`
    });

    return {
      success: true,
      dispatched: payload
    };
  }

  // ─── 2. 涉案關係人與口供筆錄狀態雙向綁定 ───

  /**
   * 取得涉案關係人列表，並附帶筆錄對質進度狀態 (供地圖渲染關係人互動標記)
   * @param {string|null} caseId
   * @returns {Array<Object>} 關係人地圖資訊
   */
  getSuspectsWithDialogueState(caseId = null) {
    const cId = caseId || this.investigator.activeCaseId || 'case_01';
    const perimeter = this.getPerimeter(cId);
    const rawSuspects = this.loader.getSuspectsForCase(cId);

    return rawSuspects.map((s, idx) => {
      // 空間微偏移模擬關係人分佈在案發中心周圍 30~70 公尺之街區或店鋪
      const latOffset = (idx % 2 === 0 ? 1 : -1) * (0.00025 + idx * 0.00015);
      const lonOffset = (idx > 1 ? 1 : -1) * (0.00030 + idx * 0.00012);
      const coords = [
        Number((perimeter.center[0] + latOffset).toFixed(6)),
        Number((perimeter.center[1] + lonOffset).toFixed(6))
      ];
      const distFromInvestigator = calculateDistanceMeters(this.investigator.currentCoords, coords);

      return {
        id: s.id,
        name: s.name,
        role: s.role,
        occupation: s.occupation,
        locationName: s.location || '案發周邊街區',
        coords,
        distanceFromInvestigator: distFromInvestigator,
        canTalkRightNow: distFromInvestigator <= 60,
        dialogueAvailable: true,
        type: 'suspect'
      };
    });
  }

  /**
   * 地圖端與嫌疑人進行詰問或出示物證對質 (Map -> Detective 雙向綁定)
   * @param {string} sessionId - 對話階段識別碼
   * @param {string} suspectId - 嫌疑人代號
   * @param {number|null} optionIndex - 選擇之對話分支 (null 表示開啟對話)
   * @returns {Object} 對話或對質結果
   */
  syncSuspectInterrogationState(sessionId, suspectId, optionIndex = null) {
    let result;
    if (optionIndex === null || optionIndex === undefined) {
      result = this.caseManager.interrogateSuspect(sessionId, suspectId);
    } else {
      if (!this.caseManager.dialogueEngine.activeSessions.has(sessionId)) {
        this.caseManager.interrogateSuspect(sessionId, suspectId);
      }
      result = this.caseManager.dialogueEngine.selectOption(sessionId, optionIndex, this.investigator);
    }

    if (result.success) {
      const suspect = this.loader.getNpc(suspectId);
      this.bridge.dispatch(MapDetectiveEvents.DETECTIVE.SUSPECT_CONFRONTED, {
        sessionId,
        suspectId,
        suspectName: suspect ? suspect.name : suspectId,
        step: result.step,
        clueUnlocked: result.clueUnlocked || null,
        caseClosed: result.caseClosed || false,
        text: result.text || ''
      });
    }

    return result;
  }

  // ─── 3. 三軌道具親赴驗證對接 (門市 85 折、場館借用、生活圈彩蛋) ───

  /**
   * 取得地圖周邊合作特約門市清單（含即時距離與 85 折資格判定）
   * @param {number} radiusMeters
   * @returns {Array<Object>}
   */
  getNearbyStoresOnMap(radiusMeters = 850) {
    const stores = this.investigator.inventory.getAllStores(this.investigator.currentCoords);
    return stores.filter(s => s.distanceMeters === null || s.distanceMeters <= radiusMeters);
  }

  /**
   * 於地圖端觸發實體門市購買 (驗證距離 <= 60m 享 85 折)
   * @param {Object} itemDef - 道具定義
   * @param {string} storeId - 目標門市代號
   * @param {Object} options - 購買選項 (例如使用隨行杯)
   * @returns {Object} 購買結果
   */
  purchaseAtStoreFromMap(itemDef, storeId, options = {}) {
    const result = this.investigator.inventory.buyItem(
      itemDef,
      this.investigator.wallet,
      this.investigator,
      storeId,
      options
    );

    if (result.success) {
      this.bridge.dispatch(MapDetectiveEvents.DETECTIVE.STORE_PURCHASED, {
        item: result.item,
        costPaid: result.costPaid,
        balance: result.balance,
        storeName: result.targetStoreName,
        distanceMeters: result.distanceMeters
      });
    }

    return result;
  }

  /**
   * 取得雙北 4 大科普微型學習場館（含即時距離與免費借用資格判定）
   * @returns {Array<Object>}
   */
  getVenuesOnMap() {
    return this.investigator.inventory.getAllVenues(this.investigator.currentCoords);
  }

  /**
   * 於地圖端觸發科普場館借用 (驗證距離 <= 60m 完成微任務)
   * @param {Object} toolDef - 儀器定義
   * @param {string} venueId - 目標場館代號
   * @returns {Object} 借用結果
   */
  borrowFromVenueFromMap(toolDef, venueId) {
    const result = this.investigator.inventory.borrowToolFromVenue(
      toolDef,
      venueId,
      this.investigator
    );

    if (result.success) {
      this.bridge.dispatch(MapDetectiveEvents.DETECTIVE.VENUE_BORROWED, {
        tool: result.tool,
        venueName: result.targetVenueName,
        distanceMeters: result.distanceMeters
      });
    }

    return result;
  }

  /**
   * 取得案發生活圈 50~100m 彩蛋探索熱區規格
   * @param {string|null} caseId
   * @returns {Object} 彩蛋圈幾何規格
   */
  getEasterEggZoneOnMap(caseId = null) {
    const perimeter = this.getPerimeter(caseId);
    const distToCenter = calculateDistanceMeters(this.investigator.currentCoords, perimeter.center);
    const isInsideEggZone = distToCenter >= 50 && distToCenter <= 100;

    return {
      caseId: perimeter.caseId,
      center: perimeter.center,
      minRadiusMeters: 50,
      maxRadiusMeters: 100,
      color: '#f59e0b', // 琥珀探索金
      distanceToCenterMeters: distToCenter,
      isInsideEggZone,
      hintText: isInsideEggZone
        ? '🔍 已親赴抵達案發現場周圍 50~100m 生活圈巷弄，有微量隱藏彩蛋跡象可供拾獲！'
        : (distToCenter < 50
            ? '⚠️ 當前過於接近核心封鎖區 (< 50m)，彩蛋藏於外環巷弄生活圈。'
            : '⚠️ 距案發中心過遠 (> 100m)，請親自返回生活圈街區。')
    };
  }

  /**
   * 於地圖端觸發彩蛋拾獲 (驗證距離 50~100m 巷弄生活圈)
   * @param {Object} eggItem - 彩蛋道具定義
   * @param {string|null} caseId - 案件代號
   * @returns {Object} 拾獲結果
   */
  pickEasterEggFromMap(eggItem, caseId = null) {
    const perimeter = this.getPerimeter(caseId);
    const result = this.investigator.inventory.pickEasterEgg(
      eggItem,
      perimeter.center,
      this.investigator
    );

    if (result.success) {
      this.bridge.dispatch(MapDetectiveEvents.DETECTIVE.EASTER_EGG_FOUND, {
        item: result.item,
        caseId: perimeter.caseId,
        distanceMeters: result.distanceMeters
      });
    }

    return result;
  }

  // ─── 4. 建築進出標記系統對接 (企劃書 02.2) ───

  /**
   * 取得地圖周遭建築標記清單 (可進顯示圖案 🏪/☕/🌿/🏛️/🚪/♨️，不可進無圖案作為街景碰撞)
   * @param {number} radiusMeters
   * @returns {Array<Object>}
   */
  getBuildingMarkersOnMap(radiusMeters = 850) {
    return this.buildingSystem.getNearbyBuildings(this.investigator.currentCoords, radiusMeters);
  }

  /**
   * 於地圖端進入建築物大門 (靠近大門 <= 25m 切換精緻室內)
   * @param {string} buildingId - 建築代號
   * @returns {Object} 進入結果
   */
  enterBuildingFromMap(buildingId) {
    const result = this.buildingSystem.enterBuilding(buildingId, this.investigator.currentCoords);
    if (result.success) {
      this.bridge.dispatch(MapDetectiveEvents.MAP.STORE_ENTERED, {
        storeId: buildingId,
        buildingId,
        name: result.buildingName
      });
      this.bridge.dispatch(MapDetectiveEvents.DETECTIVE.BUILDING_ENTERED, {
        buildingId,
        buildingName: result.buildingName,
        icon: result.icon,
        interiorTemplate: result.interiorTemplate
      });
    }
    return result;
  }

  /**
   * 於地圖端走出建築物回到室外街道
   * @returns {Object} 退出結果
   */
  exitBuildingFromMap() {
    const result = this.buildingSystem.exitBuilding();
    if (result.success) {
      this.bridge.dispatch(MapDetectiveEvents.MAP.STORE_EXITED, result);
      this.bridge.dispatch(MapDetectiveEvents.DETECTIVE.BUILDING_EXITED, result);
    }
    return result;
  }

  // ─── 5. 地圖圖層導出 (GeoJSON FeatureCollection) ───

  /**
   * 取得指定案件或當前活躍案件的地圖圖層規範 (Overlays)
   * @param {string|null} targetCaseId
   * @returns {Object}
   */
  getCaseMapOverlays(targetCaseId = null) {
    const caseId = targetCaseId || this.investigator.activeCaseId || 'case_01';
    const perimeter = this.getPerimeter(caseId);
    const caseDef = this.loader.getCase(caseId);

    // 涉案關係人點位 (含口供狀態)
    const suspects = this.getSuspectsWithDialogueState(caseId);

    // 關鍵物證點位
    const evidenceMarkers = ((caseDef && caseDef.evidenceChain) || []).map((e, idx) => {
      const latOffset = (idx % 2 === 0 ? -1 : 1) * (0.00018 + idx * 0.00010);
      const lonOffset = (idx > 1 ? -1 : 1) * (0.00020 + idx * 0.00015);
      const coords = [
        Number((perimeter.center[0] + latOffset).toFixed(6)),
        Number((perimeter.center[1] + lonOffset).toFixed(6))
      ];
      return {
        id: e.id,
        name: e.name,
        scienceTool: e.scienceCheck ? e.scienceCheck.tool : null,
        coords,
        distanceFromInvestigator: calculateDistanceMeters(this.investigator.currentCoords, coords),
        type: 'evidence'
      };
    });

    // 實體合作門市
    const stores = this.getNearbyStoresOnMap(850);

    // 科普學習場館
    const venues = this.getVenuesOnMap();

    // 生活圈彩蛋熱區
    const eggZone = this.getEasterEggZoneOnMap(caseId);

    // 實體建築物
    const buildings = this.getBuildingMarkersOnMap(850);

    // 計算調查員與案發中心距離
    const distToPerimeterCenter = calculateDistanceMeters(
      this.investigator.currentCoords,
      perimeter.center
    );
    const isInsidePerimeter = distToPerimeterCenter <= perimeter.radiusMeters;

    return {
      success: true,
      caseId,
      perimeter,
      suspects,
      evidenceMarkers,
      stores,
      venues,
      eggZone,
      buildings,
      investigatorLocation: {
        coords: this.investigator.currentCoords,
        locationName: this.investigator.currentLocationName,
        distanceToCrimeSceneMeters: distToPerimeterCenter,
        isInsidePerimeter,
        stamina: this.investigator.stamina,
        walletBalance: this.investigator.wallet.easyCardBalance,
        tpassActive: this.investigator.wallet.hasTpass1200,
        insideBuilding: this.buildingSystem.getCurrentInsideBuilding()
      },
      pairingMode: this.currentMode,
      mainMapServerUrl: this.mainMapServerUrl
    };
  }

  /**
   * 輔助函式：根據圓心與半徑生成 32 點圓形多邊形 (Leaflet Polygon GeoJSON)
   * @param {number[]} center - [lat, lon]
   * @param {number} radiusMeters - 半徑 (公尺)
   * @returns {number[][][]} GeoJSON Coordinates
   */
  _generateCirclePolygonCoords(center, radiusMeters) {
    const coords = [];
    const points = 32;
    const [lat, lon] = center;
    for (let i = 0; i <= points; i++) {
      const angle = (i * 2 * Math.PI) / points;
      const dLat = (radiusMeters / 111320) * Math.cos(angle);
      const dLon = (radiusMeters / (111320 * Math.cos(lat * Math.PI / 180))) * Math.sin(angle);
      coords.push([
        Number((lon + dLon).toFixed(6)),
        Number((lat + dLat).toFixed(6))
      ]);
    }
    return [coords];
  }

  /**
   * 輸出標準 GeoJSON FeatureCollection 供 Leaflet 地圖無縫單點加載
   * @param {string|null} caseId
   * @returns {Object} FeatureCollection
   */
  exportGeoJson(caseId = null) {
    const overlays = this.getCaseMapOverlays(caseId);
    const features = [];

    // 1. 案發警戒圈中心點
    features.push({
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [overlays.perimeter.center[1], overlays.perimeter.center[0]]
      },
      properties: {
        type: 'crime_scene_center',
        title: overlays.perimeter.title,
        sector: overlays.perimeter.sector,
        radiusMeters: overlays.perimeter.radiusMeters,
        color: overlays.perimeter.color,
        nearestMrt: overlays.perimeter.nearestMrt
      }
    });

    // 2. 案發警戒圈幾何多邊形 (Circle Polygon)
    features.push({
      type: 'Feature',
      geometry: {
        type: 'Polygon',
        coordinates: this._generateCirclePolygonCoords(overlays.perimeter.center, overlays.perimeter.radiusMeters)
      },
      properties: {
        type: 'crime_scene_perimeter_polygon',
        caseId: overlays.caseId,
        color: overlays.perimeter.color,
        radiusMeters: overlays.perimeter.radiusMeters
      }
    });

    // 3. 50~100m 生活圈彩蛋探索外環熱區多邊形
    features.push({
      type: 'Feature',
      geometry: {
        type: 'Polygon',
        coordinates: this._generateCirclePolygonCoords(overlays.perimeter.center, 100)
      },
      properties: {
        type: 'easter_egg_zone_outer',
        color: '#f59e0b',
        radiusMeters: 100,
        hint: '案發 50~100m 巷弄生活圈彩蛋探索熱區'
      }
    });

    // 4. 關係人點位 (含口供狀態)
    overlays.suspects.forEach(s => {
      features.push({
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [s.coords[1], s.coords[0]]
        },
        properties: {
          type: 'suspect',
          id: s.id,
          name: s.name,
          role: s.role,
          occupation: s.occupation,
          locationName: s.locationName,
          canTalkRightNow: s.canTalkRightNow
        }
      });
    });

    // 5. 物證點位
    overlays.evidenceMarkers.forEach(e => {
      features.push({
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [e.coords[1], e.coords[0]]
        },
        properties: {
          type: 'evidence',
          id: e.id,
          name: e.name,
          tool: e.scienceTool
        }
      });
    });

    // 6. 合作特約門市 (85 折)
    overlays.stores.forEach(st => {
      features.push({
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [st.coords[1], st.coords[0]]
        },
        properties: {
          type: 'partner_store',
          id: st.id,
          name: st.name,
          discountRate: st.discountRate,
          canPurchase: st.canPurchase
        }
      });
    });

    // 7. 科普教育場館 (免費微借用)
    overlays.venues.forEach(vn => {
      features.push({
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [vn.coords[1], vn.coords[0]]
        },
        properties: {
          type: 'science_venue',
          id: vn.id,
          name: vn.name,
          canBorrow: vn.canBorrow
        }
      });
    });

    // 8. 建築物標記 (可進有圖案，不可進無圖案)
    overlays.buildings.forEach(b => {
      features.push({
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [b.coords[1], b.coords[0]]
        },
        properties: {
          type: 'building',
          id: b.id,
          name: b.name,
          category: b.category,
          isEnterable: b.isEnterable,
          icon: b.icon,
          canEnterRightNow: b.canEnterRightNow
        }
      });
    });

    // 9. 調查員當前實體位置
    features.push({
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [
          this.investigator.currentCoords[1],
          this.investigator.currentCoords[0]
        ]
      },
      properties: {
        type: 'investigator',
        name: this.investigator.name,
        roleTitle: this.investigator.roleTitle,
        stamina: this.investigator.stamina,
        walletBalance: this.investigator.wallet.easyCardBalance,
        tpassActive: this.investigator.wallet.hasTpass1200
      }
    });

    return {
      type: 'FeatureCollection',
      caseId: overlays.caseId,
      features
    };
  }

  // ─── 6. 地圖雙向位置同步與防瞬移審查 ───

  /**
   * 接收來自地圖的調查員位置更新 (Map -> Detective)
   * 自動進行距離感測、警戒圈判定、體力消耗與防瞬移審查
   * @param {number[]} targetCoords - [lat, lon]
   * @param {string} locationName - 街區名稱
   * @param {boolean} isWalk - 是否為實體步行
   * @returns {Object}
   */
  syncLocationFromMap(targetCoords, locationName = '雙北街區', isWalk = true) {
    if (!targetCoords || targetCoords.length < 2) {
      return { success: false, error: '座標參數不正確。' };
    }

    const distMeters = calculateDistanceMeters(this.investigator.currentCoords, targetCoords);

    // 防瞬移最高禁忌檢驗：若單次實體步行跳動距離超過 2,500 公尺且非搭車，判定為疑似瞬移
    if (isWalk && distMeters > 2500) {
      return {
        success: false,
        isForbidden: true,
        error: `🈲 憲法級最高禁忌：單次位移達 ${distMeters}m，都會調查員嚴禁瞬移！請選擇搭乘捷運或公車。`
      };
    }

    let moveResult;
    if (isWalk) {
      moveResult = this.investigator.walkTo(targetCoords, locationName);
      if (!moveResult.success) {
        return moveResult;
      }
    } else {
      this.investigator.currentCoords = targetCoords;
      this.investigator.currentLocationName = locationName;
    }

    // 感測是否進入當前活躍案件的警戒圈
    const activeCaseId = this.investigator.activeCaseId || 'case_01';
    const perimeter = this.getPerimeter(activeCaseId);
    let enteredCrimeScene = false;

    if (perimeter) {
      const distToCrime = calculateDistanceMeters(targetCoords, perimeter.center);
      if (distToCrime <= perimeter.radiusMeters) {
        enteredCrimeScene = true;
      }
    }

    // 分發地圖協同事件
    this.bridge.dispatch(MapDetectiveEvents.MAP.PLAYER_MOVED, {
      lat: targetCoords[0],
      lon: targetCoords[1],
      locationName,
      distanceMovedMeters: distMeters,
      enteredCrimeScene
    });

    return {
      success: true,
      coords: this.investigator.currentCoords,
      locationName: this.investigator.currentLocationName,
      stamina: this.investigator.stamina,
      distanceMovedMeters: distMeters,
      enteredCrimeScene,
      message: enteredCrimeScene
        ? `🚨 調查員已進入【${perimeter.title}】搜查警戒圈 (${perimeter.radiusMeters}m 範圍)，解鎖現場鑑識！`
        : `📍 地圖定位已同步至【${locationName}】(距案發現場 ${calculateDistanceMeters(targetCoords, perimeter ? perimeter.center : targetCoords)}m)`
    };
  }

  /**
   * 切換「學校模式」與「家中模式」
   * @param {'school'|'home'} mode
   * @returns {Object}
   */
  setPairingMode(mode) {
    if (mode === 'school' || mode === 'home') {
      this.currentMode = mode;
      return {
        success: true,
        mode: this.currentMode,
        description: mode === 'school'
          ? '🏫 學校地圖獨立模式生效：地圖端獨立開發，偵探核心保持標準事件合約待命。'
          : '🏠 家中雙軌聯調模式生效：地圖 (Port 3000) 與偵探核心 (Port 3001) 即時雙向事件通訊！'
      };
    }
    return { success: false, error: '模式僅支援 school 或 home' };
  }
}

module.exports = {
  MapPairingCoordinator
};
