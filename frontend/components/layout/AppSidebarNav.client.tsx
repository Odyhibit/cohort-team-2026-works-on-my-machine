"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import SimpleBar from "simplebar-react";
import "simplebar-react/dist/simplebar.min.css";
import { CNavLink, CSidebarNav } from "@coreui/react";
import type { NavEntry } from "./nav";

export function AppSidebarNav({ items }: { items: NavEntry[] }) {
  const pathname = usePathname();

  const label = (item: NavEntry, indent: boolean) => (
    <>
      {item.icon ??
        (indent && (
          <span className="nav-icon">
            <span className="nav-icon-bullet"></span>
          </span>
        ))}
      {item.name}
    </>
  );

  const navItem = (item: NavEntry, index: number, indent = false) => {
    const Component = item.component;
    return (
      <Component as="div" key={index}>
        {item.to ? (
          <CNavLink as={Link} href={item.to} active={pathname === item.to}>
            {label(item, indent)}
          </CNavLink>
        ) : (
          label(item, indent)
        )}
      </Component>
    );
  };

  const navGroup = (item: NavEntry, index: number) => {
    const Component = item.component;
    return (
      <Component compact as="div" key={index} toggler={label(item, false)}>
        {item.items?.map((child, i) =>
          child.items ? navGroup(child, i) : navItem(child, i, true),
        )}
      </Component>
    );
  };

  return (
    <CSidebarNav as={SimpleBar}>
      {items.map((item, index) =>
        item.items ? navGroup(item, index) : navItem(item, index),
      )}
    </CSidebarNav>
  );
}
