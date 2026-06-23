import { NextRequest, NextResponse } from "next/server";
import type Anthropic from "@anthropic-ai/sdk";
import { requireSession } from "@/lib/api-auth";
import { anthropic, ASSISTANT_MODEL } from "@/lib/anthropic";
import { ASSISTANT_TOOLS, executeAssistantTool } from "@/lib/assistant-tools";
import { prisma } from "@/lib/prisma";

const MAX_TOOL_LOOPS = 5;

export async function POST(request: NextRequest) {
  const auth = await requireSession();
  if (auth.response) return auth.response;

  const body = await request.json().catch(() => null);
  const incoming = Array.isArray(body?.messages) ? body.messages : null;
  if (!incoming || incoming.length === 0) {
    return NextResponse.json({ error: "messages is required" }, { status: 400 });
  }

  const household = await prisma.household.findUnique({ where: { id: auth.session.householdId } });

  const systemPrompt = `You are the FamilyBrain assistant for ${household?.name ?? "this household"}. The current date and time is ${new Date().toISOString()}. You're talking to ${auth.session.name}. Be warm and concise, and confirm what you've done after taking an action. You can add calendar events, shopping items, renewals/bills, emergency contacts, manual expense log entries, and savings goals, generate a 7-day meal plan, and check today's briefing. Transactions and goals you log are manual records, not real bank payments. You cannot delete anything, move real money, or edit medical records — tell the user to do that from the dashboard if they ask.

Default to acting in one step rather than asking clarifying questions. If an end time isn't given, assume the event lasts 1 hour. If a year isn't given, assume the next upcoming occurrence of that date. Only ask a follow-up question when the request is genuinely ambiguous (e.g. no date at all).`;

  const messages: Anthropic.MessageParam[] = incoming.map((m: { role: string; content: string }) => ({
    role: m.role === "assistant" ? "assistant" : "user",
    content: m.content,
  }));

  const actions: { tool: string; result: unknown }[] = [];

  let response = await anthropic.messages.create({
    model: ASSISTANT_MODEL,
    max_tokens: 1024,
    system: systemPrompt,
    tools: ASSISTANT_TOOLS,
    messages,
  });

  let loops = 0;
  while (response.stop_reason === "tool_use" && loops < MAX_TOOL_LOOPS) {
    loops++;
    const toolUseBlocks = response.content.filter(
      (block): block is Anthropic.ToolUseBlock => block.type === "tool_use"
    );

    messages.push({ role: "assistant", content: response.content });

    const toolResults: Anthropic.ToolResultBlockParam[] = [];
    for (const block of toolUseBlocks) {
      const result = await executeAssistantTool(
        block.name,
        block.input as Record<string, unknown>,
        auth.session.householdId,
        auth.session.userId
      );
      actions.push({ tool: block.name, result });
      toolResults.push({
        type: "tool_result",
        tool_use_id: block.id,
        content: JSON.stringify(result),
      });
    }
    messages.push({ role: "user", content: toolResults });

    response = await anthropic.messages.create({
      model: ASSISTANT_MODEL,
      max_tokens: 1024,
      system: systemPrompt,
      tools: ASSISTANT_TOOLS,
      messages,
    });
  }

  const textBlock = response.content.find((block): block is Anthropic.TextBlock => block.type === "text");

  return NextResponse.json({
    reply: textBlock?.text ?? "",
    actions,
  });
}
