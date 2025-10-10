import { createContext, useContext, useState, ReactNode } from "react";
import { Notification } from "../types";

interface NotificationContextType {
  notifications: Notification[];
  addNotification: (message: string) => void;
  markAsRead: (id: number) => void;
  markAllAsRead: () => void;
  unreadCount: number;
}

const NotificationContext = createContext<NotificationContextType | undefined>(
  undefined
);

const initialNotifications: Notification[] = [
  {
    id: 1,
    message: "Welcome to SlotChain! Set up your availability to get started.",
    read: false,
    timestamp: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: 2,
    message: "Your profile has been created successfully.",
    read: false,
    timestamp: new Date(Date.now() - 7200000).toISOString(),
  },
];

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] =
    useState<Notification[]>(initialNotifications);

  const addNotification = (message: string) => {
    const newNotification: Notification = {
      id: Date.now(),
      message,
      read: false,
      timestamp: new Date().toISOString(),
    };
    setNotifications((prev) => [newNotification, ...prev]);
  };

  const markAsRead = (id: number) => {
    setNotifications((prev) =>
      prev.map((notif) => (notif.id === id ? { ...notif, read: true } : notif))
    );
  };

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((notif) => ({ ...notif, read: true })));
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        addNotification,
        markAsRead,
        markAllAsRead,
        unreadCount,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error(
      "useNotifications must be used within a NotificationProvider"
    );
  }
  return context;
}
