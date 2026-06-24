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

type ChatMessage = { role: "user" | "assistant"; content: string };

type MealPlanDTO = {
  id: string;
  weekStartDate: string;
  days: { date: string; title: string; ingredients: string[] }[];
} | null;

type TransactionDTO = {
  id: string;
  description: string;
  amount: number;
  category: string;
  occurredAt: string;
  source: string;
};
type BudgetGoalDTO = {
  id: string;
  name: string;
  targetAmount: number;
  savedAmount: number;
  targetDate: string | null;
};
type BudgetSummaryDTO = {
  month: string;
  totalThisMonth: number;
  byCategory: { category: string; total: number }[];
  anomalies: { category: string; currentTotal: number; previousAverage: number; difference: number }[];
};

type BankConnectionDTO = { id: string; provider: string; lastSyncedAt: string | null } | null;

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
  initialMealPlan: MealPlanDTO;
  initialTransactions: TransactionDTO[];
  initialBudgetGoals: BudgetGoalDTO[];
  initialBankConnection: BankConnectionDTO;
  bankStatus?: string;
  budgetSummary: BudgetSummaryDTO;
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
const TRANSACTION_CATEGORIES = [
  "GROCERIES",
  "BILLS",
  "TRANSPORT",
  "ENTERTAINMENT",
  "HEALTH",
  "EDUCATION",
  "SAVINGS",
  "OTHER",
];

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
  initialMealPlan,
  initialTransactions,
  initialBudgetGoals,
  initialBankConnection,
  bankStatus,
  budgetSummary,
  digest,
}: Props) {
  const router = useRouter();
  const [events, setEvents] = useState(initialEvents);
  const [shoppingItems, setShoppingItems] = useState(initialShoppingItems);
  const [renewables, setRenewables] = useState(initialRenewables);
  const [contacts, setContacts] = useState(initialEmergencyContacts);
  const [mealPlan, setMealPlan] = useState(initialMealPlan);
  const [mealPlanLoading, setMealPlanLoading] = useState(false);
  const [mealNotes, setMealNotes] = useState("");
  const [transactions, setTransactions] = useState(initialTransactions);
  const [budgetGoals, setBudgetGoals] = useState(initialBudgetGoals);
  const [bankConnection] = useState(initialBankConnection);
  const [syncing, setSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);
  const [invites, setInvites] = useState(initialInvites);

  async function syncBank() {
    setSyncing(true);
    setSyncMessage(null);
    const res = await fetch("/api/banking/sync", { method: "POST" });
    setSyncing(false);
    if (res.ok) {
      const data = await res.json();
      setSyncMessage(`Synced ${data.synced} new transaction${data.synced === 1 ? "" : "s"}.`);
      router.refresh();
    } else {
      setSyncMessage("Sync failed.");
    }
  }

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

  async function generateMealPlan(e: FormEvent) {
    e.preventDefault();
    setMealPlanLoading(true);
    const res = await fetch("/api/meal-plan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ notes: mealNotes || undefined }),
    });
    setMealPlanLoading(false);
    if (res.ok) {
      const data = await res.json();
      setMealPlan(data.mealPlan);
    }
  }

  async function addMealIngredientsToShoppingList() {
    const res = await fetch("/api/meal-plan/add-to-shopping-list", { method: "POST" });
    if (res.ok) {
      const data = await res.json();
      setShoppingItems((prev) => [...prev, ...data.items]);
    }
  }

  const [transactionDescription, setTransactionDescription] = useState("");
  const [transactionAmount, setTransactionAmount] = useState("");
  const [transactionCategory, setTransactionCategory] = useState("GROCERIES");

  async function addTransaction(e: FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/transactions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        description: transactionDescription,
        amount: Number(transactionAmount),
        category: transactionCategory,
      }),
    });
    if (res.ok) {
      const data = await res.json();
      setTransactions((prev) => [data.transaction, ...prev]);
      setTransactionDescription("");
      setTransactionAmount("");
    }
  }

  async function deleteTransaction(id: string) {
    const res = await fetch(`/api/transactions/${id}`, { method: "DELETE" });
    if (res.ok) setTransactions((prev) => prev.filter((t) => t.id !== id));
  }

  const [goalName, setGoalName] = useState("");
  const [goalTarget, setGoalTarget] = useState("");

  async function addGoal(e: FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/budget/goals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: goalName, targetAmount: Number(goalTarget) }),
    });
    if (res.ok) {
      const data = await res.json();
      setBudgetGoals((prev) => [...prev, data.goal]);
      setGoalName("");
      setGoalTarget("");
    }
  }

  async function contributeToGoal(id: string) {
    const amountStr = window.prompt("How much would you like to add to this goal?");
    const amount = Number(amountStr);
    if (!amountStr || !Number.isFinite(amount)) return;
    const res = await fetch(`/api/budget/goals/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ addAmount: amount }),
    });
    if (res.ok) {
      const data = await res.json();
      setBudgetGoals((prev) => prev.map((g) => (g.id === id ? data.goal : g)));
    }
  }

  async function deleteGoal(id: string) {
    const res = await fetch(`/api/budget/goals/${id}`, { method: "DELETE" });
    if (res.ok) setBudgetGoals((prev) => prev.filter((g) => g.id !== id));
  }

  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [chatSending, setChatSending] = useState(false);

  async function sendChatMessage(e: FormEvent) {
    e.preventDefault();
    if (!chatInput.trim()) return;
    const nextMessages: ChatMessage[] = [...chatMessages, { role: "user", content: chatInput }];
    setChatMessages(nextMessages);
    setChatInput("");
    setChatSending(true);

    const res = await fetch("/api/assistant/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: nextMessages }),
    });
    setChatSending(false);

    if (!res.ok) {
      setChatMessages((prev) => [...prev, { role: "assistant", content: "Sorry, something went wrong." }]);
      return;
    }

    const data = await res.json();
    setChatMessages((prev) => [...prev, { role: "assistant", content: data.reply }]);

    for (const action of data.actions ?? []) {
      if (action.tool === "create_event") setEvents((prev) => [...prev, action.result.event]);
      if (action.tool === "add_shopping_item") setShoppingItems((prev) => [...prev, action.result.item]);
      if (action.tool === "add_renewable") setRenewables((prev) => [...prev, action.result.renewable]);
      if (action.tool === "add_emergency_contact") setContacts((prev) => [...prev, action.result.contact]);
      if (action.tool === "add_transaction") setTransactions((prev) => [action.result.transaction, ...prev]);
      if (action.tool === "add_budget_goal") setBudgetGoals((prev) => [...prev, action.result.goal]);
      if (action.tool === "generate_meal_plan") setMealPlan(action.result.mealPlan);
    }
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

      {bankStatus === "connected" && <p role="alert">Bank connected and transactions synced.</p>}
      {bankStatus === "error" && <p role="alert">Couldn&apos;t connect your bank — please try again.</p>}
      {bankStatus === "invalid_state" && <p role="alert">That connection link expired — please try again.</p>}

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
        <h2>Ask FamilyBrain</h2>
        <ul>
          {chatMessages.map((m, i) => (
            <li key={i}>
              <span>
                <strong>{m.role === "user" ? "You" : "FamilyBrain"}:</strong> {m.content}
              </span>
            </li>
          ))}
          {chatSending && (
            <li>
              <span>FamilyBrain is thinking...</span>
            </li>
          )}
        </ul>
        <form onSubmit={sendChatMessage}>
          <label>
            Try &quot;Add dentist appointment for tomorrow at 3pm&quot; or &quot;What&apos;s on today?&quot;
            <input value={chatInput} onChange={(ev) => setChatInput(ev.target.value)} required />
          </label>
          <button type="submit" disabled={chatSending}>
            Send
          </button>
        </form>
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
        <h2>This week&apos;s meals</h2>
        {mealPlan ? (
          <>
            <ul>
              {mealPlan.days.map((d) => (
                <li key={d.date}>
                  <span>
                    {new Date(d.date).toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short" })}
                    : <strong>{d.title}</strong> — {d.ingredients.join(", ")}
                  </span>
                </li>
              ))}
            </ul>
            <button onClick={addMealIngredientsToShoppingList}>Add ingredients to shopping list</button>
          </>
        ) : (
          <p>No meal plan yet this week.</p>
        )}
        <form onSubmit={generateMealPlan}>
          <label>
            Dietary notes / allergies / preferences (optional)
            <input value={mealNotes} onChange={(ev) => setMealNotes(ev.target.value)} placeholder="e.g. no nuts, one vegetarian night, budget-friendly" />
          </label>
          <button type="submit" disabled={mealPlanLoading}>
            {mealPlanLoading ? "Planning..." : mealPlan ? "Regenerate meal plan" : "Generate meal plan"}
          </button>
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
        <h2>Budget</h2>
        {bankConnection ? (
          <p>
            Bank connected ({bankConnection.provider}). Last synced:{" "}
            {bankConnection.lastSyncedAt ? new Date(bankConnection.lastSyncedAt).toLocaleString() : "never"}.{" "}
            <button onClick={syncBank} disabled={syncing}>
              {syncing ? "Syncing..." : "Sync now"}
            </button>
            {syncMessage && <span> {syncMessage}</span>}
          </p>
        ) : (
          <p>
            <a href="/api/banking/connect">Connect your bank (sandbox)</a> to sync real transactions alongside
            manual entries.
          </p>
        )}
        <p>
          £{budgetSummary.totalThisMonth.toFixed(2)} spent in {budgetSummary.month}
          {budgetSummary.byCategory.length > 0 && (
            <>
              {" "}
              ({budgetSummary.byCategory.map((c) => `${c.category.toLowerCase()}: £${c.total.toFixed(2)}`).join(", ")})
            </>
          )}
        </p>
        {budgetSummary.anomalies.length > 0 && (
          <ul>
            {budgetSummary.anomalies.map((a) => (
              <li key={a.category}>
                <span>
                  You&apos;ve spent £{a.difference.toFixed(0)} more than usual on {a.category.toLowerCase()} this
                  month.
                </span>
              </li>
            ))}
          </ul>
        )}

        <h3>Recent transactions</h3>
        <ul>
          {transactions.slice(0, 10).map((t) => (
            <li key={t.id}>
              <span>
                {t.description} — £{t.amount.toFixed(2)} ({t.category.toLowerCase()}) on{" "}
                {new Date(t.occurredAt).toLocaleDateString()}
                {t.source === "truelayer" ? " 🏦" : ""}
              </span>
              <button onClick={() => deleteTransaction(t.id)}>Remove</button>
            </li>
          ))}
        </ul>
        <form onSubmit={addTransaction}>
          <label>
            Description
            <input
              value={transactionDescription}
              onChange={(ev) => setTransactionDescription(ev.target.value)}
              required
            />
          </label>
          <label>
            Amount (£)
            <input
              type="number"
              step="0.01"
              value={transactionAmount}
              onChange={(ev) => setTransactionAmount(ev.target.value)}
              required
            />
          </label>
          <label>
            Category
            <select value={transactionCategory} onChange={(ev) => setTransactionCategory(ev.target.value)}>
              {TRANSACTION_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c.toLowerCase()}
                </option>
              ))}
            </select>
          </label>
          <button type="submit">Log expense</button>
        </form>

        <h3>Savings goals</h3>
        <ul>
          {budgetGoals.map((g) => (
            <li key={g.id}>
              <span>
                {g.name}: £{g.savedAmount.toFixed(2)} / £{g.targetAmount.toFixed(2)}
              </span>
              <span>
                <button onClick={() => contributeToGoal(g.id)}>Add savings</button>
                <button onClick={() => deleteGoal(g.id)}>Remove</button>
              </span>
            </li>
          ))}
        </ul>
        <form onSubmit={addGoal}>
          <label>
            Goal name
            <input value={goalName} onChange={(ev) => setGoalName(ev.target.value)} required />
          </label>
          <label>
            Target (£)
            <input type="number" step="0.01" value={goalTarget} onChange={(ev) => setGoalTarget(ev.target.value)} required />
          </label>
          <button type="submit">Add goal</button>
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
