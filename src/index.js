/**
 * ============================================================================
 * TAIPEI DETECTIVE CORE (雙北都會調查員偵探系統核心)
 * ============================================================================
 * 專為獨立研究專題設計之高內聚、低耦合偵探推理系統。
 * 包含：
 * 1. StoryLoader (非寫死劇情資料載入器)
 * 2. Investigator (都會調查員狀態、三軌背包與物理移動系統)
 * 3. BuildingSystem (雙北真實建築進出標記系統 企劃書 02.2)
 * 4. EvidenceEngine (生活科學物證鑑識與自然科學演算)
 * 5. DialogueEngine (多輪 NPC 詰問樹與物證對質打臉)
 * 6. DeductionBoard (思維推理板、指控評等與冷案檔案庫)
 * 7. TrustSystem (社區信賴度 Lv.1~Lv.5 與特區聲譽)
 * 8. CaseManager (全生命週期狀態機總控)
 * 9. MapBridge (雙向事件協同橋樑總線)
 * 10. MapPairingCoordinator (地圖協同調度器)
 */

const { StoryLoader } = require('./storyline/StoryLoader');
const { Investigator, calculateDistanceMeters } = require('./player/Investigator');
const { Inventory } = require('./player/Inventory');
const { EcoWallet } = require('./player/EcoWallet');
const { BuildingSystem } = require('./world/BuildingSystem');
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
  const buildingSystem = new BuildingSystem();

  const evidenceEngine = new EvidenceEngine(loader);
  const dialogueEngine = new DialogueEngine(loader);
  const deductionBoard = new DeductionBoard(loader, evidenceEngine);
  const trustSystem = new TrustSystem();
  const caseManager = new CaseManager(loader, evidenceEngine, dialogueEngine, deductionBoard, bridge);
  const mapCoordinator = new MapPairingCoordinator(loader, caseManager, investigator, bridge, buildingSystem);

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

  bridge.on(MapDetectiveEvents.MAP.BUILDING_ENTER_REQUEST, (payload) => {
    if (payload && payload.buildingId) {
      mapCoordinator.enterBuildingFromMap(payload.buildingId);
    }
  });

  bridge.on(MapDetectiveEvents.MAP.BUILDING_EXIT_REQUEST, () => {
    mapCoordinator.exitBuildingFromMap();
  });

  bridge.on(MapDetectiveEvents.MAP.ITEM_BUY_REQUEST, (payload) => {
    if (payload && payload.item) {
      mapCoordinator.purchaseAtStoreFromMap(payload.item, payload.storeId, payload.options || {});
    }
  });

  bridge.on(MapDetectiveEvents.MAP.TOOL_BORROW_REQUEST, (payload) => {
    if (payload && payload.tool && payload.venueId) {
      mapCoordinator.borrowFromVenueFromMap(payload.tool, payload.venueId);
    }
  });

  bridge.on(MapDetectiveEvents.MAP.EASTER_EGG_PICK_REQUEST, (payload) => {
    if (payload && payload.item) {
      mapCoordinator.pickEasterEggFromMap(payload.item, payload.caseId || null);
    }
  });

  bridge.on(MapDetectiveEvents.MAP.SUSPECT_INTERROGATE_REQUEST, (payload) => {
    if (payload && payload.sessionId && payload.suspectId) {
      mapCoordinator.syncSuspectInterrogationState(payload.sessionId, payload.suspectId, payload.optionIndex);
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
    buildingSystem,
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
  BuildingSystem,
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
