import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard – Obvis",
  description: "Your Obvis health dashboard.",
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
