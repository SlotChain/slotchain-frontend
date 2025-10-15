import { Routes, Route, useNavigate } from "react-router-dom";
import { LandingPage } from "./pages/LandingPage";
import { Login } from "./pages/Login";
import { Signup, SignupData } from "./pages/Signup";
import { Dashboard } from "./pages/Dashboard";
import { BookingPage } from "./components/BookingPage";
import Meeting from "./pages/Meeting";
import { ThemeProvider } from "./context/ThemeContext";
import { NotificationProvider } from "./context/NotificationContext";
import { ToastProvider } from "./context/ToastContext";
import { useParams } from "react-router-dom";
import { useState } from "react";
import { WagmiProvider } from "wagmi";
import { config } from "./config";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const queryClient = new QueryClient();

function App() {
  const [walletAddress, setWalletAddress] = useState<string>("");
  const navigate = useNavigate();

  function BookingPageRoute() {
    const { walletAddress } = useParams<{ walletAddress: string }>();
    return <BookingPage walletAddress={walletAddress || ""} />;
  }

  // Handlers
  const handleLogin = (address: string) => {
    setWalletAddress(address);
    navigate("/dashboard");
  };

  const handleSignupRedirect = (address: string) => {
    setWalletAddress(address);
    navigate("/signup");
  };

  const handleSignupComplete = (userData: SignupData) => {
    setWalletAddress(userData.walletAddress);
    navigate("/dashboard");
  };

  const handleLogout = () => {
    console.log("User logged out");
    setWalletAddress("");
    navigate("/");
  };

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <NotificationProvider>
            <ToastProvider>
              <Routes>
                <Route
                  path="/"
                  element={
                    <LandingPage onLaunchApp={() => navigate("/login")} />
                  }
                />
                <Route
                  path="/login"
                  element={
                    <Login
                      onLogin={handleLogin}
                      onSignupRedirect={handleSignupRedirect}
                    />
                  }
                />
                <Route
                  path="/signup"
                  element={
                    <Signup
                      onSignupComplete={handleSignupComplete}
                      onBackToLogin={() => navigate("/login")}
                      connectedWallet={walletAddress}
                    />
                  }
                />
                <Route
                  path="/dashboard"
                  element={
                    <Dashboard
                      walletAddress={walletAddress}
                      onLogout={handleLogout}
                      onWalletChange={setWalletAddress}
                    />
                  }
                />
                <Route
                  path="/book/:walletAddress"
                  element={<BookingPageRoute />}
                />

                <Route
                  path="/landingPage"
                  element={
                    <LandingPage onLaunchApp={() => navigate("/login")} />
                  }
                />

                <Route
                  path="*"
                  element={
                    <LandingPage onLaunchApp={() => navigate("/login")} />
                  }
                />
                <Route
                  path="/meeting"
                  element={<Meeting onLeave={() => navigate("/")} />}
                />
              </Routes>
            </ToastProvider>
          </NotificationProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}

export default App;
