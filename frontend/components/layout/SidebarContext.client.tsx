"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

type SidebarState = {
  sidebarShow: boolean;
  setSidebarShow: (show: boolean) => void;
  sidebarUnfoldable: boolean;
  setSidebarUnfoldable: (unfoldable: boolean) => void;
};

const SidebarContext = createContext<SidebarState | null>(null);

// Holds the sidebar's visible / narrow state (replaces the template's Redux store).
export function SidebarProvider({ children }: { children: ReactNode }) {
  const [sidebarShow, setSidebarShow] = useState(true);
  const [sidebarUnfoldable, setSidebarUnfoldable] = useState(false);

  return (
    <SidebarContext.Provider
      value={{ sidebarShow, setSidebarShow, sidebarUnfoldable, setSidebarUnfoldable }}
    >
      {children}
    </SidebarContext.Provider>
  );
}

export function useSidebar(): SidebarState {
  const ctx = useContext(SidebarContext);
  if (!ctx) throw new Error("useSidebar must be used inside <SidebarProvider>");
  return ctx;
}
