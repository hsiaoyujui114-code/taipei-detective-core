/**
 * ============================================================================
 * MAP PAIRING COORDINATOR (地圖協同調度器)
 * ============================================================================
 * 專為《雙北漫遊：都會行蹤》偵探系統與地圖系統聯動設計的專屬協同模組。
 *
 * 核心功能：
 * 1. 案件搜查警戒圈管理 (Crime Scene Perimeter)：
 *    - 為 10 大示範案件生成 GPS 中心點、半徑 (50~150m)、顏色與警示光圈規範。
 * 2. 空間定位與案發距離感測 (Geospatial Proximity Tracking)：
 *    - 接收地圖回傳的調查員經緯度，實時演算距離、步程、體力扣減與是否進入現場。
 * 3. 現場物證與關係人地圖標記 (Map POI & Suspect Markers)：
 *    - 輸出標準 GeoJSON 格式，供 Leaflet / Canvas 地圖無縫渲染標記。
 * 4. 大眾運輸導航與 TPASS 扣款協同 (Transit Routing & Fare Sync)：
 *    - 串接捷運與公車路網，估算搭乘時間與站點轉乘。
 * 5. 學校模式 vs 家中模式智慧適配 (School/Home Mode Adapter)：
 *    - 學校模式 (School Mode)：地圖獨立維護，支援離線契約模擬，不卡死開發。
 *    - 家中模式 (Home Mode)：雙軌即時聯調，WebSocket/HTTP 雙向推播事件。
 *
 * 嚴守三大最高規範：
 * - 稱謂規範：全專案稱呼「都會調查員」或「市民」。
 * - 移動規範：嚴禁任何瞬移傳送，實體步行與大眾運輸物理位移。
 */

const { MapDetectiveEvents } = require('./EventContracts');
const { calculateDistanceMeters } = require('../player/Investigator');

class MapPairingCoordinator {
  constructor(storyLoader, caseManager, investigator, bridge) {
    this.loader = storyLoader;
    this.caseManager = caseManager;
    this.investigator = investigator;
    this.bridge = bridge;

    // 學校 vs 家中模式狀態
    this.currentMode = 'home'; // 'home' (雙軌即時聯調) 或 'school' (學校地圖獨立模式)
    this.mainMapServerUrl = 'http://localhost:3000';

    // 案發搜查警戒圈配置 (10 大案件專屬半徑與中心座標)
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

  /**
   * 取得指定案件或當前活躍案件的地圖圖層規範 (Overlays)
   */
  getCaseMapOverlays(targetCaseId = null) {
    const caseId = targetCaseId || this.investigator.activeCaseId || 'case_01';
    const perimeter = this.casePerimeters[caseId] || this.casePerimeters['case_01'];
    const caseDef = this.loader.getCase(caseId);

    // 涉案關係人地圖點位
    const suspects = this.loader.getSuspectsForCase(caseId).map((s, idx) => {
      // 依據案件中心座標略微偏移 (模擬關係人分佈在周遭 30~70 公尺門市或攤位)
      const latOffset = (idx % 2 === 0 ? 1 : -1) * (0.00025 + idx * 0.00015);
      const lonOffset = (idx > 1 ? 1 : -1) * (0.00030 + idx * 0.00012);
      return {
        id: s.id,
        name: s.name,
        role: s.role,
        occupation: s.occupation,
        locationName: s.location || '案發周邊街區',
        coords: [
          Number((perimeter.center[0] + latOffset).toFixed(6)),
          Number((perimeter.center[1] + lonOffset).toFixed(6))
        ],
        type: 'suspect'
      };
    });

    // 關鍵物證與彩蛋點位
    const evidenceMarkers = ((caseDef && caseDef.evidenceChain) || []).map((e, idx) => {
      const latOffset = (idx % 2 === 0 ? -1 : 1) * (0.00018 + idx * 0.00010);
      const lonOffset = (idx > 1 ? -1 : 1) * (0.00020 + idx * 0.00015);
      return {
        id: e.id,
        name: e.name,
        scienceTool: e.scienceCheck ? e.scienceCheck.tool : null,
        coords: [
          Number((perimeter.center[0] + latOffset).toFixed(6)),
          Number((perimeter.center[1] + lonOffset).toFixed(6))
        ],
        type: 'evidence'
      };
    });

    // 計算當前調查員與案發中心的實體距離
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
      investigatorLocation: {
        coords: this.investigator.currentCoords,
        locationName: this.investigator.currentLocationName,
        distanceToCrimeSceneMeters: distToPerimeterCenter,
        isInsidePerimeter,
        stamina: this.investigator.stamina,
        walletBalance: this.investigator.wallet.easyCardBalance,
        tpassActive: this.investigator.wallet.hasTpass1200
      },
      pairingMode: this.currentMode,
      mainMapServerUrl: this.mainMapServerUrl
    };
  }

  /**
   * 輸出標準 GeoJSON FeatureCollection 供地圖系統即時渲染
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

    // 2. 關係人點位
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
          locationName: s.locationName
        }
      });
    });

    // 3. 物證點位
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

    // 4. 調查員當前實體位置
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
        stamina: this.investigator.stamina
      }
    });

    return {
      type: 'FeatureCollection',
      caseId: overlays.caseId,
      features
    };
  }

  /**
   * 接收來自地圖的調查員位置更新 (Map -> Detective)
   * 自動進行距離感測、警戒圈判定、體力消耗、防瞬移審查
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
    const perimeter = this.casePerimeters[activeCaseId];
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
