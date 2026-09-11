import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Vehicle Capital Pro",
  description: "Business financial and transaction management for unit-based vehicle capital operations.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}