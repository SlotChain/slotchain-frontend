import { useState } from "react";
import { LandingPage } from "./pages/LandingPage";
import { Login } from "./pages/Login";
import { Signup, SignupData } from "./pages/Signup";
import { Dashboard } from "./pages/Dashboard";
import { ThemeProvider } from "./context/ThemeContext";
import { NotificationProvider } from "./context/NotificationContext";
import { ToastProvider } from "./context/ToastContext";

type Page = "landing" | "login" | "signup" | "dashboard";

function App() {
  const [currentPage, setCurrentPage] = useState<Page>("landing");
  const [walletAddress, setWalletAddress] = useState<string>("");

  const handleLogin = (address: string) => {
    setWalletAddress(address);
    setCurrentPage("dashboard");
  };

  const handleSignupRedirect = (address: string) => {
    // ✅ Capture wallet address from login
    setWalletAddress(address);
    setCurrentPage("signup");
  };

  const handleSignupComplete = (userData: SignupData) => {
    setWalletAddress(userData.walletAddress);
    setCurrentPage("dashboard");
  };

  const handleLogout = () => {
    console.log("User logged out");
    setWalletAddress("");
    setCurrentPage("landing");
  };

  const renderPage = () => {
    switch (currentPage) {
      case "landing":
        return <LandingPage onLaunchApp={() => setCurrentPage("login")} />;

      case "login":
        return (
          <Login
            onLogin={handleLogin}
            onSignupRedirect={handleSignupRedirect} // ✅ pass handler with wallet
          />
        );

      case "signup":
        return (
          <Signup
            onSignupComplete={handleSignupComplete}
            onBackToLogin={() => setCurrentPage("login")}
            connectedWallet={walletAddress} // ✅ pass wallet to signup form
          />
        );

      case "dashboard":
        return (
          <Dashboard walletAddress={walletAddress} onLogout={handleLogout} />
        );

      default:
        return <LandingPage onLaunchApp={() => setCurrentPage("login")} />;
    }
  };

  return (
    <ThemeProvider>
      <NotificationProvider>
        <ToastProvider>{renderPage()}</ToastProvider>
      </NotificationProvider>
    </ThemeProvider>
  );
}

export default App;
