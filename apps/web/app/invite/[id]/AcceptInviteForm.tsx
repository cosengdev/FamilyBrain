"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

export default function AcceptInviteForm({ inviteId, email }: { inviteId: string; email: string }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const res = await fetch(`/api/invites/${inviteId}/accept`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, password }),
    });
    setLoading(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error || "Couldn't accept this invite");
      return;
    }
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit}>
      <label>
        Email
        <input value={email} disabled />
      </label>
      <label>
        Your name
        <input value={name} onChange={(e) => setName(e.target.value)} required />
      </label>
      <label>
        Choose a password
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          minLength={8}
          required
        />
      </label>
      {error && <p role="alert">{error}</p>}
      <button type="submit" disabled={loading}>
        {loading ? "Joining..." : "Join household"}
      </button>
    </form>
  );
}
