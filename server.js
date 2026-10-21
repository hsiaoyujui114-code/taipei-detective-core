/**
 * ============================================================================
 * TAIPEI DETECTIVE CORE SERVER (偵探系統獨立本機伺服器)
 * ============================================================================
 * 支援單獨以 node server.js 啟動 (預設 Port 3001，避免與地圖 Port 3000 衝突)，
 * 亦可由主伺服器反向代理或由測試腳本調用。
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

  // 1. API 路由
  if (pathname === '/api/detective/status' && req.method === 'GET') {
    return sendJson(res, 200, {
      success: true,
      investigator: engine.investigator.getStatus(),
      inventory: engine.investigator.inventory.listAll(),
      activeCase: engine.caseManager.getActiveCaseState()
    });
  }

  if (pathname === '/api/detective/cases' && req.method === 'GET') {
    return sendJson(res, 200, {
      success: true,
      cases: engine.loader.listCases()
    });
  }

  if (pathname === '/api/detective/case/accept' && req.method === 'POST') {
    const body = await parseBody(req);
    const result = engine.caseManager.acceptCase(body.caseId, engine.investigator);
    return sendJson(res, result.success ? 200 : 400, result);
  }

  if (pathname === '/api/detective/evidence/examine' && req.method === 'POST') {
    const body = await parseBody(req);
    const result = engine.evidenceEngine.examineEvidence(body.evidenceId, body.toolId, engine.investigator);
    return sendJson(res, result.success ? 200 : 400, result);
  }

  if (pathname === '/api/detective/dialogue/start' && req.method === 'POST') {
    const body = await parseBody(req);
    const result = engine.dialogueEngine.startDialogue(body.sessionId || 'session_web', body.npcId);
    return sendJson(res, result.success ? 200 : 400, result);
  }

  if (pathname === '/api/detective/dialogue/select' && req.method === 'POST') {
    const body = await parseBody(req);
    const result = engine.dialogueEngine.selectOption(body.sessionId || 'session_web', body.optionIndex, engine.investigator);
    return sendJson(res, result.success ? 200 : 400, result);
  }

  if (pathname === '/api/detective/deduction/solve' && req.method === 'POST') {
    const body = await parseBody(req);
    const result = engine.caseManager.resolveCase(body.caseId, body.suspectId, body.evidenceIds || [], engine.investigator);
    return sendJson(res, result.success ? 200 : 400, result);
  }

  if (pathname === '/api/detective/bridge/events' && req.method === 'GET') {
    return sendJson(res, 200, {
      success: true,
      events: engine.bridge.getRecentEvents(30)
    });
  }

  if (pathname === '/api/detective/bridge/event' && req.method === 'POST') {
    const body = await parseBody(req);
    const entry = engine.bridge.dispatch(body.event, body.payload);
    return sendJson(res, 200, { success: true, dispatched: entry });
  }

  // 2. 靜態檔案路由
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
