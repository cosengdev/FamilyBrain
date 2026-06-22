export type Role = "ADMIN" | "ADULT" | "TEEN" | "CHILD" | "CARER";

export interface Household {
  id: string;
  name: string;
  createdAt: string;
}

export interface User {
  id: string;
  householdId: string;
  name: string;
  email?: string | null;
  role: Role;
  createdAt: string;
}

export interface CalendarEvent {
  id: string;
  householdId: string;
  ownerId: string;
  title: string;
  startsAt: string;
  endsAt: string;
  source: "manual" | "google" | "apple" | "outlook";
  createdAt: string;
}

export interface Task {
  id: string;
  householdId: string;
  assigneeId?: string | null;
  title: string;
  dueAt?: string | null;
  completedAt?: string | null;
  createdAt: string;
}

export interface ShoppingItem {
  id: string;
  householdId: string;
  name: string;
  quantity: number;
  checkedAt?: string | null;
  createdAt: string;
}

export type RenewableType =
  | "BILL"
  | "INSURANCE"
  | "MOT"
  | "PASSPORT"
  | "VISA"
  | "DRIVING_LICENCE"
  | "TV_LICENCE"
  | "SUBSCRIPTION"
  | "WARRANTY"
  | "OTHER";

export interface Renewable {
  id: string;
  householdId: string;
  type: RenewableType;
  name: string;
  dueDate: string;
  amount?: number | null;
  documentUrl?: string | null;
  createdAt: string;
}

export interface EmergencyContact {
  id: string;
  householdId: string;
  name: string;
  relationship: string;
  phone: string;
  createdAt: string;
}

export interface MedicalProfile {
  id: string;
  userId: string;
  allergies?: string | null;
  conditions?: string | null;
  medications?: string | null;
  gpName?: string | null;
  gpPhone?: string | null;
}

export type NotificationChannel = "PUSH" | "EMAIL" | "SMS";

export interface Notification {
  id: string;
  householdId: string;
  channel: NotificationChannel;
  body: string;
  sentAt?: string | null;
  createdAt: string;
}
