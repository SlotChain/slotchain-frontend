import { useState } from "react";
import { DashboardLayout } from "../components/DashboardLayout";
import { AvailabilityView } from "../components/AvailabilityView";
import { ProfileView } from "../components/ProfileView";

interface DashboardProps {
  walletAddress: string;
  onLogout: () => void;
  onWalletChange?: (wallet: string) => void;
}

export function Dashboard({
  walletAddress,
  onLogout,
  onWalletChange,
}: DashboardProps) {
  const [currentView, setCurrentView] = useState<"availability" | "profile">(
    "availability"
  );

  return (
    <DashboardLayout
      currentView={currentView}
      onViewChange={setCurrentView}
      onLogout={onLogout}
      walletAddress={walletAddress}
    >
      {currentView === "availability" ? (
        <AvailabilityView
          walletAddress={walletAddress}
          onWalletChange={onWalletChange}
        />
      ) : (
        <ProfileView
          walletAddress={walletAddress}
          onWalletChange={onWalletChange}
        />
      )}
    </DashboardLayout>
  );
}
