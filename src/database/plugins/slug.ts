import type { Schema, Document, Model } from "mongoose";

interface SlugPluginOptions {
  /** Field the slug is derived from, e.g. "name" */
  source: string;
  /** Field the slug is stored in. Defaults to "slug". */
  field?: string;
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Generates a unique, URL-safe slug from `source` whenever it changes,
 * appending -1, -2, etc. on collision. Attach with:
 *   schema.plugin(slugPlugin, { source: "name" });
 */
export function slugPlugin(schema: Schema, options: SlugPluginOptions): void {
  const { source, field = "slug" } = options;

  schema.add({
    [field]: { type: String, unique: true, index: true, trim: true },
  });

  schema.pre(
    "validate",
    async function (this: Document & Record<string, unknown>, next) {
      const sourceValue = this[source];

      if (!this.isModified(source) && this[field]) {
        return next();
      }

      const base = slugify(String(sourceValue ?? ""));
      if (!base) return next();

      const ModelCtor = this.constructor as Model<Document>;
      let candidate = base;
      let counter = 1;

      while (await ModelCtor.exists({ [field]: candidate, _id: { $ne: this._id } })) {
        candidate = `${base}-${counter}`;
        counter += 1;
      }

      this[field] = candidate;
      next();
    }
  );
}
