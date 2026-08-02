import { AI_TOOL_NAMES } from "@/database/constants/ai";
import type { AiToolDefinition } from "@/types/ai";

/**
 * Tool definitions sent to OpenRouter with every chat completion.
 * Each tool maps to a handler in tools/executor.ts — keep both in sync.
 *
 * Descriptions are written for the model, not for developers: they
 * describe *when* the model should use the tool and what it returns,
 * so the model can make a good routing decision.
 */
export const AI_TOOL_DEFINITIONS: AiToolDefinition[] = [
  {
    type: "function",
    function: {
      name: AI_TOOL_NAMES.SEARCH_AIRCRAFT,
      description:
        "Search the charter fleet for aircraft that match the user's requirements. " +
        "Use this whenever the user mentions passengers, distance, mission type, " +
        "aircraft features (pet-friendly, Wi-Fi, short runway), or asks for recommendations. " +
        "Returns a list of matching aircraft with specifications and AI insights.",
      parameters: {
        type: "object",
        properties: {
          passengerCount: {
            type: "number",
            description: "Minimum number of passengers the aircraft must seat.",
          },
          missionType: {
            type: "string",
            description:
              "Type of charter mission. Examples: safari, medevac, cargo, business, leisure.",
          },
          category: {
            type: "string",
            description:
              "Aircraft category filter. One of: helicopter, turboprop, light_jet, " +
              "midsize_jet, heavy_jet, utility, cargo.",
          },
          minRangeNm: {
            type: "number",
            description: "Minimum required range in nautical miles.",
          },
          petFriendly: {
            type: "boolean",
            description: "Set true if the user needs to travel with a pet.",
          },
          wifiAvailable: {
            type: "boolean",
            description: "Set true if the user requires in-flight Wi-Fi.",
          },
          shortRunwayCapable: {
            type: "boolean",
            description:
              "Set true if the destination has a short or unpaved airstrip.",
          },
          region: {
            type: "string",
            description:
              "Geographic region filter, e.g. Kenya, Tanzania, East Africa.",
          },
        },
        required: [],
      },
    },
  },
  {
    type: "function",
    function: {
      name: AI_TOOL_NAMES.LOOKUP_AIRPORT,
      description:
        "Look up an airport or airstrip by ICAO code, IATA code, name, or location. " +
        "Use this when the user asks about a specific airport, airstrip capabilities, " +
        "runway length, available services, or whether a destination can be reached by air.",
      parameters: {
        type: "object",
        properties: {
          code: {
            type: "string",
            description:
              "ICAO code (4 letters, e.g. HKWL) or IATA code (3 letters, e.g. WIL).",
          },
          query: {
            type: "string",
            description:
              "Free-text search: airport name, city, or region. Use when no code is known.",
          },
          country: {
            type: "string",
            description: "Country to filter results, e.g. Kenya.",
          },
          minRunwayLengthM: {
            type: "number",
            description:
              "Minimum runway length in metres required by the user's aircraft.",
          },
        },
        required: [],
      },
    },
  },
  {
    type: "function",
    function: {
      name: AI_TOOL_NAMES.SEARCH_KNOWLEDGE,
      description:
        "Search the charter knowledge base for information about the charter process, " +
        "pricing, safety, regulations, aircraft selection guidance, medical flights, " +
        "safari charters, or any other charter-related topic. " +
        "Use this before answering any question about how charters work, " +
        "what to expect, or company policies.",
      parameters: {
        type: "object",
        properties: {
          query: {
            type: "string",
            description:
              "The topic or question to search for in the knowledge base.",
          },
          category: {
            type: "string",
            description:
              "Optional category filter. One of: charter_process, aircraft_selection, " +
              "airports_routes, pricing_payment, safety_regulations, medical_medevac, " +
              "safari_tourism, cargo, general.",
          },
        },
        required: ["query"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: AI_TOOL_NAMES.GET_COMPANY_INFO,
      description:
        "Retrieve current company contact information, operating hours, address, " +
        "and general company details. Use this when the user asks about how to get " +
        "in touch, office location, opening hours, or anything about the company itself.",
      parameters: {
        type: "object",
        properties: {},
        required: [],
      },
    },
  },
];
