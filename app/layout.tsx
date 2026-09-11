import type { Metadata } from "next";
import "./globals.css";
import LogoutButton from "@/components/LogoutButton";

export const metadata: Metadata = { title: "A P Traders", description: "Business financial and transaction management for A P Traders." };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}<LogoutButton /></body>
    </html>
  );
}
