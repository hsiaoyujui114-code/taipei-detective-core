/**
 * ============================================================================
 * TAIPEI DETECTIVE CORE (雙北都會調查員偵探系統核心)
 * ============================================================================
 * 專為獨立研究專題設計之高內聚、低耦合偵探推理系統。
 * 包含：
 * 1. StoryLoader (非寫死劇情資料載入器)
 * 2. Investigator (都會調查員狀態與背包)
 * 3. EvidenceEngine (生活科學物證鑑識)
 * 4. DialogueEngine (多輪 NPC 詰問樹)
 * 5. DeductionBoard (思維推理與結案驗證)
 * 6. CaseManager (全流程狀態機)
 * 7. MapBridge (地圖系統協同總線)
 */

const { StoryLoader } = require('./storyline/StoryLoader');
const { Investigator } = require('./player/Investigator');
const { EvidenceEngine } = require('./core/EvidenceEngine');
const { DialogueEngine } = require('./storyline/DialogueEngine');
const { DeductionBoard } = require('./core/DeductionBoard');
const { TrustSystem } = require('./core/TrustSystem');
const { CaseManager } = require('./core/CaseManager');
const { MapBridge, defaultBridge, MapDetectiveEvents } = require('./bridge/MapBridge');

function createDetectiveEngine(customDataDir = null) {
  const loader = new StoryLoader(customDataDir);
  const bridge = new MapBridge();
  const investigator = new Investigator('雙北行蹤調查員');

  const evidenceEngine = new EvidenceEngine(loader);
  const dialogueEngine = new DialogueEngine(loader);
  const deductionBoard = new DeductionBoard(loader, evidenceEngine);
  const trustSystem = new TrustSystem();
  const caseManager = new CaseManager(loader, evidenceEngine, dialogueEngine, deductionBoard, bridge);

  return {
    loader,
    bridge,
    investigator,
    evidenceEngine,
    dialogueEngine,
    deductionBoard,
    trustSystem,
    caseManager,
    events: MapDetectiveEvents
  };
}

module.exports = {
  createDetectiveEngine,
  StoryLoader,
  Investigator,
  EvidenceEngine,
  DialogueEngine,
  DeductionBoard,
  TrustSystem,
  CaseManager,
  MapBridge,
  defaultBridge,
  MapDetectiveEvents
};
