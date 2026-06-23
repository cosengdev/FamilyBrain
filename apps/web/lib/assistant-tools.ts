import type Anthropic from "@anthropic-ai/sdk";
import type { RenewableType } from "@prisma/client";
import { prisma } from "./prisma";
import { buildDigest } from "./digest";
import { serializeEvent, serializeShoppingItem, serializeRenewable, serializeEmergencyContact } from "./serialize";

const RENEWABLE_TYPES = [
  "BILL",
  "INSURANCE",
  "MOT",
  "PASSPORT",
  "VISA",
  "DRIVING_LICENCE",
  "TV_LICENCE",
  "SUBSCRIPTION",
  "WARRANTY",
  "OTHER",
];

export const ASSISTANT_TOOLS: Anthropic.Tool[] = [
  {
    name: "create_event",
    description: "Add an event to the shared family calendar.",
    input_schema: {
      type: "object",
      properties: {
        title: { type: "string" },
        startsAt: { type: "string", description: "ISO 8601 datetime" },
        endsAt: { type: "string", description: "ISO 8601 datetime" },
      },
      required: ["title", "startsAt", "endsAt"],
    },
  },
  {
    name: "add_shopping_item",
    description: "Add an item to the household shopping list.",
    input_schema: {
      type: "object",
      properties: {
        name: { type: "string" },
        quantity: { type: "number" },
      },
      required: ["name"],
    },
  },
  {
    name: "add_renewable",
    description:
      "Track a bill, subscription, or renewal (insurance, MOT, passport, driving licence, TV licence, warranty, etc) with its due date.",
    input_schema: {
      type: "object",
      properties: {
        name: { type: "string" },
        type: { type: "string", enum: RENEWABLE_TYPES },
        dueDate: { type: "string", description: "ISO 8601 date" },
        amount: { type: "number" },
      },
      required: ["name", "type", "dueDate"],
    },
  },
  {
    name: "add_emergency_contact",
    description: "Add a contact to the household's emergency contacts list.",
    input_schema: {
      type: "object",
      properties: {
        name: { type: "string" },
        relationship: { type: "string" },
        phone: { type: "string" },
      },
      required: ["name", "relationship", "phone"],
    },
  },
  {
    name: "get_digest",
    description:
      "Get today's calendar events, renewals due within 30 days, and the open shopping item count for the household.",
    input_schema: { type: "object", properties: {} },
  },
];

export async function executeAssistantTool(
  toolName: string,
  input: Record<string, unknown>,
  householdId: string,
  userId: string
): Promise<unknown> {
  switch (toolName) {
    case "create_event": {
      const event = await prisma.calendarEvent.create({
        data: {
          householdId,
          ownerId: userId,
          title: String(input.title),
          startsAt: new Date(input.startsAt as string),
          endsAt: new Date(input.endsAt as string),
        },
      });
      return { created: "event", event: serializeEvent(event) };
    }
    case "add_shopping_item": {
      const item = await prisma.shoppingItem.create({
        data: {
          householdId,
          name: String(input.name),
          quantity: typeof input.quantity === "number" ? input.quantity : 1,
        },
      });
      return { created: "shopping_item", item: serializeShoppingItem(item) };
    }
    case "add_renewable": {
      const type = (RENEWABLE_TYPES.includes(input.type as string) ? input.type : "OTHER") as RenewableType;
      const renewable = await prisma.renewable.create({
        data: {
          householdId,
          name: String(input.name),
          type,
          dueDate: new Date(input.dueDate as string),
          amount: typeof input.amount === "number" ? input.amount : undefined,
        },
      });
      return { created: "renewable", renewable: serializeRenewable(renewable) };
    }
    case "add_emergency_contact": {
      const contact = await prisma.emergencyContact.create({
        data: {
          householdId,
          name: String(input.name),
          relationship: String(input.relationship),
          phone: String(input.phone),
        },
      });
      return { created: "emergency_contact", contact: serializeEmergencyContact(contact) };
    }
    case "get_digest": {
      const digest = await buildDigest(householdId);
      return { digest };
    }
    default:
      return { error: `Unknown tool ${toolName}` };
  }
}
