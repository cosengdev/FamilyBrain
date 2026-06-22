import Link from "next/link";

export default function HomePage() {
  return (
    <main>
      <h1>FamilyBrain</h1>
      <p>Phase 0 scaffold. See DESIGN.md at the repo root for the full product and architecture design.</p>
      <p>
        <Link href="/signup">Create a household</Link> · <Link href="/login">Log in</Link>
      </p>
    </main>
  );
}
