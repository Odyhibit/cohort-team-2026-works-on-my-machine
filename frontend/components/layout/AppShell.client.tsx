"use client";

import { Suspense, type ReactNode } from "react";
import { CContainer } from "@coreui/react";
import PaymentBanner from "../PaymentBanner.client";
import AppFooter from "./AppFooter";
import AppHeader from "./AppHeader.client";
import AppSidebar from "./AppSidebar.client";
import { SidebarProvider } from "./SidebarContext.client";

// Admin shell: sidebar + sticky header + content + footer. Ported from CoreUI's DefaultLayout.
export default function AppShell({ children, account, navigation }: { children: ReactNode; account: ReactNode; navigation: ReactNode }) {
  return (
    <SidebarProvider>
      <AppSidebar navigation={navigation} />
      <div className="wrapper d-flex flex-column min-vh-100">
        <AppHeader account={account} />
        <div id="payment-focus-root" />
        <div className="body flex-grow-1" data-payment-content>
          <CContainer className="px-4" lg>
            {/* usePathname() reads runtime URL data; Suspense keeps the route prerenderable. */}
            <Suspense fallback={null}><PaymentBanner /></Suspense>
            {children}
          </CContainer>
        </div>
        <AppFooter />
      </div>
    </SidebarProvider>
  );
}
