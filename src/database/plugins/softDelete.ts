import type { Schema, Query, Document } from "mongoose";

export interface SoftDeleteFields {
  isDeleted: boolean;
  deletedAt: Date | null;
}

export interface SoftDeleteMethods<T> {
  softDelete: () => Promise<T>;
  restore: () => Promise<T>;
}

/**
 * Adds isDeleted/deletedAt fields, softDelete()/restore() instance methods,
 * and transparently excludes soft-deleted documents from all find queries.
 *
 * Pass `{ includeDeleted: true }` in a query filter to bypass the exclusion,
 * e.g. Model.find({ includeDeleted: true }) for admin "trash" views.
 */
export function softDeletePlugin(schema: Schema): void {
  schema.add({
    isDeleted: { type: Boolean, default: false, index: true },
    deletedAt: { type: Date, default: null },
  });

  schema.methods.softDelete = function softDelete(this: Document & SoftDeleteFields) {
    this.isDeleted = true;
    this.deletedAt = new Date();
    return this.save();
  };

  schema.methods.restore = function restore(this: Document & SoftDeleteFields) {
    this.isDeleted = false;
    this.deletedAt = null;
    return this.save();
  };

  function excludeDeleted(this: Query<unknown, unknown>, next: () => void) {
    const filter = this.getFilter() as Record<string, unknown>;

    if (filter.includeDeleted) {
      delete filter.includeDeleted;
    } else if (filter.isDeleted === undefined) {
      this.where({ isDeleted: { $ne: true } });
    }

    next();
  }

  schema.pre(/^find/, excludeDeleted);
  schema.pre("countDocuments", excludeDeleted);
}
