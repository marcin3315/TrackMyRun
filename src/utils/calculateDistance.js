// Haversine formula
export function calculateDistance(locations) {
  const toRad = (value) => (value * Math.PI) / 180;
  let distance = 0;

  for (let i = 1; i < locations.length; i++) {
    const prev = locations[i - 1];
    const curr = locations[i];

    const R = 6371; // km
    const dLat = toRad(curr.latitude - prev.latitude);
    const dLon = toRad(curr.longitude - prev.longitude);

    const lat1 = toRad(prev.latitude);
    const lat2 = toRad(curr.latitude);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    distance += R * c;
  }

  return distance; // km
}
