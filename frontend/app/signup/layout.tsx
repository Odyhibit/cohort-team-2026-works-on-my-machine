import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Create account",
  description: "Create an account to manage properties",
};

export default function SignUpLayout({ children }: { children: React.ReactNode }) {
  return children;
}
