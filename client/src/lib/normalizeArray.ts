/**
 * normalizeArray — the SINGLE place that handles API response normalization.
 *
 * Rules:
 *  - Array input        → returned as-is
 *  - { data: [...] }   → returns .data
 *  - { items: [...] }  → returns .items
 *  - anything else     → returns []
 *
 * Usage: normalizeArray<Product>(apiResponse)
 * Never use (x ?? []) or Array.isArray checks in components — use this instead.
 */
export function normalizeArray<T = unknown>(input: unknown): T[] {
  if (Array.isArray(input)) return input as T[];

  if (input !== null && typeof input === "object") {
    const obj = input as Record<string, unknown>;
    if (Array.isArray(obj["data"])) return obj["data"] as T[];
    if (Array.isArray(obj["items"])) return obj["items"] as T[];
  }

  return [];
}
