import "server-only";
import { createCompletion } from "./client";
import { buildSystemPrompt } from "./prompts/system";
import { AI_TOOL_DEFINITIONS } from "./tools/definitions";
import { executeTool } from "./tools/executor";
import {
  findOrCreateConversation,
  getConversationHistory,
  saveUserMessage,
  saveAssistantMessage,
  formatHistoryForPrompt,
} from "./conversation";
import { MESSAGE_ROLES, AI_MODELS } from "@/database/constants/ai";
import { logger } from "@/lib/logging/logger";
import { sanitizePlainText } from "@/utils/validators";
import type { AiModel, AiToolName } from "@/database/constants/ai";
import type { IMessage, ITokenUsage, IToolCall, ChatResponse, OpenRouterMessage } from "@/types/ai";

// ── Constants ─────────────────────────────────────────────────────────────────

/** Maximum tool calls per turn. Prevents infinite agentic loops. */
const MAX_TOOL_CALLS_PER_TURN = 5;

/** Fallback content when the model returns an empty response. */
const FALLBACK_RESPONSE =
  "I'm sorry, I wasn't able to generate a response. Please try again.";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface RunChatParams {
  userMessage: string;
  conversationId?: string;
  sessionId: string;
  clerkUserId?: string;
  model?: AiModel;
}

// ── Tool message wire type (OpenRouter extension, not in public IMessage) ──────

interface ToolResultMessage {
  role: "tool";
  tool_call_id: string;
  name: string;
  content: string;
}

// ── Orchestration ─────────────────────────────────────────────────────────────

/**
 * Core chat orchestration. This is the only public entry point for AI
 * chat — the API route calls this; nothing else should.
 *
 * Flow:
 *   1. Resolve or create conversation
 *   2. Persist the user message
 *   3. Build the full prompt (system + history + user turn)
 *   4. Call OpenRouter via the centralised client
 *   5. Execute tool calls (capped at MAX_TOOL_CALLS_PER_TURN)
 *   6. Re-prompt the model with tool results
 *   7. Persist and return the final assistant message
 */
export async function runChat(params: RunChatParams): Promise<ChatResponse> {
  const model = params.model ?? AI_MODELS.DEFAULT;

  // Sanitize user input before any persistence or prompt injection
  const sanitizedMessage = sanitizePlainText(params.userMessage);
  if (!sanitizedMessage) {
    throw new Error("Message cannot be empty after sanitization");
  }

  // 1. Resolve conversation
  const conversation = await findOrCreateConversation({
    conversationId: params.conversationId,
    sessionId: params.sessionId,
    clerkUserId: params.clerkUserId,
    model,
  });

  const conversationId = String(conversation._id);

  // 2. Persist user message
  await saveUserMessage(conversationId, sanitizedMessage);

  // 3. Build prompt — system prompt and history fetched in parallel
  const [systemPrompt, history] = await Promise.all([
    buildSystemPrompt(),
    getConversationHistory(conversationId, 20),
  ]);

  // The history contains the user message we just saved. Remove it —
  // we add it explicitly so it is always the final message in the array.
  const priorHistory = history.slice(0, -1);

  const messages: OpenRouterMessage[] = [
    { role: MESSAGE_ROLES.SYSTEM, content: systemPrompt },
    ...formatHistoryForPrompt(priorHistory),
    { role: MESSAGE_ROLES.USER, content: sanitizedMessage },
  ];

  // 4. First completion
  const { response: firstResponse, latencyMs: firstLatency } = await createCompletion({
    model,
    messages,
    tools: AI_TOOL_DEFINITIONS,
    temperature: 0.7,
    maxTokens: 1024,
  });

  const firstChoice = firstResponse.choices[0];
  // client.ts already validates choices.length > 0, so this is a
  // belt-and-suspenders guard against a race at the type boundary.
  if (!firstChoice) {
    throw new Error("OpenRouter returned no choices — this should have been caught in client.ts");
  }

  const toolCallsData: IToolCall[] = [];
  let finalContent: string;
  let finalLatencyMs = firstLatency;
  let finalUsage: ITokenUsage | undefined;

  // 5+6. Tool execution + second completion
  if (
    firstChoice.finish_reason === "tool_calls" &&
    firstChoice.message.tool_calls?.length
  ) {
    // Cap the number of tool calls to prevent runaway cost in edge cases
    // where the model requests more tools than intended.
    const requestedCalls = firstChoice.message.tool_calls.slice(0, MAX_TOOL_CALLS_PER_TURN);

    if (firstChoice.message.tool_calls.length > MAX_TOOL_CALLS_PER_TURN) {
      logger.warn("Model requested more tool calls than allowed; truncating", {
        requested: firstChoice.message.tool_calls.length,
        allowed: MAX_TOOL_CALLS_PER_TURN,
      });
    }

    // Build the thread: original messages + assistant's tool-call turn
    // Using a wider type here because "tool" role is an OpenRouter
    // extension not included in our public OpenRouterMessage union.
    const extendedMessages: Array<OpenRouterMessage | ToolResultMessage> = [
      ...messages,
      {
        role: MESSAGE_ROLES.ASSISTANT,
        content: firstChoice.message.content ?? "",
      },
    ];

    // Execute all tool calls in parallel, collecting results.
    // Promise.allSettled ensures one failed tool doesn't block the others.
    const settled = await Promise.allSettled(
      requestedCalls.map(async (tc) => {
        const toolName = tc.function.name as AiToolName;

        let parsedArgs: Record<string, unknown> = {};
        try {
          parsedArgs = JSON.parse(tc.function.arguments) as Record<string, unknown>;
        } catch {
          logger.warn("Failed to parse tool arguments — using empty args", {
            tool: toolName,
            raw: tc.function.arguments,
          });
        }

        let result: unknown;
        try {
          result = await executeTool(toolName, parsedArgs);
        } catch (toolError) {
          logger.error("Tool execution error", { tool: toolName, error: String(toolError) });
          // Return a structured error the model can reason about rather
          // than letting the entire request fail.
          result = { error: "Tool execution failed. No data available for this query." };
        }

        toolCallsData.push({ name: toolName, arguments: parsedArgs, result });

        return { id: tc.id, name: toolName, result };
      })
    );

    // Append each tool result message to the thread.
    // Fulfilled and rejected results are both handled — a rejected
    // Promise.allSettled result means our own error handler above
    // threw, which should not normally happen given the try/catch.
    for (const s of settled) {
      if (s.status === "fulfilled") {
        const { id, name, result } = s.value;
        const toolResultMsg: ToolResultMessage = {
          role: "tool",
          tool_call_id: id,
          name,
          // Tool content must be a string per OpenRouter spec
          content: JSON.stringify(result),
        };
        extendedMessages.push(toolResultMsg);
      } else {
        logger.error("Unexpected tool settlement failure", { reason: String(s.reason) });
      }
    }

    // Second completion — model reasons over the tool results
    const { response: secondResponse, latencyMs: secondLatency } = await createCompletion({
      model,
      messages: extendedMessages as OpenRouterMessage[],
      // No tools on the second call — the model should compose its
      // final answer now, not request more tool calls.
      temperature: 0.7,
      maxTokens: 1024,
    });

    const secondChoice = secondResponse.choices[0];
    finalContent = secondChoice?.message.content?.trim() || FALLBACK_RESPONSE;
    finalLatencyMs = firstLatency + secondLatency;

    if (secondResponse.usage) {
      finalUsage = mapUsage(secondResponse.usage);
    }
  } else {
    finalContent = firstChoice.message.content?.trim() || FALLBACK_RESPONSE;

    if (firstResponse.usage) {
      finalUsage = mapUsage(firstResponse.usage);
    }
  }

  // 7. Persist the assistant message with telemetry
  const assistantMessage = await saveAssistantMessage(conversationId, finalContent, {
    toolCalls: toolCallsData,
    tokenUsage: finalUsage,
    latencyMs: finalLatencyMs,
  });

  const messageOut: IMessage = {
    _id: String(assistantMessage._id),
    conversationId,
    role: "assistant",
    content: finalContent,
    toolCalls: toolCallsData,
    tokenUsage: finalUsage,
    latencyMs: finalLatencyMs,
    createdAt: new Date(assistantMessage.createdAt).toISOString(),
    updatedAt: new Date(assistantMessage.updatedAt).toISOString(),
  };

  return {
    conversationId,
    sessionId: params.sessionId,
    message: messageOut,
    tokenUsage: finalUsage,
  };
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function mapUsage(usage: {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
}): ITokenUsage {
  return {
    promptTokens: usage.prompt_tokens,
    completionTokens: usage.completion_tokens,
    totalTokens: usage.total_tokens,
  };
}
