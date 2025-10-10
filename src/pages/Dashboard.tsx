import { useState } from "react";
import { DashboardLayout } from "../components/DashboardLayout";
import { AvailabilityView } from "../components/AvailabilityView";
import { ProfileView } from "../components/ProfileView";

interface DashboardProps {
  walletAddress: string;
  onLogout: () => void;
}

export function Dashboard({ walletAddress, onLogout }: DashboardProps) {
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
        <AvailabilityView walletAddress={walletAddress} />
      ) : (
        <ProfileView walletAddress={walletAddress} />
      )}
    </DashboardLayout>
  );
}
