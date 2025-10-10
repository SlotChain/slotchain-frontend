import { ReactNode } from "react";
import { DashboardNavbar } from "./DashboardNavbar";
import { DashboardFooter } from "./DashboardFooter";

interface DashboardLayoutProps {
  children: ReactNode;
  currentView: "availability" | "profile";
  onViewChange: (view: "availability" | "profile") => void;
  onLogout: () => void;
  walletAddress?: string;
}

export function DashboardLayout({
  children,
  currentView,
  onViewChange,
  onLogout,
  walletAddress,
}: DashboardLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors flex flex-col">
      <DashboardNavbar
        currentView={currentView}
        onViewChange={onViewChange}
        onLogout={onLogout}
        walletAddress={walletAddress}
      />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>

      <DashboardFooter />
    </div>
  );
}
