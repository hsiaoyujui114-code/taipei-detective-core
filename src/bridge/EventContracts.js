/**
 * ============================================================================
 * MAP-DETECTIVE EVENT CONTRACTS (地圖系統 ✕ 偵探核心 協同對接事件協議)
 * ============================================================================
 * 本協議規範「地圖系統 (Antigravity)」與「偵探系統核心 (Claude)」之間的標準雙向資料交換。
 * 堅持解耦：兩邊獨立開發，透過標準事件發布/訂閱 (Pub/Sub) 相互通信。
 */

const MapDetectiveEvents = {
  // ─── 來自地圖系統的事件 (Map -> Detective) ───
  MAP: {
    // 玩家移動至新座標: { lat, lon, sectorCode, sectorName }
    PLAYER_MOVED: 'map:player_moved',

    // 玩家到達捷運/火車站點: { stationName, lineName, transportType }
    STATION_ARRIVED: 'map:station_arrived',

    // 玩家進入建築/實體門市: { storeId, brand, name, lat, lon }
    STORE_ENTERED: 'map:store_entered',

    // 玩家走出建築/門市: { storeId }
    STORE_EXITED: 'map:store_exited',

    // 玩家於站牌搭乘大眾運輸: { vehicleType: 'bus'|'mrt'|'thsr'|'tra', routeId, vehicleId }
    TRANSIT_BOARDED: 'map:transit_boarded',

    // 施工狀態變更 (真實停工/復工): { constructionId, isOpen, name }
    CONSTRUCTION_STATE_CHANGED: 'map:construction_state_changed',

    // 玩家點擊地圖上的調查熱點/物證節點: { poiId, caseId, coords }
    INVESTIGATION_POI_CLICKED: 'map:investigation_poi_clicked'
  },

  // ─── 來自偵探核心的事件 (Detective -> Map) ───
  DETECTIVE: {
    // 接取新案件，要求地圖標註調查警戒區: { caseId, title, centerCoords, radiusMeters, hints }
    CASE_ACCEPTED: 'detective:case_accepted',

    // 發現新物證地點，要求在地圖放置閃爍標記: { markerId, caseId, lat, lon, title, clueType }
    MARKER_SPAWN_REQUEST: 'detective:marker_spawn_request',

    // 移除已蒐集完成之現場標記: { markerId }
    MARKER_REMOVE_REQUEST: 'detective:marker_remove_request',

    // 調查鏡頭特寫聚焦請求: { lat, lon, zoomLevel, durationMs }
    FOCUS_CAMERA_REQUEST: 'detective:focus_camera_request',

    // 扣除大眾運輸票價或悠遊卡餘額: { amount, fareType: 'mrt'|'bus'|'tpass' }
    FARE_DEDUCT_REQUEST: 'detective:fare_deduct_request',

    // 獲得環保減塑積分廣播: { ecoPoints, reason }
    ECO_POINTS_AWARDED: 'detective:eco_points_awarded',

    // 案件破案結案: { caseId, evaluationGrade, isSuccess, rewardPoints }
    CASE_RESOLVED: 'detective:case_resolved'
  }
};

module.exports = {
  MapDetectiveEvents
};
