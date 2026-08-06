interface GeocodeResult {
  latitude: number;
  longitude: number;
}

interface GoogleGeocodeResponse {
  status: string;
  results: { geometry: { location: { lat: number; lng: number } } }[];
}

// Converte uma cidade em coordenadas via Google Geocoding API. Retorna null (em vez de lançar)
// quando a chave não está configurada, a cidade não é encontrada ou a API falha — geocoding é
// uma integração externa best-effort, nunca deve bloquear o onboarding do usuário. Perfis sem
// coordenadas simplesmente não entram no filtro de distância em src/server/routers/discover.ts.
export async function geocodeCity(city: string): Promise<GeocodeResult | null> {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) return null;

  const url = new URL("https://maps.googleapis.com/maps/api/geocode/json");
  url.searchParams.set("address", city);
  url.searchParams.set("key", apiKey);

  try {
    const response = await fetch(url);
    if (!response.ok) return null;

    const data = (await response.json()) as GoogleGeocodeResponse;
    const location = data.status === "OK" ? data.results[0]?.geometry.location : undefined;
    if (!location) return null;

    return { latitude: location.lat, longitude: location.lng };
  } catch {
    return null;
  }
}
