import type { ApiResponse } from '@earthquake/shared-types';

export function createApiResponse<T>(data: T, timestamp = new Date()): ApiResponse<T> {
  return {
    success: true,
    data,
    timestamp: timestamp.toISOString(),
  };
}

export function buildQueryString(params: Record<string, string | number | undefined>): string {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== '') {
      searchParams.set(key, String(value));
    }
  });
  const query = searchParams.toString();
  return query ? `?${query}` : '';
}
