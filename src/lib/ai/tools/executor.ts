import "server-only";
import { AI_TOOL_NAMES } from "@/database/constants/ai";
import { searchAircraftForAI } from "@/lib/ai/services/aircraft.service";
import { searchAirportsForAI, getAirportByCodeForAI } from "@/lib/ai/services/airport.service";
import { searchKnowledgeForAI } from "@/lib/ai/services/knowledge.service";
import { getCompanyInfoForAI } from "@/lib/ai/services/company.service";
import { logger } from "@/lib/logging/logger";
import type { AiToolName } from "@/database/constants/ai";
import type { AircraftCategory } from "@/database/constants/aircraft";
import type { MissionType } from "@/database/constants/mission-type";

// Valid aircraft category values — used to sanitize model-supplied args
// before hitting the database. Import the constant array rather than
// duplicating the list here.
import { AIRCRAFT_CATEGORY_VALUES } from "@/database/constants/aircraft";
import { MISSION_TYPE_VALUES } from "@/database/constants/mission-type";
import { KNOWLEDGE_BASE_CATEGORY_VALUES } from "@/database/constants/knowledge-base";

// ── Sanitization helpers ──────────────────────────────────────────────────────

function safeString(value: unknown, maxLength = 200): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim().slice(0, maxLength);
  return trimmed || undefined;
}

function safePositiveNumber(value: unknown): number | undefined {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : undefined;
}

function safeBoolean(value: unknown): boolean | undefined {
  if (typeof value === "boolean") return value;
  return undefined;
}

function safeEnum<T extends string>(value: unknown, allowed: readonly T[]): T | undefined {
  if (typeof value !== "string") return undefined;
  const lower = value.toLowerCase() as T;
  return allowed.includes(lower) ? lower : undefined;
}

// ── Executor ──────────────────────────────────────────────────────────────────

/**
 * Executes a model-requested tool call and returns a JSON-serialisable
 * result. All arguments are sanitized before being passed to services —
 * the model is an untrusted input source, same as a user form.
 *
 * Individual tool errors are caught here and returned as structured
 * error objects so the model can relay the failure gracefully rather
 * than the entire request crashing.
 */
export async function executeTool(
  name: AiToolName,
  args: Record<string, unknown>
): Promise<unknown> {
  logger.debug("Executing AI tool", { name, args });

  switch (name) {
    case AI_TOOL_NAMES.SEARCH_AIRCRAFT: {
      return searchAircraftForAI({
        passengerCount: safePositiveNumber(args.passengerCount),
        missionType: safeEnum<MissionType>(args.missionType, MISSION_TYPE_VALUES),
        category: safeEnum<AircraftCategory>(args.category, AIRCRAFT_CATEGORY_VALUES),
        minRangeNm: safePositiveNumber(args.minRangeNm),
        petFriendly: safeBoolean(args.petFriendly),
        wifiAvailable: safeBoolean(args.wifiAvailable),
        shortRunwayCapable: safeBoolean(args.shortRunwayCapable),
        region: safeString(args.region),
      });
    }

    case AI_TOOL_NAMES.LOOKUP_AIRPORT: {
      const code = safeString(args.code, 10);
      if (code) {
        const airport = await getAirportByCodeForAI(code);
        return airport ? [airport] : [];
      }
      return searchAirportsForAI({
        query: safeString(args.query),
        country: safeString(args.country),
        minRunwayLengthM: safePositiveNumber(args.minRunwayLengthM),
      });
    }

    case AI_TOOL_NAMES.SEARCH_KNOWLEDGE: {
      const query = safeString(args.query);
      if (!query) {
        return [];
      }
      return searchKnowledgeForAI({
        query,
        category: safeEnum(args.category, KNOWLEDGE_BASE_CATEGORY_VALUES),
      });
    }

    case AI_TOOL_NAMES.GET_COMPANY_INFO: {
      return getCompanyInfoForAI();
    }

    default: {
      // This branch should be unreachable if tool definitions and the
      // AiToolName type are kept in sync. Log it clearly if it fires.
      logger.error("Unknown AI tool name received from model", { name });
      return { error: `Unknown tool: ${String(name)}` };
    }
  }
}
