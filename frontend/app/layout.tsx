import type { Metadata } from "next";
import { Suspense } from "react";
import "../styles/main.scss";
import { geistSans, geistMono } from "./fonts";
import AppShell from "../components/layout/AppShell.client";
import AccountMenu from "../components/layout/AccountMenu";
import SidebarNavigation from "../components/layout/SidebarNavigation";

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
        <AppShell account={<Suspense><AccountMenu /></Suspense>} navigation={<Suspense fallback={null}><SidebarNavigation /></Suspense>}>{children}</AppShell>
      </body>
    </html>
  );
}
