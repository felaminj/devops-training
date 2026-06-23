import type { GeoBounds } from '@earthquake/shared-types';

export type ImageDimensions = {
  width: number;
  height: number;
};

export type WorldFileParams = {
  pixelSizeX: number;
  rotationRow: number;
  rotationCol: number;
  pixelSizeY: number;
  upperLeftX: number;
  upperLeftY: number;
};

export function readImageDimensions(buffer: Buffer): ImageDimensions | null {
  if (buffer.length < 24) return null;
  if (buffer[0] === 0x89 && buffer[1] === 0x50) {
    return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) };
  }
  if (buffer[0] !== 0xff || buffer[1] !== 0xd8) return null;
  let offset = 2;
  while (offset + 9 < buffer.length) {
    if (buffer[offset] !== 0xff) break;
    const marker = buffer[offset + 1];
    if (marker === 0xc0 || marker === 0xc2) {
      return {
        height: buffer.readUInt16BE(offset + 5),
        width: buffer.readUInt16BE(offset + 7),
      };
    }
    const length = buffer.readUInt16BE(offset + 2);
    if (length < 2) break;
    offset += 2 + length;
  }
  return null;
}

export function parseWorldFile(content: string): WorldFileParams | null {
  const lines = content
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  if (lines.length < 6) return null;
  const values = lines.slice(0, 6).map((line) => Number(line));
  if (values.some((value) => Number.isNaN(value))) return null;
  return {
    pixelSizeX: values[0] ?? 0,
    rotationRow: values[1] ?? 0,
    rotationCol: values[2] ?? 0,
    pixelSizeY: values[3] ?? 0,
    upperLeftX: values[4] ?? 0,
    upperLeftY: values[5] ?? 0,
  };
}

export function boundsFromWorldFile(
  worldFile: WorldFileParams,
  width: number,
  height: number
): GeoBounds {
  const west = worldFile.upperLeftX;
  const north = worldFile.upperLeftY;
  const east = west + width * worldFile.pixelSizeX;
  const south = north + height * worldFile.pixelSizeY;
  return {
    southWest: { latitude: south, longitude: west },
    northEast: { latitude: north, longitude: east },
  };
}

export function estimatePhivolcsOfficialMapBounds(
  latitude: number,
  longitude: number,
  magnitude: number | null,
  imageWidth: number,
  imageHeight: number
): GeoBounds {
  const radiusKm = magnitude !== null ? Math.min(200, Math.max(50, magnitude * 20)) : 80;
  const latDelta = radiusKm / 111;
  const lngDelta = latDelta / Math.max(0.35, Math.cos((latitude * Math.PI) / 180));
  const aspect = imageWidth / Math.max(1, imageHeight);
  const adjustedLngDelta = Math.max(lngDelta, latDelta * aspect);
  const adjustedLatDelta = Math.max(latDelta, lngDelta / aspect);
  return {
    southWest: {
      latitude: latitude - adjustedLatDelta,
      longitude: longitude - adjustedLngDelta,
    },
    northEast: {
      latitude: latitude + adjustedLatDelta,
      longitude: longitude + adjustedLngDelta,
    },
  };
}
