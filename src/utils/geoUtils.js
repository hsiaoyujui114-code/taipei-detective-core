/**
 * GEO UTILS (雙北地理座標距離計算與空間幾何工具)
 */

// 計算地球表面兩點大圓經緯度距離 (公尺) - Haversine Formula
function calculateDistanceMeters(coords1, coords2) {
  if (!coords1 || !coords2) return 0;
  const [lat1, lon1] = coords1;
  const [lat2, lon2] = coords2;
  const R = 6371000; // 地球半徑 (公尺)
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

module.exports = {
  calculateDistanceMeters
};
