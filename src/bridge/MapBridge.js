/**
 * ============================================================================
 * MAP BRIDGE (雙向事件協同橋樑)
 * ============================================================================
 * 支援同處理序 EventEmitter、瀏覽器 window.postMessage、或 WebSocket 伺服器廣播。
 * 確保地圖系統與偵探核心無論在本地伺服器、單體測試、或瀏覽器雙視窗下皆能對接。
 */

const { EventEmitter } = require('events');
const { MapDetectiveEvents } = require('./EventContracts');

class MapBridge extends EventEmitter {
  constructor() {
    super();
    this.name = 'MapBridge';
    this.eventLog = [];
    this.maxLogLength = 100;
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

  /**
   * 模擬地圖傳來玩家進入特定位置事件
   */
  simulateMapPlayerMoved(lat, lon, sectorCode, sectorName) {
    return this.dispatch(MapDetectiveEvents.MAP.PLAYER_MOVED, {
      lat, lon, sectorCode, sectorName
    });
  }

  /**
   * 模擬地圖傳來進入門市事件
   */
  simulateStoreEntered(storeId, brand, name, lat, lon) {
    return this.dispatch(MapDetectiveEvents.MAP.STORE_ENTERED, {
      storeId, brand, name, lat, lon
    });
  }

  /**
   * 取得最近事件日誌
   */
  getRecentEvents(limit = 20) {
    return this.eventLog.slice(0, limit);
  }
}

// 單例模式
const defaultBridge = new MapBridge();

module.exports = {
  MapBridge,
  defaultBridge,
  MapDetectiveEvents
};
