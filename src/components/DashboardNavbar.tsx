import { useState, useRef, useEffect } from "react";
import { Calendar, User, LogOut, Moon, Sun, Menu, X, Bell } from "lucide-react";
import { useTheme } from "../context/ThemeContext";
import { useNotifications } from "../context/NotificationContext";

interface DashboardNavbarProps {
  currentView: "availability" | "profile";
  onViewChange: (view: "availability" | "profile") => void;
  onLogout: () => void;
  walletAddress?: string;
}

export function DashboardNavbar({
  currentView,
  onViewChange,
  onLogout,
  walletAddress,
}: DashboardNavbarProps) {
  const { theme, toggleTheme } = useTheme();
  const { notifications, markAsRead, markAllAsRead, unreadCount } =
    useNotifications();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const notificationRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        notificationRef.current &&
        !notificationRef.current.contains(event.target as Node)
      ) {
        setNotificationOpen(false);
      }
    };

    if (notificationOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [notificationOpen]);

  const navItems = [
    { id: "availability", label: "Availability", icon: Calendar },
    { id: "profile", label: "Profile", icon: User },
  ];

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <nav className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center shadow-lg">
              <Calendar className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-semibold text-gray-900 dark:text-white">
              SlotChain
            </span>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() =>
                    onViewChange(item.id as "availability" | "profile")
                  }
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                    currentView === item.id
                      ? "bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
                      : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {item.label}
                </button>
              );
            })}
          </div>

          {/* Right Section */}
          <div className="flex items-center gap-3">
            {/* Wallet Address (Desktop) */}
            {walletAddress && (
              <div className="hidden lg:block px-3 py-1.5 bg-gray-100 dark:bg-gray-700 rounded-lg">
                <span className="text-xs text-gray-500 dark:text-gray-400 mr-1.5">
                  Wallet:
                </span>
                <span className="text-sm font-mono text-gray-900 dark:text-white">
                  {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
                </span>
              </div>
            )}

            {/* Notifications */}
            <div className="relative" ref={notificationRef}>
              <button
                onClick={() => setNotificationOpen(!notificationOpen)}
                className="relative p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                aria-label="Notifications"
              >
                <Bell className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                )}
              </button>

              {/* Notification Dropdown */}
              {notificationOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden animate-fade-in">
                  <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      Notifications
                    </h3>
                    {unreadCount > 0 && (
                      <button
                        onClick={markAllAsRead}
                        className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        Mark all read
                      </button>
                    )}
                  </div>
                  <div className="max-h-96 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                        No notifications
                      </div>
                    ) : (
                      notifications.map((notif) => (
                        <div
                          key={notif.id}
                          onClick={() => markAsRead(notif.id)}
                          className={`px-4 py-3 border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-750 cursor-pointer transition-colors ${
                            !notif.read
                              ? "bg-blue-50/50 dark:bg-blue-900/10"
                              : ""
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            {!notif.read && (
                              <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="text-sm text-gray-900 dark:text-white">
                                {notif.message}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                {formatTimestamp(notif.timestamp)}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              aria-label="Toggle theme"
            >
              {theme === "light" ? (
                <Moon className="w-5 h-5 text-gray-600 dark:text-gray-300" />
              ) : (
                <Sun className="w-5 h-5 text-gray-600 dark:text-gray-300" />
              )}
            </button>

            {/* Logout (Desktop) */}
            <button
              onClick={onLogout}
              className="hidden md:flex items-center gap-2 px-4 py-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400 transition-all"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              {mobileMenuOpen ? (
                <X className="w-5 h-5 text-gray-600 dark:text-gray-300" />
              ) : (
                <Menu className="w-5 h-5 text-gray-600 dark:text-gray-300" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
          <div className="px-4 py-3 space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    onViewChange(item.id as "availability" | "profile");
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-all ${
                    currentView === item.id
                      ? "bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
                      : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  {item.label}
                </button>
              );
            })}
            <button
              onClick={() => {
                onLogout();
                setMobileMenuOpen(false);
              }}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 font-medium transition-all"
            >
              <LogOut className="w-5 h-5" />
              Logout
            </button>
          </div>
        </div>
      )}
    </nav>
  );
}
