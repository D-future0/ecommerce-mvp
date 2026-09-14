/**
 * Server Components can't pass Mongoose documents (ObjectId, Date, methods)
 * straight through — this strips them down to plain serializable JSON.
 */
export function toPlain<T>(doc: unknown): T {
  return JSON.parse(JSON.stringify(doc)) as T;
}
