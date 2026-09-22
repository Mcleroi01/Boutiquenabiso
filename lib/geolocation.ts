export type Location = {
  latitude: number;
  longitude: number;
  accuracy: number | null;
};

export function requestLocation(): Promise<Location> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('La géolocalisation n’est pas disponible sur cet appareil.'));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => resolve({ latitude: coords.latitude, longitude: coords.longitude, accuracy: coords.accuracy ?? null }),
      (error) => reject(new Error(error.code === error.PERMISSION_DENIED ? 'Autorisation de position refusée.' : 'Impossible de récupérer votre position.')),
      { enableHighAccuracy: true, maximumAge: 5 * 60 * 1000, timeout: 10000 },
    );
  });
}
