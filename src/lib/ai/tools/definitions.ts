import { AI_TOOL_NAMES } from "@/database/constants/ai";
import { MISSION_TYPE_VALUES, MISSION_TYPE_LABELS } from "@/database/constants/mission-type";
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
        "Always call this before recommending any aircraft or before submitting a quote request " +
        "so the recommendation is grounded in real fleet data. " +
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
        "runway length, available services, or whether a destination can be reached by air. " +
        "Always look up both the departure and destination airports before recommending " +
        "aircraft or submitting a quote request.",
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
      name: AI_TOOL_NAMES.FIND_NEARBY_AIRPORTS,
      description:
        "Find real airports geographically near a known airport, by actual coordinate distance. " +
        "Use this when a specific airport can't handle the flight (e.g. runway too short, closed at " +
        "night, no customs) or when the user asks for alternatives near somewhere already looked up. " +
        "Requires a reference airport that has already been found via lookup_airport — do not guess " +
        "a code. Returns real airports only; an empty result means none exist within range.",
      parameters: {
        type: "object",
        properties: {
          referenceCode: {
            type: "string",
            description: "ICAO or IATA code of the known reference airport to search near.",
          },
          radiusKm: {
            type: "number",
            description: "Search radius in kilometres. Defaults to 150.",
          },
        },
        required: ["referenceCode"],
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
  {
    type: "function",
    function: {
      name: AI_TOOL_NAMES.SUBMIT_QUOTE_REQUEST,
      description:
        "Submit a charter quotation request on behalf of the user, through the exact same " +
        "quotation pipeline the website's charter request form uses — it creates a real Quote, " +
        "triggers the normal admin notification, and appears in quote management like any other quote. " +
        "Call this only after: (1) both departure and destination airports have been looked up " +
        "via lookup_airport, (2) suitable aircraft have been found via search_aircraft, " +
        "(3) an aircraft has been recommended to the user, and (4) every required field below has " +
        "been confirmed by the user. Do not call this tool speculatively, with guessed values, or " +
        "before the user has confirmed the trip details — if a required field is still unknown, ask " +
        "the user for it instead of calling this tool. On success, returns the real quote reference " +
        "number generated by the quotation system; never state a reference number that didn't come " +
        "from this tool's result. On failure, returns structured field errors — relay what's wrong " +
        "in plain language and ask the user to correct it, rather than retrying with guesses.",
      parameters: {
        type: "object",
        properties: {
          customerName: {
            type: "string",
            description: "Full name of the person requesting the quote.",
          },
          customerEmail: {
            type: "string",
            description: "Email address for the quotation response.",
          },
          customerPhone: {
            type: "string",
            description: "Contact phone number, including country code, e.g. +254712345678.",
          },
          customerCompany: {
            type: "string",
            description: "Company or organisation name, if the user mentions one.",
          },
          departureAirportCode: {
            type: "string",
            description: "Departure airport ICAO or IATA code, exactly as confirmed by lookup_airport.",
          },
          destinationAirportCode: {
            type: "string",
            description: "Destination airport ICAO or IATA code, exactly as confirmed by lookup_airport.",
          },
          departureDate: {
            type: "string",
            description: "Intended departure date in YYYY-MM-DD format. Must not be in the past.",
          },
          isRoundTrip: {
            type: "boolean",
            description: "True if this is a round trip.",
          },
          returnDate: {
            type: "string",
            description: "Return date in YYYY-MM-DD format. Required if isRoundTrip is true.",
          },
          passengerCount: {
            type: "number",
            description: "Number of passengers travelling.",
          },
          missionType: {
            type: "string",
            description:
              "Purpose of the charter. One of: " +
              MISSION_TYPE_VALUES.map((value) => `${value} (${MISSION_TYPE_LABELS[value]})`).join(", ") +
              ". Ask the user if it isn't obvious from context.",
            enum: [...MISSION_TYPE_VALUES],
          },
          aircraftPreference: {
            type: "string",
            description:
              "The _id of the specific aircraft the user has confirmed interest in, copied exactly " +
              "from a prior search_aircraft result. Omit if no specific aircraft was confirmed.",
          },
          budgetRangeMin: {
            type: "number",
            description: "Minimum budget, only if the user has volunteered one.",
          },
          budgetRangeMax: {
            type: "number",
            description: "Maximum budget, only if the user has volunteered one.",
          },
          specialRequests: {
            type: "string",
            description: "Any additional requirements or special requests from the user.",
          },
          hasMedicalEquipment: {
            type: "boolean",
            description: "True if the trip requires medical equipment on board.",
          },
          medicalEquipmentDetails: {
            type: "string",
            description: "Details of the required medical equipment, if hasMedicalEquipment is true.",
          },
          hasVipRequirements: {
            type: "boolean",
            description: "True if the user has VIP or special-handling requirements.",
          },
          vipRequirementsDetails: {
            type: "string",
            description: "Details of the VIP requirements, if hasVipRequirements is true.",
          },
          hasCargo: {
            type: "boolean",
            description: "True if cargo is being transported alongside or instead of passengers.",
          },
          cargoDetails: {
            type: "string",
            description: "Details of the cargo, if hasCargo is true.",
          },
          hasPets: {
            type: "boolean",
            description: "True if any passengers are travelling with a pet.",
          },
          petsDetails: {
            type: "string",
            description: "Details about the pet(s) — species, size, etc., if hasPets is true.",
          },
          hasDangerousGoods: {
            type: "boolean",
            description: "True if dangerous goods are being transported.",
          },
          dangerousGoodsDetails: {
            type: "string",
            description: "Details of the dangerous goods, if hasDangerousGoods is true.",
          },
        },
        required: [
          "customerName",
          "customerEmail",
          "customerPhone",
          "departureAirportCode",
          "destinationAirportCode",
          "departureDate",
          "passengerCount",
          "missionType",
        ],
      },
    },
  },
];

/**
 * Human-readable, tool-aware loading labels shown while each tool runs
 * (see chat.service.ts's streaming emission). Colocated with the tool
 * definitions themselves so a new tool and its label can't drift apart.
 */
export const TOOL_STATUS_LABELS: Record<string, string> = {
  [AI_TOOL_NAMES.SEARCH_AIRCRAFT]: "Searching aircraft…",
  [AI_TOOL_NAMES.LOOKUP_AIRPORT]: "Looking up airports…",
  [AI_TOOL_NAMES.FIND_NEARBY_AIRPORTS]: "Finding nearby airports…",
  [AI_TOOL_NAMES.SEARCH_KNOWLEDGE]: "Searching our knowledge base…",
  [AI_TOOL_NAMES.GET_COMPANY_INFO]: "Retrieving contact details…",
  [AI_TOOL_NAMES.SUBMIT_QUOTE_REQUEST]: "Preparing your quotation…",
};