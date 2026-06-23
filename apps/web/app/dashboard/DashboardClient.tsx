"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

type EventDTO = { id: string; title: string; startsAt: string; endsAt: string };
type ShoppingItemDTO = { id: string; name: string; quantity: number; checkedAt: string | null };
type RenewableDTO = { id: string; name: string; type: string; dueDate: string; amount: number | null };
type EmergencyContactDTO = { id: string; name: string; relationship: string; phone: string };
type MedicalProfileDTO = {
  allergies: string | null;
  conditions: string | null;
  medications: string | null;
  gpName: string | null;
  gpPhone: string | null;
} | null;

type DigestDTO = {
  todayEvents: { id: string; title: string; startsAt: string; endsAt: string }[];
  upcomingRenewables: { id: string; name: string; type: string; dueDate: string; daysUntil: number }[];
  shoppingItemCount: number;
};

type InviteDTO = { id: string; email: string; role: string; expiresAt: string; acceptedAt: string | null };

interface Props {
  userName: string;
  role: string;
  householdName: string;
  initialEvents: EventDTO[];
  initialShoppingItems: ShoppingItemDTO[];
  initialRenewables: RenewableDTO[];
  initialEmergencyContacts: EmergencyContactDTO[];
  initialMedicalProfile: MedicalProfileDTO;
  initialInvites: InviteDTO[];
  digest: DigestDTO;
}

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

const HOUSEHOLD_ROLES = ["ADMIN", "ADULT", "TEEN", "CHILD", "CARER"];

export default function DashboardClient({
  userName,
  role,
  householdName,
  initialEvents,
  initialShoppingItems,
  initialRenewables,
  initialEmergencyContacts,
  initialMedicalProfile,
  initialInvites,
  digest,
}: Props) {
  const router = useRouter();
  const [events, setEvents] = useState(initialEvents);
  const [shoppingItems, setShoppingItems] = useState(initialShoppingItems);
  const [renewables, setRenewables] = useState(initialRenewables);
  const [contacts, setContacts] = useState(initialEmergencyContacts);
  const [invites, setInvites] = useState(initialInvites);

  const [eventTitle, setEventTitle] = useState("");
  const [eventStart, setEventStart] = useState("");
  const [eventEnd, setEventEnd] = useState("");

  const [itemName, setItemName] = useState("");

  const [renewableName, setRenewableName] = useState("");
  const [renewableType, setRenewableType] = useState("BILL");
  const [renewableDue, setRenewableDue] = useState("");

  const [contactName, setContactName] = useState("");
  const [contactRelationship, setContactRelationship] = useState("");
  const [contactPhone, setContactPhone] = useState("");

  const [allergies, setAllergies] = useState(initialMedicalProfile?.allergies ?? "");
  const [conditions, setConditions] = useState(initialMedicalProfile?.conditions ?? "");
  const [medications, setMedications] = useState(initialMedicalProfile?.medications ?? "");
  const [medicalSaved, setMedicalSaved] = useState(false);

  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("ADULT");
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [lastInviteLink, setLastInviteLink] = useState<string | null>(null);

  async function sendInvite(e: FormEvent) {
    e.preventDefault();
    setInviteError(null);
    setLastInviteLink(null);
    const res = await fetch("/api/household/invites", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: inviteEmail, role: inviteRole }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setInviteError(data.error || "Couldn't send that invite");
      return;
    }
    setInvites((prev) => [data.invite, ...prev]);
    setLastInviteLink(`${window.location.origin}/invite/${data.invite.id}`);
    setInviteEmail("");
  }

  async function addEvent(e: FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: eventTitle, startsAt: eventStart, endsAt: eventEnd }),
    });
    if (res.ok) {
      const { event } = await res.json();
      setEvents((prev) => [...prev, event].sort((a, b) => a.startsAt.localeCompare(b.startsAt)));
      setEventTitle("");
      setEventStart("");
      setEventEnd("");
    }
  }

  async function addShoppingItem(e: FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/shopping-items", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: itemName }),
    });
    if (res.ok) {
      const { item } = await res.json();
      setShoppingItems((prev) => [...prev, item]);
      setItemName("");
    }
  }

  async function toggleShoppingItem(item: ShoppingItemDTO) {
    const res = await fetch(`/api/shopping-items/${item.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ checked: !item.checkedAt }),
    });
    if (res.ok) {
      const { item: updated } = await res.json();
      setShoppingItems((prev) => prev.map((i) => (i.id === item.id ? updated : i)));
    }
  }

  async function deleteShoppingItem(id: string) {
    const res = await fetch(`/api/shopping-items/${id}`, { method: "DELETE" });
    if (res.ok) setShoppingItems((prev) => prev.filter((i) => i.id !== id));
  }

  async function addRenewable(e: FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/renewables", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: renewableName, type: renewableType, dueDate: renewableDue }),
    });
    if (res.ok) {
      const { renewable } = await res.json();
      setRenewables((prev) => [...prev, renewable].sort((a, b) => a.dueDate.localeCompare(b.dueDate)));
      setRenewableName("");
      setRenewableDue("");
    }
  }

  async function deleteRenewable(id: string) {
    const res = await fetch(`/api/renewables/${id}`, { method: "DELETE" });
    if (res.ok) setRenewables((prev) => prev.filter((r) => r.id !== id));
  }

  async function addContact(e: FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/emergency-contacts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: contactName, relationship: contactRelationship, phone: contactPhone }),
    });
    if (res.ok) {
      const { contact } = await res.json();
      setContacts((prev) => [...prev, contact]);
      setContactName("");
      setContactRelationship("");
      setContactPhone("");
    }
  }

  async function deleteContact(id: string) {
    const res = await fetch(`/api/emergency-contacts/${id}`, { method: "DELETE" });
    if (res.ok) setContacts((prev) => prev.filter((c) => c.id !== id));
  }

  async function saveMedicalProfile(e: FormEvent) {
    e.preventDefault();
    setMedicalSaved(false);
    const res = await fetch("/api/medical-profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ allergies, conditions, medications }),
    });
    if (res.ok) setMedicalSaved(true);
  }

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  const hasBriefing =
    digest.todayEvents.length > 0 || digest.upcomingRenewables.length > 0 || digest.shoppingItemCount > 0;

  return (
    <main style={{ maxWidth: 720 }}>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
        <div>
          <h1>Good morning, {userName.split(" ")[0]}</h1>
          <p>{householdName}</p>
        </div>
        <button onClick={logout}>Log out</button>
      </header>

      <section>
        <h2>Today&apos;s briefing</h2>
        {!hasBriefing ? (
          <p>Nothing urgent today.</p>
        ) : (
          <ul>
            {digest.todayEvents.map((e) => (
              <li key={e.id}>
                <span>
                  {e.title} at{" "}
                  {new Date(e.startsAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
                </span>
              </li>
            ))}
            {digest.upcomingRenewables.map((r) => (
              <li key={r.id}>
                <span>
                  {r.name} {r.daysUntil <= 0 ? "is due today" : `expires in ${r.daysUntil} day${r.daysUntil === 1 ? "" : "s"}`}
                </span>
              </li>
            ))}
            {digest.shoppingItemCount > 0 && (
              <li>
                <span>{digest.shoppingItemCount} item{digest.shoppingItemCount === 1 ? "" : "s"} on the shopping list</span>
              </li>
            )}
          </ul>
        )}
      </section>

      <section>
        <h2>Calendar</h2>
        <ul>
          {events.map((e) => (
            <li key={e.id}>
              <span>
                {e.title} — {new Date(e.startsAt).toLocaleString()}
              </span>
            </li>
          ))}
        </ul>
        <form onSubmit={addEvent}>
          <label>
            Title
            <input value={eventTitle} onChange={(ev) => setEventTitle(ev.target.value)} required />
          </label>
          <label>
            Starts
            <input
              type="datetime-local"
              value={eventStart}
              onChange={(ev) => setEventStart(ev.target.value)}
              required
            />
          </label>
          <label>
            Ends
            <input type="datetime-local" value={eventEnd} onChange={(ev) => setEventEnd(ev.target.value)} required />
          </label>
          <button type="submit">Add event</button>
        </form>
      </section>

      <section>
        <h2>Shopping list</h2>
        <ul>
          {shoppingItems.map((item) => (
            <li key={item.id}>
              <label style={{ display: "flex", gap: "0.5rem", alignItems: "center", flex: 1 }}>
                <input type="checkbox" checked={!!item.checkedAt} onChange={() => toggleShoppingItem(item)} />
                <span style={{ textDecoration: item.checkedAt ? "line-through" : "none" }}>
                  {item.name}
                  {item.quantity > 1 ? ` x${item.quantity}` : ""}
                </span>
              </label>
              <button onClick={() => deleteShoppingItem(item.id)}>Remove</button>
            </li>
          ))}
        </ul>
        <form onSubmit={addShoppingItem}>
          <label>
            Item
            <input value={itemName} onChange={(ev) => setItemName(ev.target.value)} required />
          </label>
          <button type="submit">Add item</button>
        </form>
      </section>

      <section>
        <h2>Bills &amp; renewals</h2>
        <ul>
          {renewables.map((r) => {
            const daysUntil = Math.ceil((new Date(r.dueDate).getTime() - Date.now()) / 86400000);
            return (
              <li key={r.id}>
                <span>
                  {r.name} ({r.type}) — due {new Date(r.dueDate).toLocaleDateString()} ({daysUntil} day
                  {daysUntil === 1 ? "" : "s"})
                </span>
                <button onClick={() => deleteRenewable(r.id)}>Remove</button>
              </li>
            );
          })}
        </ul>
        <form onSubmit={addRenewable}>
          <label>
            Name
            <input value={renewableName} onChange={(ev) => setRenewableName(ev.target.value)} required />
          </label>
          <label>
            Type
            <select value={renewableType} onChange={(ev) => setRenewableType(ev.target.value)}>
              {RENEWABLE_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t.replace(/_/g, " ")}
                </option>
              ))}
            </select>
          </label>
          <label>
            Due date
            <input type="date" value={renewableDue} onChange={(ev) => setRenewableDue(ev.target.value)} required />
          </label>
          <button type="submit">Add renewal</button>
        </form>
      </section>

      <section>
        <h2>Emergency contacts</h2>
        <ul>
          {contacts.map((c) => (
            <li key={c.id}>
              <span>
                {c.name} ({c.relationship}) — {c.phone}
              </span>
              <button onClick={() => deleteContact(c.id)}>Remove</button>
            </li>
          ))}
        </ul>
        <form onSubmit={addContact}>
          <label>
            Name
            <input value={contactName} onChange={(ev) => setContactName(ev.target.value)} required />
          </label>
          <label>
            Relationship
            <input
              value={contactRelationship}
              onChange={(ev) => setContactRelationship(ev.target.value)}
              required
            />
          </label>
          <label>
            Phone
            <input value={contactPhone} onChange={(ev) => setContactPhone(ev.target.value)} required />
          </label>
          <button type="submit">Add contact</button>
        </form>
      </section>

      <section>
        <h2>Your medical profile</h2>
        <form onSubmit={saveMedicalProfile}>
          <label>
            Allergies
            <input value={allergies} onChange={(ev) => setAllergies(ev.target.value)} />
          </label>
          <label>
            Conditions
            <input value={conditions} onChange={(ev) => setConditions(ev.target.value)} />
          </label>
          <label>
            Medications
            <input value={medications} onChange={(ev) => setMedications(ev.target.value)} />
          </label>
          <button type="submit">Save</button>
          {medicalSaved && <span>Saved.</span>}
        </form>
      </section>

      {role === "ADMIN" && (
        <section>
          <h2>Invite a family member</h2>
          <ul>
            {invites.map((inv) => (
              <li key={inv.id}>
                <span>
                  {inv.email} ({inv.role.toLowerCase()}) —{" "}
                  {inv.acceptedAt ? "joined" : new Date(inv.expiresAt) < new Date() ? "expired" : "pending"}
                </span>
              </li>
            ))}
          </ul>
          <form onSubmit={sendInvite}>
            <label>
              Email
              <input
                type="email"
                value={inviteEmail}
                onChange={(ev) => setInviteEmail(ev.target.value)}
                required
              />
            </label>
            <label>
              Role
              <select value={inviteRole} onChange={(ev) => setInviteRole(ev.target.value)}>
                {HOUSEHOLD_ROLES.map((r) => (
                  <option key={r} value={r}>
                    {r.toLowerCase()}
                  </option>
                ))}
              </select>
            </label>
            {inviteError && <p role="alert">{inviteError}</p>}
            <button type="submit">Send invite</button>
          </form>
          {lastInviteLink && (
            <p>
              Share this link with them — it expires in 7 days: <br />
              <code>{lastInviteLink}</code>
            </p>
          )}
        </section>
      )}
    </main>
  );
}
