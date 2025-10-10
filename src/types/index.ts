export interface User {
  walletAddress: string;
  fullName: string;
  email: string;
  bio: string;
  profilePhoto: string | null;
  hourlyRate: string;
  currency: string;
}
export interface TimeSlot {
  start: string;
  end: string;
}

export interface DayAvailability {
  enabled: boolean;
  slots: TimeSlot[];
}

export interface WeekAvailability {
  monday: DayAvailability;
  tuesday: DayAvailability;
  wednesday: DayAvailability;
  thursday: DayAvailability;
  friday: DayAvailability;
  saturday: DayAvailability;
  sunday: DayAvailability;
}

export interface ProfileData {
  username: string;
  email: string;
  walletAddress: string;
  hourlyRate: string;
  bio: string;
  profilePicture: string;
}

export interface Notification {
  id: number;
  message: string;
  read: boolean;
  timestamp: string;
}

export interface UserData {
  user: ProfileData;
  availability: {
    timezone: string;
    days: WeekAvailability;
  };
  notifications: Notification[];
}
