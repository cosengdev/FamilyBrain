import type { CalendarEvent, ShoppingItem, Renewable, EmergencyContact, MedicalProfile, Invite } from "@prisma/client";

export function serializeEvent(e: CalendarEvent) {
  return {
    id: e.id,
    title: e.title,
    startsAt: e.startsAt.toISOString(),
    endsAt: e.endsAt.toISOString(),
  };
}

export function serializeShoppingItem(i: ShoppingItem) {
  return {
    id: i.id,
    name: i.name,
    quantity: i.quantity,
    checkedAt: i.checkedAt ? i.checkedAt.toISOString() : null,
  };
}

export function serializeRenewable(r: Renewable) {
  return {
    id: r.id,
    name: r.name,
    type: r.type,
    dueDate: r.dueDate.toISOString(),
    amount: r.amount ? Number(r.amount) : null,
  };
}

export function serializeEmergencyContact(c: EmergencyContact) {
  return {
    id: c.id,
    name: c.name,
    relationship: c.relationship,
    phone: c.phone,
  };
}

export function serializeInvite(i: Invite) {
  return {
    id: i.id,
    email: i.email,
    role: i.role,
    expiresAt: i.expiresAt.toISOString(),
    acceptedAt: i.acceptedAt ? i.acceptedAt.toISOString() : null,
  };
}

export function serializeMedicalProfile(p: MedicalProfile | null) {
  if (!p) return null;
  return {
    allergies: p.allergies,
    conditions: p.conditions,
    medications: p.medications,
    gpName: p.gpName,
    gpPhone: p.gpPhone,
  };
}
