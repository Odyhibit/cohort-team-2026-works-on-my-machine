import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Vendors",
  description: "Manage vendors",
};

export default function VendorsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
