/**
 * ============================================================================
 * MAP BRIDGE (雙向事件協同橋樑)
 * ============================================================================
 * 支援同處理序 EventEmitter、瀏覽器 window.postMessage、或 WebSocket 伺服器廣播。
 * 確保地圖系統 (Antigravity) 與偵探核心 (Claude) 無論在本地伺服器、單體測試、
 * 或跨視窗下皆能 100% 順暢雙向通信。
 */

const { EventEmitter } = require('events');
const { MapDetectiveEvents } = require('./EventContracts');

class MapBridge extends EventEmitter {
  constructor() {
    super();
    this.name = 'MapBridge';
    this.eventLog = [];
    this.maxLogLength = 150;
  }

  /**
   * 記錄並分發事件
   */
  dispatch(eventName, payload) {
    const entry = {
      timestamp: new Date().toISOString(),
      event: eventName,
      payload
    };
    this.eventLog.unshift(entry);
    if (this.eventLog.length > this.maxLogLength) {
      this.eventLog.pop();
    }
    this.emit(eventName, payload);
    this.emit('*', entry);
    return entry;
  }

  // ─── 模擬地圖系統傳送至偵探核心的事件 (Map -> Detective) ───

  simulateMapPlayerMoved(lat, lon, sectorCode, sectorName) {
    return this.dispatch(MapDetectiveEvents.MAP.PLAYER_MOVED, {
      lat, lon, sectorCode, sectorName
    });
  }

  simulateStationArrived(stationName, lineName, transportType = 'mrt') {
    return this.dispatch(MapDetectiveEvents.MAP.STATION_ARRIVED, {
      stationName, lineName, transportType
    });
  }

  simulateStoreEntered(storeId, brand, name, lat, lon) {
    return this.dispatch(MapDetectiveEvents.MAP.STORE_ENTERED, {
      storeId, brand, name, lat, lon
    });
  }

  simulateStoreExited(storeId) {
    return this.dispatch(MapDetectiveEvents.MAP.STORE_EXITED, {
      storeId
    });
  }

  simulateTransitBoarded(vehicleType, routeId, vehicleId = 'VH-001') {
    return this.dispatch(MapDetectiveEvents.MAP.TRANSIT_BOARDED, {
      vehicleType, routeId, vehicleId
    });
  }

  simulateInvestigationPoiClicked(poiId, caseId, coords) {
    return this.dispatch(MapDetectiveEvents.MAP.INVESTIGATION_POI_CLICKED, {
      poiId, caseId, coords
    });
  }

  simulateConstructionStateChanged(constructionId, isOpen, name) {
    return this.dispatch(MapDetectiveEvents.MAP.CONSTRUCTION_STATE_CHANGED, {
      constructionId, isOpen, name
    });
  }

  /**
   * 取得最近事件日誌
   */
  getRecentEvents(limit = 30) {
    return this.eventLog.slice(0, limit);
  }

  clearEvents() {
    this.eventLog = [];
  }
}

// 單例模式供全局共享
const defaultBridge = new MapBridge();

module.exports = {
  MapBridge,
  defaultBridge,
  MapDetectiveEvents
};
