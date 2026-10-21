/**
 * ============================================================================
 * TAIPEI DETECTIVE CORE SERVER (都會調查員偵探核心伺服器)
 * ============================================================================
 * 支援以 node server.js 啟動 (預設 Port 3001，避免與地圖 Port 3000 衝突)，
 * 亦可由主伺服器反向代理或由自動化測試腳本調用。
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
const engine = createDetectiveEngine();

function sendJson(res, statusCode, data) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  });
  res.end(JSON.stringify(data));
}

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

const server = http.createServer(async (req, res) => {
  const urlObj = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const pathname = urlObj.pathname;

  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    });
    res.end();
    return;
  }

  // ─── 1. 調查員狀態與設定 API ───

  if (pathname === '/api/detective/status' && req.method === 'GET') {
    return sendJson(res, 200, {
      success: true,
      investigator: engine.investigator.getStatus(),
      inventory: engine.investigator.inventory.listAll(),
      activeCase: engine.caseManager.getActiveCaseState(),
      souvenirs: engine.investigator.roomSouvenirs,
      safeViewingMosaic: engine.deductionBoard.safeViewingMosaic,
      sectorsTrust: engine.trustSystem.getAllSectorStatus()
    });
  }

  if (pathname === '/api/detective/settings/safe-viewing' && req.method === 'POST') {
    const body = await parseBody(req);
    const result = engine.deductionBoard.setSafeViewingMosaic(body.enabled !== false);
    engine.bridge.dispatch(engine.events.DETECTIVE.SAFE_VIEWING_TOGGLED, result);
    return sendJson(res, 200, { success: true, ...result });
  }

  if (pathname === '/api/detective/wardrobe/outfit' && req.method === 'POST') {
    const body = await parseBody(req);
    const result = engine.investigator.changeOutfit(body.outfitName);
    return sendJson(res, result.success ? 200 : 400, result);
  }

  // ─── 2. 案件生命週期 API ───

  if (pathname === '/api/detective/cases' && req.method === 'GET') {
    return sendJson(res, 200, {
      success: true,
      cases: engine.loader.listCases()
    });
  }

  if (pathname.startsWith('/api/detective/case/') && req.method === 'GET') {
    const caseId = pathname.replace('/api/detective/case/', '');
    const caseDef = engine.loader.getCase(caseId);
    if (!caseDef) return sendJson(res, 404, { success: false, error: '案件不存在' });

    const suspects = engine.loader.getSuspectsForCase(caseId);
    const evidences = engine.loader.getEvidencesForCase(caseId);
    return sendJson(res, 200, {
      success: true,
      case: caseDef,
      suspects,
      evidences
    });
  }

  if (pathname === '/api/detective/case/accept' && req.method === 'POST') {
    const body = await parseBody(req);
    const result = engine.caseManager.acceptCase(body.caseId, engine.investigator);
    return sendJson(res, result.success ? 200 : 400, result);
  }

  if (pathname === '/api/detective/evidence/examine' && req.method === 'POST') {
    const body = await parseBody(req);
    const result = engine.caseManager.examineEvidence(body.evidenceId, body.toolId, engine.investigator);
    return sendJson(res, result.success ? 200 : 400, result);
  }

  if (pathname === '/api/detective/dialogue/start' && req.method === 'POST') {
    const body = await parseBody(req);
    const result = engine.caseManager.interrogateSuspect(body.sessionId || 'session_web', body.npcId);
    return sendJson(res, result.success ? 200 : 400, result);
  }

  if (pathname === '/api/detective/dialogue/select' && req.method === 'POST') {
    const body = await parseBody(req);
    const result = engine.dialogueEngine.selectOption(body.sessionId || 'session_web', body.optionIndex, engine.investigator);
    return sendJson(res, result.success ? 200 : 400, result);
  }

  // ─── 3. 思維推理板、結案指控與冷案封存 API ───

  if (pathname === '/api/detective/deduction/link' && req.method === 'POST') {
    const body = await parseBody(req);
    const result = engine.deductionBoard.linkClueToSuspect(
      body.caseId, body.suspectId, body.evidenceId, body.hypothesisNote
    );
    return sendJson(res, 200, result);
  }

  if (pathname === '/api/detective/deduction/solve' && req.method === 'POST') {
    const body = await parseBody(req);
    const result = engine.caseManager.resolveCase(
      body.caseId, body.suspectId, body.evidenceIds || [], engine.investigator
    );
    return sendJson(res, result.success ? 200 : 400, result);
  }

  if (pathname === '/api/detective/deduction/cold-case' && req.method === 'POST') {
    const body = await parseBody(req);
    const result = engine.caseManager.archiveColdCase(body.caseId, body.reason, engine.investigator);
    return sendJson(res, result.success ? 200 : 400, result);
  }

  if (pathname === '/api/detective/deduction/cold-cases' && req.method === 'GET') {
    return sendJson(res, 200, {
      success: true,
      coldCases: engine.deductionBoard.listColdCases()
    });
  }

  // ─── 4. 移動系統與三大禁忌攔截 (實體步行 ✕ 大眾運輸 ✕ 嚴禁瞬移) ───

  if (pathname === '/api/detective/move/walk' && req.method === 'POST') {
    const body = await parseBody(req);
    if (!body.coords) return sendJson(res, 400, { error: '缺少目標座標' });
    const result = engine.investigator.walkTo(body.coords, body.locationName || '未知街區');
    if (result.success) {
      engine.bridge.dispatch(engine.events.MAP.PLAYER_MOVED, {
        lat: body.coords[0],
        lon: body.coords[1],
        sectorName: body.locationName
      });
    }
    return sendJson(res, result.success ? 200 : 400, result);
  }

  if (pathname === '/api/detective/move/transit' && req.method === 'POST') {
    const body = await parseBody(req);
    if (!body.coords || !body.stationName) return sendJson(res, 400, { error: '缺少座標或站點名稱' });
    const result = engine.investigator.transitTo(body.coords, body.stationName, body.transportType || 'mrt');
    if (result.success) {
      engine.bridge.dispatch(engine.events.MAP.STATION_ARRIVED, {
        stationName: body.stationName,
        transportType: body.transportType || 'mrt'
      });
    }
    return sendJson(res, result.success ? 200 : 400, result);
  }

  if (pathname === '/api/detective/move/teleport' && req.method === 'POST') {
    // 嚴格攔截瞬移請求！
    return sendJson(res, 403, {
      success: false,
      isForbidden: true,
      error: '🈲 憲法級最高禁忌：都會調查員嚴禁瞬移！雙北真實空間嚴禁點圖直接瞬移，請選擇步行或搭乘大眾運輸。'
    });
  }

  // ─── 5. 道具三軌取得與悠遊卡錢包 API ───

  if (pathname === '/api/detective/inventory/buy' && req.method === 'POST') {
    const body = await parseBody(req);
    const result = engine.investigator.inventory.buyItem(
      body.item, engine.investigator.wallet, body.isPhysicalStore !== false, body.useTumbler === true
    );
    return sendJson(res, result.success ? 200 : 400, result);
  }

  if (pathname === '/api/detective/inventory/borrow' && req.method === 'POST') {
    const body = await parseBody(req);
    const result = engine.investigator.inventory.borrowToolFromVenue(body.tool, body.venueName || '科普場館');
    return sendJson(res, 200, result);
  }

  if (pathname === '/api/detective/inventory/egg' && req.method === 'POST') {
    const body = await parseBody(req);
    const result = engine.investigator.inventory.pickEasterEgg(
      body.item, body.caseId, body.distanceMeters || 45
    );
    return sendJson(res, result.success ? 200 : 400, result);
  }

  if (pathname === '/api/detective/wallet/eco-action' && req.method === 'POST') {
    const body = await parseBody(req);
    const result = engine.investigator.wallet.awardEcoAction(body.actionType);
    return sendJson(res, 200, { success: true, ...result });
  }

  if (pathname === '/api/detective/wallet/top-up' && req.method === 'POST') {
    const body = await parseBody(req);
    const result = engine.investigator.wallet.topUp(Number(body.amount) || 100);
    return sendJson(res, result.success ? 200 : 400, result);
  }

  // ─── 6. 108 課綱自然科學實驗演算 API ───

  if (pathname === '/api/detective/science/ph' && req.method === 'POST') {
    const body = await parseBody(req);
    return sendJson(res, 200, engine.evidenceEngine.runPhTitration(Number(body.pH) || 7));
  }

  if (pathname === '/api/detective/science/density' && req.method === 'POST') {
    const body = await parseBody(req);
    return sendJson(res, 200, engine.evidenceEngine.runArchimedesDensity(
      Number(body.massGrams) || 50, Number(body.volumeMl) || 7.5
    ));
  }

  if (pathname === '/api/detective/science/pressure' && req.method === 'POST') {
    const body = await parseBody(req);
    return sendJson(res, 200, engine.evidenceEngine.runPressureCalculation(
      Number(body.massKg) || 70, Number(body.areaCm2) || 400
    ));
  }

  if (pathname === '/api/detective/science/acoustic' && req.method === 'POST') {
    const body = await parseBody(req);
    return sendJson(res, 200, engine.evidenceEngine.runAcousticDelayCalculation(
      Number(body.distanceMeters) || 300, Number(body.temperatureC) || 20
    ));
  }

  // ─── 7. 地圖協同橋樑事件 API ───

  if (pathname === '/api/detective/bridge/events' && req.method === 'GET') {
    return sendJson(res, 200, {
      success: true,
      events: engine.bridge.getRecentEvents(40)
    });
  }

  if (pathname === '/api/detective/bridge/event' && req.method === 'POST') {
    const body = await parseBody(req);
    const entry = engine.bridge.dispatch(body.event, body.payload);
    return sendJson(res, 200, { success: true, dispatched: entry });
  }

  // ─── 8. 靜態可視化工作台檔案路由 ───

  let filePath = path.join(__dirname, 'public', pathname === '/' ? 'index.html' : pathname);
  if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    const ext = path.extname(filePath).toLowerCase();
    const mimeTypes = {
      '.html': 'text/html; charset=utf-8',
      '.css': 'text/css; charset=utf-8',
      '.js': 'application/javascript; charset=utf-8',
      '.json': 'application/json; charset=utf-8'
    };
    res.writeHead(200, { 'Content-Type': mimeTypes[ext] || 'text/plain' });
    fs.createReadStream(filePath).pipe(res);
  } else {
    sendJson(res, 404, { error: 'Not Found', path: pathname });
  }
});

server.listen(PORT, () => {
  console.log(`🕵️ 雙北都會調查員偵探核心伺服器已於 http://localhost:${PORT} 啟動！`);
});

module.exports = { server, engine };
