import "server-only";
import connectToDatabase from "@/database/connection";
import KnowledgeBase from "@/database/models/KnowledgeBase";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface KnowledgeEntry {
  _id: string;
  title: string;
  slug: string;
  category: string;
  /** Full content for search results; truncated in system prompt injection. */
  content: string;
  keywords: string[];
  priority: number;
}

export interface KnowledgeSearchParams {
  query?: string;
  category?: string;
  limit?: number;
}

// Projection — excludes visibility, status, lastReviewedAt, timestamps
const AI_PROJECTION = {
  title: 1,
  slug: 1,
  category: 1,
  content: 1,
  keywords: 1,
  priority: 1,
} as const;

// ── Queries ───────────────────────────────────────────────────────────────────

/**
 * Full-text search over published public knowledge base entries.
 * Returns full content so the model can reason over the complete answer.
 */
export async function searchKnowledgeForAI(
  params: KnowledgeSearchParams = {}
): Promise<KnowledgeEntry[]> {
  await connectToDatabase();

  if (!params.query && !params.category) {
    // Neither query nor category — return top-priority entries rather
    // than an unfiltered dump of the entire knowledge base.
    return getFeaturedKnowledgeForAI(params.limit ?? 5);
  }

  const filter: Record<string, unknown> = {
    status: "published",
    visibility: "public",
  };

  if (params.query) filter.$text = { $search: params.query };
  if (params.category) filter.category = params.category;

  const limit = Math.min(params.limit ?? 5, 10);

  const items = await KnowledgeBase.find(filter, AI_PROJECTION)
    .sort({ priority: -1, updatedAt: -1 })
    .limit(limit)
    .lean();

  return items.map(toKnowledgeEntry);
}

/**
 * Returns featured published entries sorted by priority.
 * Used to prime the system prompt with the most curated content.
 */
export async function getFeaturedKnowledgeForAI(limit = 6): Promise<KnowledgeEntry[]> {
  await connectToDatabase();

  const safeLimit = Math.min(limit, 10);

  const items = await KnowledgeBase.find(
    { status: "published", visibility: "public", isFeatured: true },
    AI_PROJECTION
  )
    .sort({ priority: -1 })
    .limit(safeLimit)
    .lean();

  return items.map(toKnowledgeEntry);
}

// ── Mapping ───────────────────────────────────────────────────────────────────

function toKnowledgeEntry(k: Record<string, unknown>): KnowledgeEntry {
  return {
    _id: String(k._id),
    title: String(k.title),
    slug: String(k.slug),
    category: String(k.category),
    content: String(k.content),
    keywords: (k.keywords as string[]) ?? [],
    priority: Number(k.priority ?? 0),
  };
}
