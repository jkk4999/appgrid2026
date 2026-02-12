import { decode } from 'he';

export function safeJsonDecode<T = any>(s?: string | null): T | null {
  if (!s) return null;
  try {
    return JSON.parse(decode(s)) as T;
  } catch {
    try {
      return JSON.parse(s) as T;
    } catch {
      return null;
    }
  }
}

