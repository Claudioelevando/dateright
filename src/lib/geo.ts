interface Coordinates {
  lat: number;
  lng: number;
}

function toRadians(degrees: number) {
  return (degrees * Math.PI) / 180;
}

// Fórmula de Haversine — distância em linha reta entre dois pontos na superfície da Terra.
export function distanceKm(a: Coordinates, b: Coordinates) {
  const EARTH_RADIUS_KM = 6371;
  const dLat = toRadians(b.lat - a.lat);
  const dLng = toRadians(b.lng - a.lng);
  const lat1 = toRadians(a.lat);
  const lat2 = toRadians(b.lat);

  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(h));
}

// Retângulo delimitador aproximado (não circular) usado como pré-filtro em nível de banco,
// antes do filtro exato por distanceKm — evita escanear todos os perfis a cada busca.
export function boundingBox(center: Coordinates, radiusKm: number) {
  const KM_PER_DEGREE_LAT = 111;
  const latDelta = radiusKm / KM_PER_DEGREE_LAT;
  const kmPerDegreeLng = KM_PER_DEGREE_LAT * Math.cos(toRadians(center.lat));
  const lngDelta = radiusKm / (kmPerDegreeLng || KM_PER_DEGREE_LAT);

  return {
    minLat: center.lat - latDelta,
    maxLat: center.lat + latDelta,
    minLng: center.lng - lngDelta,
    maxLng: center.lng + lngDelta,
  };
}
