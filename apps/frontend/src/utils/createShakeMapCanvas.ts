import type { MacroseismicIntensityMapData } from '@earthquake/shared-utils';
import {
  estimateIntensityAtCoordinate,
  getShakeMapBounds,
  interpolateShakeMapColor,
} from '@earthquake/shared-utils';

const CANVAS_SIZE = 480;

function parseColor(hex: string): [number, number, number, number] {
  const normalized = hex.replace('#', '');
  return [
    Number.parseInt(normalized.slice(0, 2), 16),
    Number.parseInt(normalized.slice(2, 4), 16),
    Number.parseInt(normalized.slice(4, 6), 16),
    168,
  ];
}

export function createShakeMapCanvas(mapData: MacroseismicIntensityMapData): {
  dataUrl: string;
  bounds: [[number, number], [number, number]];
} {
  const bounds = getShakeMapBounds(
    mapData.epicenter.latitude,
    mapData.epicenter.longitude,
    mapData.outerRadiusKm
  );
  const canvas = document.createElement('canvas');
  canvas.width = CANVAS_SIZE;
  canvas.height = CANVAS_SIZE;
  const context = canvas.getContext('2d');
  if (!context) {
    return {
      dataUrl: '',
      bounds: [
        [bounds.southWest.latitude, bounds.southWest.longitude],
        [bounds.northEast.latitude, bounds.northEast.longitude],
      ],
    };
  }
  const image = context.createImageData(CANVAS_SIZE, CANVAS_SIZE);
  const latSpan = bounds.northEast.latitude - bounds.southWest.latitude;
  const lngSpan = bounds.northEast.longitude - bounds.southWest.longitude;
  for (let y = 0; y < CANVAS_SIZE; y += 1) {
    for (let x = 0; x < CANVAS_SIZE; x += 1) {
      const latitude = bounds.northEast.latitude - (y / CANVAS_SIZE) * latSpan;
      const longitude = bounds.southWest.longitude + (x / CANVAS_SIZE) * lngSpan;
      const intensity = estimateIntensityAtCoordinate(mapData, latitude, longitude);
      const color = parseColor(interpolateShakeMapColor(intensity));
      const index = (y * CANVAS_SIZE + x) * 4;
      image.data[index] = color[0];
      image.data[index + 1] = color[1];
      image.data[index + 2] = color[2];
      image.data[index + 3] = color[3];
    }
  }
  context.putImageData(image, 0, 0);
  return {
    dataUrl: canvas.toDataURL('image/png'),
    bounds: [
      [bounds.southWest.latitude, bounds.southWest.longitude],
      [bounds.northEast.latitude, bounds.northEast.longitude],
    ],
  };
}
