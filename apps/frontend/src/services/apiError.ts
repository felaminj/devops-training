import axios from 'axios';
import type { ApiErrorResponse } from '@earthquake/shared-types';

export function getApiErrorMessage(error: unknown, fallback: string): string {
  if (!axios.isAxiosError(error)) {
    return error instanceof Error ? error.message : fallback;
  }
  const data = error.response?.data as ApiErrorResponse | undefined;
  return data?.error?.message ?? error.message ?? fallback;
}
