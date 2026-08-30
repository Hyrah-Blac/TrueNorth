import "server-only";
import { AI_TOOL_NAMES } from "@/database/constants/ai";
import { searchAircraftForAI } from "@/lib/ai/services/aircraft.service";
import { searchAirportsForAI, getAirportByCodeForAI, findNearbyAirportsForAI } from "@/lib/ai/services/airport.service";
import { searchKnowledgeForAI } from "@/lib/ai/services/knowledge.service";
import { getCompanyInfoForAI } from "@/lib/ai/services/company.service";
import { submitQuoteRequestForAI } from "@/lib/ai/services/quote.service";
import { recordToolUsage } from "@/lib/ai/analytics";
import { logger } from "@/lib/logging/logger";
import { OBJECT_ID_REGEX } from "@/utils/validators";
import type { AiToolName } from "@/database/constants/ai";
import type { AircraftCategory } from "@/database/constants/aircraft";
import type { MissionType } from "@/database/constants/mission-type";

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

/** A Mongo ObjectId string, e.g. an Aircraft `_id` from search_aircraft results. */
function safeObjectId(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return OBJECT_ID_REGEX.test(trimmed) ? trimmed : undefined;
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

  const result = await resolveTool(name, args);

  const isErrorResult = typeof result === "object" && result !== null && "error" in result;
  if (!isErrorResult) {
    void recordToolUsage(name);
  }

  return result;
}

async function resolveTool(name: AiToolName, args: Record<string, unknown>): Promise<unknown> {
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

    case AI_TOOL_NAMES.FIND_NEARBY_AIRPORTS: {
      const referenceCode = safeString(args.referenceCode, 10);
      if (!referenceCode) return [];
      const radiusKm = safePositiveNumber(args.radiusKm) ?? 150;
      return findNearbyAirportsForAI(referenceCode, Math.min(radiusKm, 500));
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

    case AI_TOOL_NAMES.SUBMIT_QUOTE_REQUEST: {
      // Sanitize/coerce only — no hardcoded "required field" gate here.
      // `createQuoteSchema` (the same schema the website's charter
      // request form validates against) is the single source of truth
      // for what's required; submitQuoteRequestForAI runs the request
      // through it and returns structured fieldErrors on failure so the
      // model can ask the user for whatever's missing or invalid,
      // instead of the executor guessing at a field list up front.
      return submitQuoteRequestForAI({
        customerName: safeString(args.customerName, 100),
        customerEmail: safeString(args.customerEmail, 200),
        customerPhone: safeString(args.customerPhone, 20),
        customerCompany: safeString(args.customerCompany, 100),
        departureAirportCode: safeString(args.departureAirportCode, 4),
        destinationAirportCode: safeString(args.destinationAirportCode, 4),
        departureDate: safeString(args.departureDate, 32),
        returnDate: safeString(args.returnDate, 32),
        isRoundTrip: safeBoolean(args.isRoundTrip),
        passengerCount: safePositiveNumber(args.passengerCount),
        missionType: safeEnum<MissionType>(args.missionType, MISSION_TYPE_VALUES),
        aircraftPreference: safeObjectId(args.aircraftPreference),
        budgetRangeMin: safePositiveNumber(args.budgetRangeMin),
        budgetRangeMax: safePositiveNumber(args.budgetRangeMax),
        specialRequests: safeString(args.specialRequests, 2000),
        hasMedicalEquipment: safeBoolean(args.hasMedicalEquipment),
        medicalEquipmentDetails: safeString(args.medicalEquipmentDetails, 1000),
        hasVipRequirements: safeBoolean(args.hasVipRequirements),
        vipRequirementsDetails: safeString(args.vipRequirementsDetails, 1000),
        hasCargo: safeBoolean(args.hasCargo),
        cargoDetails: safeString(args.cargoDetails, 1000),
        hasPets: safeBoolean(args.hasPets),
        petsDetails: safeString(args.petsDetails, 500),
        hasDangerousGoods: safeBoolean(args.hasDangerousGoods),
        dangerousGoodsDetails: safeString(args.dangerousGoodsDetails, 1000),
      });
    }

    default: {
      // This branch should be unreachable if tool definitions and the
      // AiToolName type are kept in sync. Log it clearly if it fires.
      logger.error("Unknown AI tool name received from model", { name });
      return { error: `Unknown tool: ${String(name)}` };
    }
  }
}