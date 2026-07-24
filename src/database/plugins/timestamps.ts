import type { Schema } from "mongoose";

/**
 * Ensures createdAt/updatedAt are enabled with consistent field names.
 * Kept as an explicit plugin (rather than only the schema option) so
 * every model in the codebase applies it the same way.
 */
export function timestampsPlugin(schema: Schema): void {
  schema.set("timestamps", { createdAt: "createdAt", updatedAt: "updatedAt" });
}
