"use client";

import "../styles/main.scss";
import { useColorModes } from "@coreui/react";
import ErrorStatus from "@/components/ErrorStatus.client";
import { geistSans, geistMono } from "./fonts";

export default function GlobalError({ error, retry }: { error: unknown; retry: () => void }) {
  useColorModes("bill-payments-theme");

  return (
    <html
      lang="en"
      data-scroll-behavior="smooth"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable}`}
    >
      <body className="d-flex align-items-center min-vh-100 px-4">
        <title>Something went wrong</title>
        <ErrorStatus title="We couldn't load the app" error={error} retry={retry} />
      </body>
    </html>
  );
}
