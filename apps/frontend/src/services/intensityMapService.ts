import type { ApiResponse, IntensityMapPayload } from '@earthquake/shared-types';
import apiClient from './apiClient';

export async function fetchIntensityMap(eventId: string): Promise<IntensityMapPayload> {
  const encodedId = encodeURIComponent(eventId);
  const response = await apiClient.get<ApiResponse<IntensityMapPayload>>(
    `/earthquakes/${encodedId}/intensity-map`
  );
  return response.data.data;
}

export function resolveIntensityImageUrl(imagePath: string): string {
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) return imagePath;
  const baseUrl = apiClient.defaults.baseURL ?? 'http://localhost:3005/api';
  const normalizedBase = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
  const normalizedPath = imagePath.startsWith('/') ? imagePath : `/${imagePath}`;
  return `${normalizedBase}${normalizedPath}`;
}
