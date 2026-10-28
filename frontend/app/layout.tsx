import type { Metadata } from "next";
import { Suspense } from "react";
import { Geist, Geist_Mono } from "next/font/google";
import "../styles/main.scss";
import AppShell from "../components/layout/AppShell.client";
import AccountMenu from "../components/layout/AccountMenu";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Multitenant Bill Payments",
  description:
    "Upload PDF invoices, review extracted details, and approve or reject them.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      data-scroll-behavior="smooth"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable}`}
    >
      <body>
        <AppShell account={<Suspense><AccountMenu /></Suspense>}>{children}</AppShell>
      </body>
    </html>
  );
}
