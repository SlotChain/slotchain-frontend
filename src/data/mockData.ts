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
          { id: "1", time: "09:00 AM - 10:00 AM" },
          { id: "2", time: "10:00 AM - 11:00 AM" },
          { id: "3", time: "11:00 AM - 12:00 PM" },
          { id: "4", time: "01:00 PM - 02:00 PM" },
          { id: "5", time: "02:00 PM - 03:00 PM" },
          { id: "6", time: "03:00 PM - 04:00 PM" },
          { id: "7", time: "04:00 PM - 05:00 PM" },
        ],
      },
      {
        date: "2025-10-13",
        slots: [
          { id: "8", time: "09:00 AM - 10:00 AM" },
          { id: "9", time: "10:00 AM - 11:00 AM" },
          { id: "10", time: "11:00 AM - 12:00 PM" },
          { id: "11", time: "01:00 PM - 02:00 PM" },
          { id: "12", time: "02:00 PM - 03:00 PM" },
          { id: "13", time: "03:00 PM - 04:00 PM" },
          { id: "14", time: "04:00 PM - 05:00 PM" },
        ],
      },
      {
        date: "2025-10-14",
        slots: [
          { id: "15", time: "09:00 AM - 10:00 AM" },
          { id: "16", time: "10:00 AM - 11:00 AM" },
          { id: "17", time: "11:00 AM - 12:00 PM" },
          { id: "18", time: "01:00 PM - 02:00 PM" },
          { id: "19", time: "02:00 PM - 03:00 PM" },
          { id: "20", time: "03:00 PM - 04:00 PM" },
          { id: "21", time: "04:00 PM - 05:00 PM" },
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
