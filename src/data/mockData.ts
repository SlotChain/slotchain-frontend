import { BookingData } from "../types";
export const mockUsers: Record<string, BookingData> = {
  "0x1234...abcd": {
    user: {
      walletAddress: "0x1234...abcd",
      fullName: "zulkefalkhan",
      email: "a@a.com",
      bio: "Blockchain consultant & Web3 advisor. Let's discuss your project!",
      profilePhoto:
        "https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=200",
      hourlyRate: "0.05 ETH",
      currency: "ETH",
      bookingLink: "https://slotchain.io/book/0x1234...abcd",
    },
    timezone: "UTC",
    availableDays: [
      {
        date: "2025-10-12",
        slots: [
          { id: "1", time: "09:00 AM - 10:00 AM", available: true },
          { id: "2", time: "10:00 AM - 11:00 AM", available: false },
          { id: "3", time: "11:00 AM - 12:00 PM", available: true },
          { id: "4", time: "01:00 PM - 02:00 PM", available: true },
          { id: "5", time: "02:00 PM - 03:00 PM", available: false },
          { id: "6", time: "03:00 PM - 04:00 PM", available: true },
          { id: "7", time: "04:00 PM - 05:00 PM", available: true },
        ],
      },
      {
        date: "2025-10-13",
        slots: [
          { id: "8", time: "09:00 AM - 10:00 AM", available: true },
          { id: "9", time: "10:00 AM - 11:00 AM", available: true },
          { id: "10", time: "11:00 AM - 12:00 PM", available: false },
          { id: "11", time: "01:00 PM - 02:00 PM", available: true },
          { id: "12", time: "02:00 PM - 03:00 PM", available: true },
          { id: "13", time: "03:00 PM - 04:00 PM", available: false },
          { id: "14", time: "04:00 PM - 05:00 PM", available: true },
        ],
      },
      {
        date: "2025-10-14",
        slots: [
          { id: "15", time: "09:00 AM - 10:00 AM", available: false },
          { id: "16", time: "10:00 AM - 11:00 AM", available: true },
          { id: "17", time: "11:00 AM - 12:00 PM", available: true },
          { id: "18", time: "01:00 PM - 02:00 PM", available: true },
          { id: "19", time: "02:00 PM - 03:00 PM", available: true },
          { id: "20", time: "03:00 PM - 04:00 PM", available: true },
          { id: "21", time: "04:00 PM - 05:00 PM", available: false },
        ],
      },
    ],
  },
};

// ===== Timezones =====
export const timezones = [
  "UTC-12:00",
  "UTC-11:00",
  "UTC-10:00",
  "UTC-09:00",
  "UTC-08:00",
  "UTC-07:00",
  "UTC-06:00",
  "UTC-05:00",
  "UTC-04:00",
  "UTC-03:00",
  "UTC-02:00",
  "UTC-01:00",
  "UTC",
  "UTC+01:00",
  "UTC+02:00",
  "UTC+03:00",
  "UTC+04:00",
  "UTC+05:00",
  "UTC+06:00",
  "UTC+07:00",
  "UTC+08:00",
  "UTC+09:00",
  "UTC+10:00",
  "UTC+11:00",
  "UTC+12:00",
];
