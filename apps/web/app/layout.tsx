import "./globals.css";
import type { ReactNode } from "react";

export const metadata = {
  title: "FamilyBrain",
  description:
    "The family operating system — calendar, budget, school, and life admin in one place.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
