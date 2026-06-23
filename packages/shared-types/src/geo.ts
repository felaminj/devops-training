export interface GeoBoundsCorner {
  latitude: number;
  longitude: number;
}

export interface GeoBounds {
  southWest: GeoBoundsCorner;
  northEast: GeoBoundsCorner;
}
