/**
 * ============================================================================
 * TAIPEI DETECTIVE CORE SERVER (都會調查員偵探核心伺服器)
 * ============================================================================
 * 支援以 node server.js 啟動 (預設 Port 3001，避免與主地圖 Port 3000 衝突)，
 * 同時導出 handleDetectiveRequest 函式，供主地圖伺服器無縫引入達成 100% 雙向零斷點對接。
 *
 * 嚴守三大最高憲法級規範：
 * 1. 稱謂規範：全專案全面使用「都會調查員」(Investigator) 或「市民」。
 * 2. 姓名規範：永久嚴禁任何違規舊稱。
 * 3. 職稱規範：嚴禁任何歷史廢除職稱。
 * 4. 移動規範：嚴禁瞬移，瞬移 API 永遠回傳 403 禁令攔截！
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const { createDetectiveEngine } = require('./src/index');

const PORT = process.env.DETECTIVE_PORT || 3001;
const defaultEngine = createDetectiveEngine();

/**
 * 輔助函式：發送標準 JSON 回應
 * @param {http.ServerResponse} res
 * @param {number} statusCode
 * @param {Object} data
 */
function sendJson(res, statusCode, data) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  });
  res.end(JSON.stringify(data));
}

/**
 * 輔助函式：解析 HTTP 請求內容 (JSON Body)
 * @param {http.IncomingMessage} req
 * @returns {Promise<Object>}
 */
function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (err) {
        resolve({});
      }
    });
    req.on('error', reject);
  });
}

/**
 * 偵探核心統一 REST API 請求分發處理器 (可供自身伺服器或主地圖伺服器直接掛載)
 * @param {http.IncomingMessage} req
 * @param {http.ServerResponse} res
 * @param {Object|null} customEngine
 * @returns {Promise<boolean>} 是否成功處理該請求
 */
async function handleDetectiveRequest(req, res, customEngine = null) {
  const engine = customEngine || defaultEngine;
  const urlObj = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const pathname = urlObj.pathname;

  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    });
    res.end();
    return true;
  }

  // ─── 0. 都會調查員偵探工作台 Web 介面 (HTML) ───
  if (pathname === '/detective' || pathname === '/detective/' || pathname === '/workbench') {
    const detectiveHtml = path.join(__dirname, 'public/index.html');
    if (fs.existsSync(detectiveHtml)) {
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      fs.createReadStream(detectiveHtml).pipe(res);
      return true;
    }
  }

  // ─── 0.1 50 宗歷史風情與生活科學案件全集展示 (HTML) ───
  if (pathname === '/cases' || pathname === '/cases/' || pathname === '/cases.html') {
    const casesHtml = path.join(__dirname, 'public/cases.html');
    if (fs.existsSync(casesHtml)) {
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      fs.createReadStream(casesHtml).pipe(res);
      return true;
    }
  }

  // ─── 1. 調查員狀態與設定 API ───

  if (pathname === '/api/detective/status' && req.method === 'GET') {
    sendJson(res, 200, {
      success: true,
      investigator: engine.investigator.getStatus(),
      inventory: engine.investigator.inventory.listAll(),
      activeCase: engine.caseManager.getActiveCaseState(),
      souvenirs: engine.investigator.roomSouvenirs,
      safeViewingMosaic: engine.deductionBoard.safeViewingMosaic,
      sectorsTrust: engine.trustSystem.getAllSectorStatus(),
      insideBuilding: engine.buildingSystem.getCurrentInsideBuilding()
    });
    return true;
  }

  if (pathname === '/api/detective/settings/safe-viewing' && req.method === 'POST') {
    const body = await parseBody(req);
    const result = engine.deductionBoard.setSafeViewingMosaic(body.enabled !== false);
    engine.bridge.dispatch(engine.events.DETECTIVE.SAFE_VIEWING_TOGGLED, result);
    sendJson(res, 200, { success: true, ...result });
    return true;
  }

  if (pathname === '/api/detective/wardrobe/outfit' && req.method === 'POST') {
    const body = await parseBody(req);
    const result = engine.investigator.changeOutfit(body.outfitName);
    sendJson(res, result.success ? 200 : 400, result);
    return true;
  }

  // ─── 2. 案件生命週期 API ───

  if ((pathname === '/api/detective/cases/fifty' || pathname === '/api/detective/fifty-cases') && req.method === 'GET') {
    sendJson(res, 200, {
      success: true,
      total: engine.loader.listFiftyCases().length,
      cases: engine.loader.listFiftyCases()
    });
    return true;
  }

  if (pathname === '/api/detective/cases' && req.method === 'GET') {
    const isFifty = urlObj.searchParams.get('mode') === 'fifty' || urlObj.searchParams.get('all') === 'true';
    sendJson(res, 200, {
      success: true,
      mode: isFifty ? 'fifty' : 'demo',
      totalDemo: engine.loader.listCases().length,
      totalFifty: engine.loader.listFiftyCases().length,
      cases: isFifty ? engine.loader.listFiftyCases() : engine.loader.listCases()
    });
    return true;
  }

  if (pathname.startsWith('/api/detective/case/') && req.method === 'GET') {
    const caseId = pathname.replace('/api/detective/case/', '');
    if (caseId === 'fifty') {
      sendJson(res, 200, {
        success: true,
        total: engine.loader.listFiftyCases().length,
        cases: engine.loader.listFiftyCases()
      });
      return true;
    }
    const caseDetail = engine.loader.getCase(caseId);
    if (!caseDetail) {
      sendJson(res, 404, { error: `找不到案件 [${caseId}]` });
      return true;
    }
    sendJson(res, 200, {
      success: true,
      case: caseDetail,
      suspects: engine.loader.getSuspectsForCase(caseId)
    });
    return true;
  }

  if (pathname === '/api/detective/case/accept' && req.method === 'POST') {
    const body = await parseBody(req);
    if (!body.caseId) {
      sendJson(res, 400, { error: '缺少 caseId 參數' });
      return true;
    }
    const result = engine.caseManager.acceptCase(body.caseId, engine.investigator);
    if (result.success) {
      engine.mapCoordinator.dispatchPerimeter(body.caseId);
    }
    sendJson(res, result.success ? 200 : 400, result);
    return true;
  }

  // ─── 3. 生活科學鑑識與 NPC 筆錄對質 API ───

  if (pathname === '/api/detective/evidence/examine' && req.method === 'POST') {
    const body = await parseBody(req);
    if (!body.evidenceId || !body.toolId) {
      sendJson(res, 400, { error: '缺少 evidenceId 或 toolId' });
      return true;
    }
    const result = engine.caseManager.examineEvidence(body.evidenceId, body.toolId, engine.investigator);
    sendJson(res, result.success ? 200 : 400, result);
    return true;
  }

  if (pathname === '/api/detective/dialogue/start' && req.method === 'POST') {
    const body = await parseBody(req);
    if (!body.suspectId) {
      sendJson(res, 400, { error: '缺少 suspectId' });
      return true;
    }
    const result = engine.mapCoordinator.syncSuspectInterrogationState(
      body.sessionId || 'session_web',
      body.suspectId,
      null
    );
    sendJson(res, result.success ? 200 : 400, result);
    return true;
  }

  if (pathname === '/api/detective/dialogue/select' && req.method === 'POST') {
    const body = await parseBody(req);
    if (body.optionIndex === undefined) {
      sendJson(res, 400, { error: '缺少 optionIndex' });
      return true;
    }
    const result = engine.mapCoordinator.syncSuspectInterrogationState(
      body.sessionId || 'session_web',
      body.suspectId || 'active_suspect',
      body.optionIndex
    );
    sendJson(res, result.success ? 200 : 400, result);
    return true;
  }

  if (pathname === '/api/detective/suspects/dialogue-state' && req.method === 'GET') {
    const caseId = urlObj.searchParams.get('caseId');
    sendJson(res, 200, {
      success: true,
      suspects: engine.mapCoordinator.getSuspectsWithDialogueState(caseId)
    });
    return true;
  }

  // ─── 4. 思維推理板與冷案檔案庫 API ───

  if (pathname === '/api/detective/deduction/solve' && req.method === 'POST') {
    const body = await parseBody(req);
    const result = engine.caseManager.resolveCase(
      body.caseId, body.suspectId, body.evidenceIds || [], engine.investigator
    );
    sendJson(res, result.success ? 200 : 400, result);
    return true;
  }

  if (pathname === '/api/detective/deduction/cold-case' && req.method === 'POST') {
    const body = await parseBody(req);
    const result = engine.caseManager.archiveColdCase(body.caseId, body.reason, engine.investigator);
    sendJson(res, result.success ? 200 : 400, result);
    return true;
  }

  if (pathname === '/api/detective/deduction/cold-cases' && req.method === 'GET') {
    sendJson(res, 200, {
      success: true,
      coldCases: engine.deductionBoard.listColdCases()
    });
    return true;
  }

  // ─── 5. 移動系統與三大禁忌攔截 (實體步行 ✕ 大眾運輸 ✕ 嚴禁瞬移) ───

  if (pathname === '/api/detective/move/walk' && req.method === 'POST') {
    const body = await parseBody(req);
    if (!body.coords) {
      sendJson(res, 400, { error: '缺少目標座標' });
      return true;
    }
    const result = engine.investigator.walkTo(body.coords, body.locationName || '未知街區');
    if (result.success) {
      engine.bridge.dispatch(engine.events.MAP.PLAYER_MOVED, {
        lat: body.coords[0],
        lon: body.coords[1],
        sectorName: body.locationName
      });
    }
    sendJson(res, result.success ? 200 : 400, result);
    return true;
  }

  if (pathname === '/api/detective/move/transit' && req.method === 'POST') {
    const body = await parseBody(req);
    if (!body.coords || !body.stationName) {
      sendJson(res, 400, { error: '缺少座標或站點名稱' });
      return true;
    }
    const result = engine.investigator.transitTo(body.coords, body.stationName, body.transportType || 'mrt');
    if (result.success) {
      engine.bridge.dispatch(engine.events.MAP.STATION_ARRIVED, {
        stationName: body.stationName,
        transportType: body.transportType || 'mrt'
      });
    }
    sendJson(res, result.success ? 200 : 400, result);
    return true;
  }

  if (pathname === '/api/detective/move/teleport' && req.method === 'POST') {
    // 嚴格攔截瞬移請求！
    sendJson(res, 403, {
      success: false,
      isForbidden: true,
      error: '🈲 憲法級最高禁忌：都會調查員嚴禁瞬移！雙北真實空間嚴禁點圖直接瞬移，請選擇步行或搭乘大眾運輸。'
    });
    return true;
  }

  // ─── 6. 道具三軌親赴現場驗證 API (Round 100 規格) ───

  if (pathname === '/api/detective/inventory/buy' && req.method === 'POST') {
    const body = await parseBody(req);
    const result = engine.mapCoordinator.purchaseAtStoreFromMap(
      body.item,
      body.storeId || body.storeTarget || null,
      {
        isPhysicalStore: body.isPhysicalStore !== false,
        useTumbler: body.useTumbler === true
      }
    );
    sendJson(res, result.success ? 200 : 400, result);
    return true;
  }

  if (pathname === '/api/detective/stores' && req.method === 'GET') {
    const radiusParam = urlObj.searchParams.get('radius');
    const radius = radiusParam !== null ? Number(radiusParam) : 850;
    const stores = radius > 0
      ? engine.mapCoordinator.getNearbyStoresOnMap(radius)
      : engine.investigator.inventory.getAllStores(engine.investigator.currentCoords);
    sendJson(res, 200, {
      success: true,
      stores
    });
    return true;
  }

  if (pathname === '/api/detective/inventory/borrow' && req.method === 'POST') {
    const body = await parseBody(req);
    const result = engine.mapCoordinator.borrowFromVenueFromMap(
      body.tool,
      body.venueName || body.venueId || null
    );
    sendJson(res, result.success ? 200 : 400, result);
    return true;
  }

  if (pathname === '/api/detective/venues' && req.method === 'GET') {
    sendJson(res, 200, {
      success: true,
      venues: engine.mapCoordinator.getVenuesOnMap()
    });
    return true;
  }

  if (pathname === '/api/detective/inventory/egg' && req.method === 'POST') {
    const body = await parseBody(req);
    const result = engine.mapCoordinator.pickEasterEggFromMap(
      body.item,
      body.caseId || null
    );
    sendJson(res, result.success ? 200 : 400, result);
    return true;
  }

  if (pathname === '/api/detective/egg-zone' && req.method === 'GET') {
    const caseId = urlObj.searchParams.get('caseId');
    sendJson(res, 200, {
      success: true,
      zone: engine.mapCoordinator.getEasterEggZoneOnMap(caseId)
    });
    return true;
  }

  if (pathname === '/api/detective/wallet/eco-action' && req.method === 'POST') {
    const body = await parseBody(req);
    const result = engine.investigator.wallet.awardEcoAction(body.actionType);
    sendJson(res, 200, { success: true, ...result });
    return true;
  }

  if (pathname === '/api/detective/wallet/top-up' && req.method === 'POST') {
    const body = await parseBody(req);
    const result = engine.investigator.wallet.topUp(Number(body.amount) || 100);
    sendJson(res, result.success ? 200 : 400, result);
    return true;
  }

  // ─── 7. 建築進出標記系統 API (企劃書 02.2 核心規格) ───

  if (pathname === '/api/detective/buildings/nearby' && req.method === 'GET') {
    const radius = Number(urlObj.searchParams.get('radius')) || 850;
    const buildings = engine.mapCoordinator.getBuildingMarkersOnMap(radius);
    sendJson(res, 200, { success: true, radius, buildings });
    return true;
  }

  if (pathname === '/api/detective/buildings/geojson' && req.method === 'GET') {
    const radius = Number(urlObj.searchParams.get('radius')) || 850;
    sendJson(res, 200, engine.buildingSystem.exportBuildingGeoJson(engine.investigator.currentCoords, radius));
    return true;
  }

  if (pathname === '/api/detective/building/enter' && req.method === 'POST') {
    const body = await parseBody(req);
    const result = engine.mapCoordinator.enterBuildingFromMap(body.buildingId);
    sendJson(res, result.success ? 200 : 400, result);
    return true;
  }

  if (pathname === '/api/detective/building/exit' && req.method === 'POST') {
    const result = engine.mapCoordinator.exitBuildingFromMap();
    sendJson(res, result.success ? 200 : 400, result);
    return true;
  }

  // ─── 8. 108 課綱自然科學實驗演算 API ───

  if (pathname === '/api/detective/science/ph' && req.method === 'POST') {
    const body = await parseBody(req);
    sendJson(res, 200, engine.evidenceEngine.runPhTitration(Number(body.pH) || 7));
    return true;
  }

  if (pathname === '/api/detective/science/density' && req.method === 'POST') {
    const body = await parseBody(req);
    sendJson(res, 200, engine.evidenceEngine.runArchimedesDensity(
      Number(body.massGrams) || 50, Number(body.volumeMl) || 7.5
    ));
    return true;
  }

  if (pathname === '/api/detective/science/pressure' && req.method === 'POST') {
    const body = await parseBody(req);
    sendJson(res, 200, engine.evidenceEngine.runPressureCalculation(
      Number(body.massKg) || 70, Number(body.areaCm2) || 400
    ));
    return true;
  }

  if (pathname === '/api/detective/science/acoustic' && req.method === 'POST') {
    const body = await parseBody(req);
    sendJson(res, 200, engine.evidenceEngine.runAcousticDelayCalculation(
      Number(body.distanceMeters) || 300, Number(body.temperatureC) || 20
    ));
    return true;
  }

  // ─── 9. 地圖協同調度與地理圖層 API (Map Pairing & Geo Overlays) ───

  if (pathname === '/api/detective/map/pairing-status' && req.method === 'GET') {
    const caseId = urlObj.searchParams.get('caseId');
    sendJson(res, 200, engine.mapCoordinator.getCaseMapOverlays(caseId));
    return true;
  }

  if (pathname === '/api/detective/map/geojson' && req.method === 'GET') {
    const caseId = urlObj.searchParams.get('caseId');
    sendJson(res, 200, engine.mapCoordinator.exportGeoJson(caseId));
    return true;
  }

  if (pathname === '/api/detective/map/perimeter/dispatch' && req.method === 'POST') {
    const body = await parseBody(req);
    const result = engine.mapCoordinator.dispatchPerimeter(body.caseId || null);
    sendJson(res, 200, result);
    return true;
  }

  if (pathname === '/api/detective/map/sync-location' && req.method === 'POST') {
    const body = await parseBody(req);
    const coords = body.coords || [body.lat, body.lon];
    const result = engine.mapCoordinator.syncLocationFromMap(
      coords,
      body.locationName || '雙北街區',
      body.isWalk !== false
    );
    sendJson(res, result.success ? 200 : (result.isForbidden ? 403 : 400), result);
    return true;
  }

  if (pathname === '/api/detective/map/mode' && req.method === 'POST') {
    const body = await parseBody(req);
    const result = engine.mapCoordinator.setPairingMode(body.mode);
    sendJson(res, result.success ? 200 : 400, result);
    return true;
  }

  // ─── 10. 地圖協同橋樑事件 API ───

  if (pathname === '/api/detective/bridge/events' && req.method === 'GET') {
    sendJson(res, 200, {
      success: true,
      events: engine.bridge.getRecentEvents(40)
    });
    return true;
  }

  if (pathname === '/api/detective/bridge/event' && req.method === 'POST') {
    const body = await parseBody(req);
    const entry = engine.bridge.dispatch(body.event, body.payload);
    sendJson(res, 200, { success: true, dispatched: entry });
    return true;
  }

  // 若為 /api/detective/ 但未匹配具體路由
  if (pathname.startsWith('/api/detective/')) {
    sendJson(res, 404, { error: `未知的偵探核心路由 [${pathname}]` });
    return true;
  }

  return false;
}

// 建立獨立 HTTP 伺服器
const server = http.createServer(async (req, res) => {
  const urlObj = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  if (urlObj.pathname === '/') {
    const detectiveHtml = path.join(__dirname, 'public/index.html');
    if (fs.existsSync(detectiveHtml)) {
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      fs.createReadStream(detectiveHtml).pipe(res);
      return;
    }
  }

  const handled = await handleDetectiveRequest(req, res, defaultEngine);
  if (!handled) {
    sendJson(res, 404, {
      error: 'Taipei Detective Core API - 請造訪 /detective 或 /api/detective/* 端點'
    });
  }
});

if (require.main === module) {
  server.listen(PORT, () => {
    console.log(`\n========================================================`);
    console.log(`🔍 TAIPEI DETECTIVE CORE SERVER (都會調查員偵探核心伺服器)`);
    console.log(`========================================================`);
    console.log(`📡 服務運行於: http://localhost:${PORT}`);
    console.log(`🌐 狀態檢查:   http://localhost:${PORT}/api/detective/status`);
    console.log(`🗺️ 地圖圖資:   http://localhost:${PORT}/api/detective/map/geojson`);
    console.log(`🔒 憲法級規範: 嚴禁瞬移 / 華人全名 / 稱謂「都會調查員」`);
    console.log(`========================================================\n`);
  });
}

module.exports = {
  server,
  handleDetectiveRequest,
  engine: defaultEngine
};
