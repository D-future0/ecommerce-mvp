/**
 * Normalize database records, including dates and JSON values, for client components.
 */
export function toPlain<T>(doc: unknown): T {
  return JSON.parse(JSON.stringify(doc)) as T;
}
