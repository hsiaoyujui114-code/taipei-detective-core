/**
 * ============================================================================
 * TAIPEI DETECTIVE CORE (雙北都會調查員偵探系統核心)
 * ============================================================================
 * 專為獨立研究專題設計之高內聚、低耦合偵探推理系統。
 * 包含：
 * 1. StoryLoader (非寫死劇情資料載入器)
 * 2. Investigator (都會調查員狀態、三軌背包與物理移動系統)
 * 3. EvidenceEngine (生活科學物證鑑識與自然科學演算)
 * 4. DialogueEngine (多輪 NPC 詰問樹與物證對質打臉)
 * 5. DeductionBoard (思維推理板、指控評等與冷案檔案庫)
 * 6. TrustSystem (社區信賴度 Lv.1~Lv.5 與特區聲譽)
 * 7. CaseManager (全生命週期狀態機總控)
 * 8. MapBridge (雙向事件協同橋樑總線)
 */

const { StoryLoader } = require('./storyline/StoryLoader');
const { Investigator, calculateDistanceMeters } = require('./player/Investigator');
const { Inventory } = require('./player/Inventory');
const { EcoWallet } = require('./player/EcoWallet');
const { EvidenceEngine } = require('./core/EvidenceEngine');
const { DialogueEngine } = require('./storyline/DialogueEngine');
const { DeductionBoard } = require('./core/DeductionBoard');
const { TrustSystem } = require('./core/TrustSystem');
const { CaseManager } = require('./core/CaseManager');
const { MapBridge, defaultBridge, MapDetectiveEvents } = require('./bridge/MapBridge');
const { MapPairingCoordinator } = require('./bridge/MapPairingCoordinator');

function createDetectiveEngine(customDataDir = null) {
  const loader = new StoryLoader(customDataDir);
  const bridge = new MapBridge();
  const investigator = new Investigator('雙北行蹤調查員');

  const evidenceEngine = new EvidenceEngine(loader);
  const dialogueEngine = new DialogueEngine(loader);
  const deductionBoard = new DeductionBoard(loader, evidenceEngine);
  const trustSystem = new TrustSystem();
  const caseManager = new CaseManager(loader, evidenceEngine, dialogueEngine, deductionBoard, bridge);
  const mapCoordinator = new MapPairingCoordinator(loader, caseManager, investigator, bridge);

  // ─── 自動掛載雙向協同事件監聽 (Map ⇄ Detective 自動聯動) ───
  bridge.on(MapDetectiveEvents.MAP.PLAYER_MOVED, (payload) => {
    if (payload && payload.lat && payload.lon) {
      investigator.currentCoords = [payload.lat, payload.lon];
      if (payload.sectorName) {
        investigator.currentLocationName = payload.sectorName;
      }
    }
  });

  bridge.on(MapDetectiveEvents.MAP.TRANSIT_BOARDED, (payload) => {
    if (payload && payload.vehicleType) {
      investigator.wallet.payTransitFare(20, payload.vehicleType);
    }
  });

  bridge.on(MapDetectiveEvents.DETECTIVE.FARE_DEDUCT_REQUEST, (payload) => {
    if (payload && payload.amount) {
      investigator.wallet.payTransitFare(payload.amount, payload.fareType || 'mrt');
    }
  });

  bridge.on(MapDetectiveEvents.DETECTIVE.ECO_POINTS_AWARDED, (payload) => {
    if (payload && payload.reason) {
      investigator.wallet.awardEcoAction(payload.reason);
    }
  });

  return {
    loader,
    bridge,
    investigator,
    evidenceEngine,
    dialogueEngine,
    deductionBoard,
    trustSystem,
    caseManager,
    mapCoordinator,
    events: MapDetectiveEvents,
    utils: {
      calculateDistanceMeters
    }
  };
}

module.exports = {
  createDetectiveEngine,
  StoryLoader,
  Investigator,
  Inventory,
  EcoWallet,
  EvidenceEngine,
  DialogueEngine,
  DeductionBoard,
  TrustSystem,
  CaseManager,
  MapBridge,
  MapPairingCoordinator,
  defaultBridge,
  MapDetectiveEvents,
  calculateDistanceMeters
};
