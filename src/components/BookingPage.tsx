import { useState, useEffect } from "react";
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Globe,
  Clock,
} from "lucide-react";
import { mockUsers, timezones } from "../data/mockData";
import moment from "moment-timezone";
import { TimeSlot, AvailableDay } from "../types";
import BookingModal from "./BookingModal";

interface BookingPageProps {
  walletAddress: string;
}

export function BookingPage({ walletAddress }: BookingPageProps) {
  // fetched state
  const [userData, setUserData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedTimezone, setSelectedTimezone] = useState("UTC");
  const [currentDayIndex, setCurrentDayIndex] = useState(0);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [bookedSlots, setBookedSlots] = useState<Set<string>>(new Set());

  const formatTimeRange = (start: string, end: string) => {
    try {
      const s = moment(start, "HH:mm").format("h:mm A");
      const e = moment(end, "HH:mm").format("h:mm A");
      return `${s} - ${e}`;
    } catch (err) {
      return `${start} - ${end}`;
    }
  };

  useEffect(() => {
    if (!walletAddress) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch availability from backend
        const res = await fetch(
          `http://localhost:5000/api/availability/getAvailability/${walletAddress}`
        );

        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const payload = await res.json();
        // payload expected shape: { success: true, data: { weekly, daily } }
        if (payload?.success && payload?.data) {
          const data = payload.data;

          // Build availableDays for the booking UI
          let availableDays: any[] = [];

          if (Array.isArray(data.daily) && data.daily.length > 0) {
            availableDays = data.daily.map((d: any) => ({
              date: d.date,
              slots: (d.slots || []).map((s: any, idx: number) => ({
                id: `${d.date}-${s.start}-${idx}`,
                time: formatTimeRange(s.start, s.end),
                available: true,
              })),
            }));
          } else if (data.weekly) {
            // Expand weekly pattern into the next 14 days
            const daysToGenerate = 14;
            const results: any[] = [];
            for (let i = 0; i < daysToGenerate; i++) {
              const day = moment().add(i, "days").format("YYYY-MM-DD");
              const weekday = moment(day, "YYYY-MM-DD")
                .format("dddd")
                .toLowerCase();
              const dayPattern = data[weekday] || data.weekly?.[weekday];
              if (
                dayPattern &&
                dayPattern.enabled &&
                Array.isArray(dayPattern.slots) &&
                dayPattern.slots.length > 0
              ) {
                const slots = dayPattern.slots.map((s: any, idx: number) => ({
                  id: `${day}-${s.start || s.time || idx}`,
                  time:
                    s.start && s.end
                      ? formatTimeRange(s.start, s.end)
                      : s.time || `${s.start} - ${s.end}`,
                  available: true,
                }));
                results.push({ date: day, slots });
              }
            }
            availableDays = results;
          }

          const user = data.user ||
            mockUsers[walletAddress]?.user || {
              walletAddress,
              fullName: walletAddress,
              profilePhoto: "",
              hourlyRate: "",
            };

          const final = {
            user,
            timezone:
              data.weekly?.timezone ||
              data.timezone ||
              mockUsers[walletAddress]?.timezone ||
              "UTC",
            availableDays,
          };

          console.log("Fetched booking data", final);

          setUserData(final);
          setSelectedTimezone(final.timezone);
          setCurrentDayIndex(0);
        } else {
          setUserData(mockUsers[walletAddress] || null);
          setSelectedTimezone(mockUsers[walletAddress]?.timezone || "UTC");
        }
      } catch (err) {
        console.error("Failed to fetch booking data", err);
        setUserData(mockUsers[walletAddress] || null);
        setSelectedTimezone(mockUsers[walletAddress]?.timezone || "UTC");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [walletAddress]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-slate-100">Loading booking...</div>
      </div>
    );
  }

  if (!userData) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-slate-100 mb-2">
            User not found
          </h1>
          <p className="text-slate-100">
            The booking page you're looking for doesn't exist.
          </p>
        </div>
      </div>
    );
  }

  console.log("Current day:", userData);

  if (userData.availableDays.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-slate-100 mb-2">
            No available days
          </h1>
          <p className="text-slate-100">
            The user has not set up any available days for booking.
          </p>
        </div>
      </div>
    );
  }

  const currentDay: AvailableDay = userData.availableDays[currentDayIndex];
  const canGoPrevious = currentDayIndex > 0;
  const canGoNext = currentDayIndex < userData.availableDays.length - 1;

  const handlePreviousDay = () => {
    if (canGoPrevious) {
      setCurrentDayIndex(currentDayIndex - 1);
    }
  };

  const handleNextDay = () => {
    if (canGoNext) {
      setCurrentDayIndex(currentDayIndex + 1);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  };

  const handleSlotClick = (slot: TimeSlot) => {
    if (slot.available && !bookedSlots.has(slot.id)) {
      setSelectedSlot(slot);
      setIsModalOpen(true);
    }
  };

  const handleBookingComplete = () => {
    if (selectedSlot) {
      setBookedSlots(new Set([...bookedSlots, selectedSlot.id]));
    }
  };

  const isSlotBooked = (slotId: string) => bookedSlots.has(slotId);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors flex flex-col">
      <div className="flex-1 max-w-5xl mx-auto px-4 py-12 w-full">
        <div className="mb-8">
          <a
            href="/"
            className="inline-flex items-center gap-2 text-slate-100 hover:text-slate-100 transition-colors mb-6"
          >
            <Calendar className="w-5 h-5 text-xl font-semibold text-gray-900 dark:text-white" />
            <span className=" text-xl font-semibold text-gray-900 dark:text-white">
              SlotChain
            </span>
          </a>
        </div>

        <div className="grid lg:grid-cols-5 gap-8 ">
          <div className="lg:col-span-2 ">
            <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm border border-slate-700 rounded-2xl p-8">
              <img
                src={userData.user.profilePhoto}
                alt={userData.user.fullName}
                className="w-24 h-24 rounded-full border-4 border-slate-100 mb-6"
              />
              <h1 className="text-3xl font-bold text-slate-100 mb-2">
                {userData.user.fullName}
              </h1>
              <p className="text-slate-100 mb-6">{userData.user.bio}</p>

              <div className="space-y-4">
                <div className="flex items-center gap-3 text-slate-100">
                  <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center">
                    <Clock className="w-5 h-5 text-slate-600" />
                  </div>
                  <div>
                    <div className="text-sm text-slate-100">Hourly Rate</div>
                    <div className="font-semibold text-lg text-slate-100">
                      {userData.user.hourlyRate}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-slate-100">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <div className="text-sm text-slate-100">Duration</div>
                    <div className="font-semibold">60 minutes</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-3">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
              <div className="bg-gradient-to-r from-slate-800 to-slate-900 px-8 py-6">
                <h2 className="text-2xl font-semibold text-white mb-1">
                  Select a Time
                </h2>
                <p className="text-slate-100">
                  Choose your preferred time slot
                </p>
              </div>

              <div className="p-8 bg-gradient-to-r from-slate-700 to-slate-800">
                <div className="mb-6">
                  <label className="block text-sm font-medium text-slate-100 mb-2">
                    <Globe className="w-4 h-4 inline mr-2" />
                    Timezone
                  </label>
                  <select
                    value={selectedTimezone}
                    onChange={(e) => setSelectedTimezone(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-transparent transition-all"
                  >
                    {timezones.map((tz) => (
                      <option key={tz} value={tz}>
                        {tz}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <button
                      onClick={handlePreviousDay}
                      disabled={!canGoPrevious}
                      className="p-2 rounded-lg hover:bg-slate-100 transition-colors disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent"
                    >
                      <ChevronLeft className="w-5 h-5 text-slate-100" />
                    </button>
                    <div className="text-center">
                      <div className="text-lg font-semibold text-slate-100">
                        {currentDay.date}
                      </div>
                    </div>
                    <button
                      onClick={handleNextDay}
                      disabled={!canGoNext}
                      className="p-2 rounded-lg hover:bg-slate-100 transition-colors disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent"
                    >
                      <ChevronRight className="w-5 h-5 text-slate-100" />
                    </button>
                  </div>

                  <div className="text-sm text-slate-100 text-center mb-6">
                    Day {currentDayIndex + 1} of {userData.availableDays.length}
                  </div>
                </div>

                <div className="space-y-3">
                  {currentDay.slots.map((slot: TimeSlot) => {
                    const isAvailable =
                      slot.available && !isSlotBooked(slot.id);
                    return (
                      <button
                        key={slot.id}
                        onClick={() => handleSlotClick(slot)}
                        disabled={!isAvailable}
                        className={`w-full px-6 py-4 rounded-xl font-medium transition-all ${
                          isAvailable
                            ? "bg-slate-800 hover:bg-blue-900 text-slate-100 border-2 border-slate-200 hover:border-slate-300 hover:shadow-md cursor-pointer"
                            : "bg-slate-500 text-slate-100 border-2 border-slate-200 cursor-not-allowed"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span>{slot.time}</span>
                          {!isAvailable && (
                            <span className="text-sm">
                              {isSlotBooked(slot.id) ? "Booked" : "Unavailable"}
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>

                {currentDay.slots.every(
                  (slot: TimeSlot) => !slot.available || isSlotBooked(slot.id)
                ) && (
                  <div className="mt-6 text-center p-6 bg-slate-50 rounded-xl border border-slate-200">
                    <p className="text-slate-100">
                      No available slots for this day. Try selecting another
                      date.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <BookingModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        slot={selectedSlot}
        date={currentDay.date}
        userName={userData.user.fullName}
        hourlyRate={userData.user.hourlyRate}
        onBookingComplete={handleBookingComplete}
      />
    </div>
  );
}
