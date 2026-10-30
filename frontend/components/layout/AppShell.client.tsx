"use client";

import type { ReactNode } from "react";
import { CContainer } from "@coreui/react";
import AppFooter from "./AppFooter";
import AppHeader from "./AppHeader.client";
import AppSidebar from "./AppSidebar.client";
import { SidebarProvider } from "./SidebarContext.client";

// Admin shell: sidebar + sticky header + content + footer. Ported from CoreUI's DefaultLayout.
export default function AppShell({ children, account }: { children: ReactNode; account: ReactNode }) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <div className="wrapper d-flex flex-column min-vh-100">
        <AppHeader account={account} />
        <div className="body flex-grow-1">
          <CContainer className="px-4" lg>
            {children}
          </CContainer>
        </div>
        <AppFooter />
      </div>
    </SidebarProvider>
  );
}
