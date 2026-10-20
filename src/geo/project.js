/** Local equirectangular projection. Origin is the Dholera village OSM node. */
export const ORIGIN = Object.freeze({
  lat: 22.2495856,
  lon: 72.1959892,
  label: "Dholera village, OpenStreetMap",
});

const M_PER_DEG_LAT = 110540;
const M_PER_DEG_LON = 111320 * Math.cos((ORIGIN.lat * Math.PI) / 180);

/** @returns {{x:number, z:number}} +x east, −z north */
export function project(lat, lon) {
  const north = (lat - ORIGIN.lat) * M_PER_DEG_LAT;
  return {
    x: (lon - ORIGIN.lon) * M_PER_DEG_LON,
    z: -north,
  };
}

export function groundDistanceKm(lat, lon) {
  const p = project(lat, lon);
  return Math.hypot(p.x, p.z) / 1000;
}
