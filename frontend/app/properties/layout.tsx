import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Properties",
  description: "Manage properties",
};

export default function PropertiesLayout({ children }: { children: React.ReactNode }) {
  return children;
}
