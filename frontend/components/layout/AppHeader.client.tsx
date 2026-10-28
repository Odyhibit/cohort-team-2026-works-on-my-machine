"use client";

import type { ReactNode } from "react";
import { Suspense, useEffect, useRef, useSyncExternalStore } from "react";
import {
  CContainer,
  CDropdown,
  CDropdownItem,
  CDropdownMenu,
  CDropdownToggle,
  CHeader,
  CHeaderNav,
  CHeaderToggler,
  useColorModes,
} from "@coreui/react";
import CIcon from "@coreui/icons-react";
import { cilContrast, cilMenu, cilMoon, cilSun } from "@coreui/icons";
import AppBreadcrumb from "./AppBreadcrumb.client";
import { useSidebar } from "./SidebarContext.client";

const modes = [
  { value: "light", label: "Light", icon: cilSun },
  { value: "dark", label: "Dark", icon: cilMoon },
  { value: "auto", label: "Auto", icon: cilContrast },
] as const;

export default function AppHeader({ account }: { account: ReactNode }) {
  const headerRef = useRef<HTMLDivElement>(null);
  const { colorMode, setColorMode } = useColorModes("bill-payments-theme");
  const { sidebarShow, setSidebarShow } = useSidebar();

  // Add a shadow once the page is scrolled.
  useEffect(() => {
    const handleScroll = () => {
      headerRef.current?.classList.toggle("shadow-sm", document.documentElement.scrollTop > 0);
    };
    document.addEventListener("scroll", handleScroll);
    return () => document.removeEventListener("scroll", handleScroll);
  }, []);

  // useColorModes returns the stored mode on the first client render, but the
  // server rendered the default. Only trust it after mount to avoid a hydration mismatch.
  const isClient = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
  const activeMode = isClient ? colorMode : undefined;

  const current = modes.find((m) => m.value === activeMode) ?? (isClient ? modes[0] : modes[2]);

  return (
    <CHeader position="sticky" className="mb-4 p-0" ref={headerRef}>
      <CContainer className="border-bottom px-4" fluid>
        <CHeaderToggler
          onClick={() => setSidebarShow(!sidebarShow)}
          style={{ marginInlineStart: "-14px" }}
          aria-label="Toggle sidebar"
        >
          <CIcon icon={cilMenu} size="lg" />
        </CHeaderToggler>
        <CHeaderNav className="ms-auto">
          <li className="nav-item py-1">
            <div className="vr h-100 mx-2 text-body text-opacity-75"></div>
          </li>
          <CDropdown variant="nav-item" placement="bottom-end">
            <CDropdownToggle caret={false}>
              <CIcon icon={current.icon} size="lg" />
            </CDropdownToggle>
            <CDropdownMenu>
              {modes.map((m) => (
                <CDropdownItem
                  key={m.value}
                  active={activeMode === m.value}
                  className="d-flex align-items-center"
                  as="button"
                  type="button"
                  onClick={() => setColorMode(m.value)}
                >
                  <CIcon className="me-2" icon={m.icon} size="lg" /> {m.label}
                </CDropdownItem>
              ))}
            </CDropdownMenu>
          </CDropdown>
          <li className="nav-item py-1">
            <div className="vr h-100 mx-2 text-body text-opacity-75"></div>
          </li>
          {account}
        </CHeaderNav>
      </CContainer>
      <CContainer className="px-4" fluid>
        <Suspense fallback={null}>
          <AppBreadcrumb />
        </Suspense>
      </CContainer>
    </CHeader>
  );
}
