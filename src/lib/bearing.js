export function bearingDeg(from, to) {
  const r = (x) => (x * Math.PI) / 180;
  const y = Math.sin(r(to.lng - from.lng)) * Math.cos(r(to.lat));
  const x =
    Math.cos(r(from.lat)) * Math.sin(r(to.lat)) -
    Math.sin(r(from.lat)) * Math.cos(r(to.lat)) * Math.cos(r(to.lng - from.lng));
  return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
}
export const formatDistance = (m) => (m < 1000 ? `${Math.round(m)} m` : `${(m / 1000).toFixed(2)} km`);
export const compassPoint = (deg) => ["N", "NE", "E", "SE", "S", "SW", "W", "NW"][Math.round(deg / 45) % 8];
