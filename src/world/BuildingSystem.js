/**
 * ============================================================================
 * BUILDING SYSTEM (雙北真實建築進出標記系統)
 * ============================================================================
 * 嚴格依照企劃書 02.2 節「建築進出發光圖案標記系統」實裝：
 * 1. 【可進入建築】：
 *    - 屋頂正門常駐浮動發光圖案：
 *      🏪 超商、☕ 咖啡廳、🌿 中藥鋪、🏛️ 學習場館、🚪 調查員事務所、♨️ 溫泉老旅店
 *    - 調查員靠近門口（<= 25m）提供進出切換精緻室內。
 * 2. 【不可進建築】：
 *    - 完全不顯示任何圖案（icon = null），作為實體街景碰撞阻擋，杜絕無意義盲目試探。
 * 3. 視野半徑：
 *    - 依據 850m 生活圈視野限制，即時篩選周遭建築清單與方位距離。
 */

const fs = require('fs');
const path = require('path');
const { calculateDistanceMeters } = require('../utils/geoUtils');

class BuildingSystem {
  constructor(customDataPath = null) {
    this.dataPath = customDataPath || path.join(__dirname, '../data/world/buildings.json');
    this.buildings = new Map();
    this.currentInsideBuildingId = null;
    this.loadBuildings();
  }

  loadBuildings() {
    this.buildings.clear();
    if (fs.existsSync(this.dataPath)) {
      try {
        const content = fs.readFileSync(this.dataPath, 'utf8');
        const list = JSON.parse(content);
        list.forEach(b => {
          this.buildings.set(b.id, b);
        });
      } catch (err) {
        console.error('[BuildingSystem] 載入建築圖資失敗:', err.message);
      }
    }
  }

  getBuilding(buildingId) {
    return this.buildings.get(buildingId) || null;
  }

  findBuildingByName(keyword) {
    if (!keyword) return null;
    for (const b of this.buildings.values()) {
      if (b.name.includes(keyword) || (b.address && b.address.includes(keyword))) {
        return b;
      }
    }
    return null;
  }

  listAllBuildings() {
    return Array.from(this.buildings.values());
  }

  /**
   * 取得周遭生活圈視野內建築 (預設 850m)
   * 嚴格落實：可進顯示圖案，不可進不顯示圖案 (icon = null)
   */
  getNearbyBuildings(userCoords, radiusMeters = 850) {
    const results = [];
    for (const b of this.buildings.values()) {
      const dist = calculateDistanceMeters(userCoords, b.coords);
      if (dist <= radiusMeters) {
        results.push({
          id: b.id,
          name: b.name,
          category: b.category,
          isEnterable: b.isEnterable,
          icon: b.isEnterable ? b.icon : null, // 不可進建築完全不顯示圖案
          coords: b.coords,
          address: b.address,
          distanceMeters: dist,
          canEnterRightNow: b.isEnterable && dist <= 25,
          interiorTemplate: b.isEnterable ? b.interiorTemplate : null
        });
      }
    }
    // 依距離由近至遠排序
    return results.sort((a, b) => a.distanceMeters - b.distanceMeters);
  }

  /**
   * 判定是否可進入該建築 (企劃書 02.2 核心規格)
   */
  canEnterBuilding(buildingId, userCoords) {
    const building = this.getBuilding(buildingId);
    if (!building) {
      return {
        canEnter: false,
        error: `建築代號 [${buildingId}] 不存在。`
      };
    }

    // 1. 不可進建築判定：無圖案標記，作為實體街景碰撞阻擋，杜絕無意義盲目試探
    if (!building.isEnterable) {
      return {
        canEnter: false,
        isEnterable: false,
        icon: null,
        buildingName: building.name,
        error: `【${building.name}】為一般實體街景建築，外觀無浮動圖案標記，不可進入！作為實體街景碰撞阻擋，杜絕無意義盲目試探。`
      };
    }

    // 2. 可進建築距離判定 (靠近大門 <= 25m)
    const dist = calculateDistanceMeters(userCoords, building.coords);
    if (dist > 25) {
      return {
        canEnter: false,
        isEnterable: true,
        icon: building.icon,
        buildingName: building.name,
        distanceMeters: dist,
        error: `距離可進入建築【${building.name}】（${building.icon}）大門過遠（當前距離 ${dist}m > 25m），請靠近大門光圈！`
      };
    }

    // 3. 通過驗證
    return {
      canEnter: true,
      isEnterable: true,
      icon: building.icon,
      buildingName: building.name,
      distanceMeters: dist,
      interiorTemplate: building.interiorTemplate,
      message: `已靠近可進入建築【${building.name}】大門光圈（${building.icon}），可切換進入精緻室內！`
    };
  }

  /**
   * 進入建築
   */
  enterBuilding(buildingId, userCoords) {
    const check = this.canEnterBuilding(buildingId, userCoords);
    if (!check.canEnter) {
      return { success: false, ...check };
    }

    const building = this.getBuilding(buildingId);
    this.currentInsideBuildingId = buildingId;
    return {
      success: true,
      buildingId,
      building,
      buildingName: building.name,
      icon: building.icon,
      interiorTemplate: building.interiorTemplate,
      address: building.address,
      message: `成功進入【${building.name}】（${building.icon}），切換至 ${building.interiorTemplate} 精緻室內！`
    };
  }

  /**
   * 走出建築回到街道
   */
  exitBuilding() {
    if (!this.currentInsideBuildingId) {
      return { success: false, error: '都會調查員目前已在戶外街廓，並未處於任何建築室內。' };
    }

    const building = this.getBuilding(this.currentInsideBuildingId);
    const name = building ? building.name : '建築';
    this.currentInsideBuildingId = null;

    return {
      success: true,
      exitedBuildingName: name,
      message: `已走出【${name}】，回到雙北自然街廓。`
    };
  }

  getCurrentInsideBuilding() {
    if (!this.currentInsideBuildingId) return null;
    return this.getBuilding(this.currentInsideBuildingId);
  }
}

module.exports = {
  BuildingSystem
};
