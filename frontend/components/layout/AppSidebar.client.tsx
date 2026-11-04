"use client";

import type { ReactNode } from "react";
import {
  CCloseButton,
  CSidebar,
  CSidebarBrand,
  CSidebarFooter,
  CSidebarHeader,
  CSidebarToggler,
} from "@coreui/react";
import Link from "next/link";
import { useSidebar } from "./SidebarContext.client";

export default function AppSidebar({ navigation }: { navigation: ReactNode }) {
  const { sidebarShow, setSidebarShow, sidebarUnfoldable, setSidebarUnfoldable } = useSidebar();

  return (
    <CSidebar
      className="border-end"
      colorScheme="dark"
      position="fixed"
      unfoldable={sidebarUnfoldable}
      visible={sidebarShow}
      onVisibleChange={(visible: boolean) => setSidebarShow(visible)}
    >
      <CSidebarHeader className="border-bottom">
        <CSidebarBrand as={Link} href="/" className="text-decoration-none">
          <span className="sidebar-brand-full fs-5 fw-semibold">Bill Payments</span>
          <span className="sidebar-brand-narrow fw-semibold">BP</span>
        </CSidebarBrand>
        <CCloseButton className="d-lg-none" dark onClick={() => setSidebarShow(false)} />
      </CSidebarHeader>
      {navigation}
      <CSidebarFooter className="border-top d-none d-lg-flex">
        <CSidebarToggler onClick={() => setSidebarUnfoldable(!sidebarUnfoldable)} />
      </CSidebarFooter>
    </CSidebar>
  );
}
