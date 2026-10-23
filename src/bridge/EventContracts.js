/**
 * ============================================================================
 * MAP-DETECTIVE EVENT CONTRACTS (地圖系統 ✕ 偵探核心 協同對接事件協議)
 * ============================================================================
 * 本協議規範「地圖系統 (Leaflet / Web)」與「偵探系統核心 (Detective Core)」之間的標準雙向資料交換。
 * 堅持解耦：兩邊獨立運作，透過標準事件發布/訂閱 (Pub/Sub) 相互通信，完全消除資料斷點。
 */

const MapDetectiveEvents = {
  // ─── 來自地圖系統的事件 (Map -> Detective) ───
  MAP: {
    // 玩家移動至新座標: { lat, lon, sectorCode, sectorName, isWalk }
    PLAYER_MOVED: 'map:player_moved',

    // 玩家到達捷運/火車站點: { stationName, lineName, transportType }
    STATION_ARRIVED: 'map:station_arrived',

    // 玩家進入建築/實體門市: { storeId, buildingId, brand, name, lat, lon }
    STORE_ENTERED: 'map:store_entered',

    // 玩家走出建築/門市: { storeId, buildingId }
    STORE_EXITED: 'map:store_exited',

    // 玩家搭乘大眾運輸: { vehicleType: 'bus'|'mrt'|'thsr'|'tra', routeId, vehicleId }
    TRANSIT_BOARDED: 'map:transit_boarded',

    // 施工狀態變更 (真實停工/復工): { constructionId, isOpen, name }
    CONSTRUCTION_STATE_CHANGED: 'map:construction_state_changed',

    // 玩家點擊地圖上的調查熱點/物證節點: { poiId, caseId, coords }
    INVESTIGATION_POI_CLICKED: 'map:investigation_poi_clicked',

    // 玩家請求進入建築物大門: { buildingId, userCoords }
    BUILDING_ENTER_REQUEST: 'map:building_enter_request',

    // 玩家請求退出建築物回到街廓: {}
    BUILDING_EXIT_REQUEST: 'map:building_exit_request',

    // 玩家於地圖門市點擊購買商品: { item, storeId, isPhysicalStore, useTumbler }
    ITEM_BUY_REQUEST: 'map:item_buy_request',

    // 玩家於地圖科普場館點擊借用專業儀器: { tool, venueId }
    TOOL_BORROW_REQUEST: 'map:tool_borrow_request',

    // 玩家於生活圈巷弄點擊拾獲隱藏彩蛋: { item, caseId, distanceMeters }
    EASTER_EGG_PICK_REQUEST: 'map:easter_egg_pick_request',

    // 玩家於地圖點擊嫌疑人進行詰問/出示物證對質: { sessionId, suspectId, optionIndex }
    SUSPECT_INTERROGATE_REQUEST: 'map:suspect_interrogate_request'
  },

  // ─── 來自偵探核心的事件 (Detective -> Map) ───
  DETECTIVE: {
    // 接取新案件，要求地圖標註調查警戒區: { caseId, title, centerCoords, radiusMeters, hints }
    CASE_ACCEPTED: 'detective:case_accepted',

    // 搜查警戒圈專屬圖資與半徑派發: { caseId, title, center, radiusMeters, sector, color, nearestMrt, crimeTapeActive }
    PERIMETER_DISPATCHED: 'detective:perimeter_dispatched',

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

    // 實體門市親赴 85 折結算成功通知: { item, costPaid, balance, storeName, distanceMeters }
    STORE_PURCHASED: 'detective:store_purchased',

    // 4 大科普場館微借用完成通知: { tool, venueName, distanceMeters }
    VENUE_BORROWED: 'detective:venue_borrowed',

    // 案發 50~100m 彩蛋拾獲通知: { item, caseId, distanceMeters }
    EASTER_EGG_FOUND: 'detective:easter_egg_found',

    // 建築物大門進入廣播: { buildingId, buildingName, icon, interiorTemplate }
    BUILDING_ENTERED: 'detective:building_entered',

    // 建築物走出回到街廓廣播: { exitedBuildingName }
    BUILDING_EXITED: 'detective:building_exited',

    // 嫌犯口供筆錄狀態雙向綁定與突破更新: { sessionId, suspectId, suspectName, step, clueUnlocked, caseClosed }
    SUSPECT_CONFRONTED: 'detective:suspect_confronted',

    // 案件破案結案: { caseId, evaluationGrade, isSuccess, rewardPoints, souvenirUnlocked }
    CASE_RESOLVED: 'detective:case_resolved',

    // 冷案檔案庫封存通知 (零劇透未破懸案移入檔案庫): { caseId, coldCaseName, reason }
    COLD_CASE_ARCHIVED: 'detective:cold_case_archived',

    // 六年級防嚇保護馬賽克狀態同步: { enabled }
    SAFE_VIEWING_TOGGLED: 'detective:safe_viewing_toggled'
  }
};

module.exports = {
  MapDetectiveEvents
};
