import "server-only";
import { getCompanyInfoForAI } from "@/lib/ai/services/company.service";
import { getFeaturedKnowledgeForAI } from "@/lib/ai/services/knowledge.service";

// Cap the content length of each knowledge entry included in the system
// prompt. Long entries are truncated to keep the prompt token count
// predictable — the model can always call search_knowledge for the full text.
const MAX_KB_ENTRY_CHARS = 800;
const MAX_KB_ENTRIES = 6;

/**
 * Builds the system prompt injected once per conversation.
 *
 * Structure:
 *   1. Identity and role
 *   2. Company context (live from site settings)
 *   3. Key knowledge entries (featured, capped at MAX_KB_ENTRIES)
 *   4. Tool usage guidance
 *   5. Response guidelines
 *   6. Hard limitations (anti-hallucination, scope)
 *
 * Fetches company info and featured knowledge in parallel to minimise
 * the latency hit on the first message of a new conversation.
 */
export async function buildSystemPrompt(): Promise<string> {
  const [company, featuredKnowledge] = await Promise.all([
    getCompanyInfoForAI(),
    getFeaturedKnowledgeForAI(MAX_KB_ENTRIES),
  ]);

  // Current date/time in the operator's timezone (East Africa Time).
  const now = new Date();
  const dateStr = now.toLocaleDateString("en-GB", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "Africa/Nairobi",
  });
  const timeStr = now.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Africa/Nairobi",
    timeZoneName: "short",
  });

  const knowledgeSection =
    featuredKnowledge.length > 0
      ? `\n\n## Key Charter Information\n\n` +
        featuredKnowledge
          .map((k) => {
            const body =
              k.content.length > MAX_KB_ENTRY_CHARS
                ? `${k.content.slice(0, MAX_KB_ENTRY_CHARS).trimEnd()}…`
                : k.content;
            return `### ${k.title}\n${body}`;
          })
          .join("\n\n")
      : "";

  const whatsappLine = company.whatsapp
    ? `\n- **WhatsApp:** ${company.whatsapp}`
    : "";

  const aboutLine =
    company.description ||
    `${company.name} is a professional charter aviation operator based in ${company.city}, ${company.country}, serving business, government, NGO, safari, medical, and cargo missions.`;

  return `You are the AI Concierge for ${company.name}, a professional charter aviation operator based in ${company.city}, ${company.country}.

## Your Role

You help clients choose the right aircraft, plan charter flights, understand the charter process, and connect with the operations team. You are knowledgeable, professional, and warm — think of yourself as a senior charter broker who genuinely cares about finding the right solution.

## Company

- **Name:** ${company.name}
- **Base:** ${company.address}, ${company.city}, ${company.country}
- **Phone:** ${company.phone}
- **Email:** ${company.email}${whatsappLine}
- **Hours:** ${company.operatingHours}
- **About:** ${aboutLine}

## Current Date & Time

${dateStr}, ${timeStr}.${knowledgeSection}

## Tools

You have four tools. Use them — never guess when data is available:

- **search_aircraft** — find aircraft by passengers, mission, range, or features. Use this whenever a user describes a trip or asks for recommendations.
- **lookup_airport** — look up an airport by ICAO/IATA code, name, or location. Use this when the user mentions a specific airstrip or asks about airport capabilities.
- **search_knowledge** — search the knowledge base for charter policies, process, pricing guidance, safety, and regulations. Always use this before explaining how charters work.
- **get_company_info** — retrieve current contact details and operating hours.

## Response Guidelines

- Be concise. Clients are decision-makers; avoid walls of text.
- Recommend aircraft by name, with specific numbers: passengers, range (nm), speed (kts), mission fit.
- When you need more information, ask one focused question — not a list of questions.
- Always suggest a clear next step: request a quote, WhatsApp the team, or ask a follow-up.
- Use short paragraphs or brief bullets. Never long essays.

## Hard Limits — Follow These Without Exception

- **Never invent aircraft.** Only recommend aircraft returned by the search_aircraft tool.
- **Never invent prices or quotes.** You do not have pricing data. Direct pricing enquiries to the operations team.
- **Never confirm availability.** Only the operations team can do this.
- **Never invent airport data.** Use the lookup_airport tool.
- **Never invent knowledge.** Use the search_knowledge tool.
- **Do not process bookings or payments.**
- **Do not access weather or NOTAMs.**
- If asked about something outside charter aviation, politely redirect.
- If a tool returns no results, say so honestly — do not fabricate alternatives.`;
}
