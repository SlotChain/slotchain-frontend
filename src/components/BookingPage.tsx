import { useState, useEffect } from 'react';
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Globe,
  Clock,
} from 'lucide-react';
import moment from 'moment-timezone';
import { TimeSlot, AvailableDay } from '../types';
import BookingModal from './BookingModal';
import { backendUrl } from '../utils/backend';

interface BookingPageProps {
  walletAddress: string;
}

export function BookingPage({ walletAddress }: BookingPageProps) {
  // fetched state
  const [userData, setUserData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentDayIndex, setCurrentDayIndex] = useState(0);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [selectedSlotDate, setSelectedSlotDate] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [bookedSlots, setBookedSlots] = useState<Set<string>>(new Set());

  const formatSlotLabel = (
    date: string,
    start: string,
    end: string,
    timezone: string,
  ) => {
    try {
      const safeTz = timezone || 'UTC';
      const startMoment = moment.tz(
        `${date} ${start}`,
        'YYYY-MM-DD HH:mm',
        safeTz,
      );
      const endMoment = moment.tz(`${date} ${end}`, 'YYYY-MM-DD HH:mm', safeTz);
      return `${startMoment.format('h:mm A')} - ${endMoment.format('h:mm A')}`;
    } catch (err) {
      return `${start} - ${end}`;
    }
  };

  const resolveIpfsUri = (uri?: string | null) => {
    if (!uri || typeof uri !== 'string') return '';
    if (uri.startsWith('ipfs://')) {
      const cid = uri.replace('ipfs://', '');
      return `https://orange-solid-cattle-398.mypinata.cloud/ipfs/${cid}`;
    }
    return uri;
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch(
        backendUrl(`/availability/getAvailability/${walletAddress}`),
      );

      const userProfile = await fetch(
        backendUrl(`/auth/user/${walletAddress}`),
      );

      if (!res.ok || !userProfile.ok)
        throw new Error(`HTTP ${res.status} or ${userProfile.status}`);

      const json = await res.json();
      const data = json?.data;
      const profileJson = await userProfile.json();
      const profile = profileJson?.data?.user;

      if (!data) throw new Error('No data found');

      const timezone = data.timezone || 'UTC';
      const nowInTimezone = moment.tz(timezone);

      // 🧩 Transform API shape → UI shape
      const normalizedDays = data.availableDays
        .map((day: any) => {
          const dayStart = moment.tz(
            `${day.date} 00:00`,
            'YYYY-MM-DD HH:mm',
            timezone,
          );
          if (dayStart.isBefore(nowInTimezone, 'day')) {
            return null;
          }

          const slots = day.slots.map((t: any) => {
            const slotEndMoment = moment.tz(
              `${day.date} ${t.end}`,
              'YYYY-MM-DD HH:mm',
              timezone,
            );
            const isUpcoming = slotEndMoment.isSameOrAfter(nowInTimezone);
            const id = `${day.date}-${t.start}`; // UI-friendly ID

            return {
              id, // local UI ID
              _id: t._id, // ✅ preserve MongoDB _id for booking
              start: t.start,
              end: t.end,
              booked: t.booked,
              time: formatSlotLabel(day.date, t.start, t.end, timezone),
              available: !t.booked && isUpcoming,
              isPast: !isUpcoming,
              walletAddress: walletAddress,
            };
          });

          return {
            date: day.date,
            slots,
          };
        })
        .filter((day: any) => day && day.slots.length > 0);

      const normalizedData = {
        user: {
          fullName: profile.fullName || 'Unknown User',
          bio: profile.bio || 'No bio provided.',
          profilePhoto: resolveIpfsUri(profile.profilePhoto),
          hourlyRate: profile.hourlyRate || '$50/hr',
        },
        availableDays: normalizedDays,
        timezone,
        duration: data.interval || 60,
      };

      setUserData(normalizedData);
    } catch (err) {
      console.error('Failed to fetch booking data', err);
      setUserData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!walletAddress) return;

    fetchData();
  }, [walletAddress]);

  useEffect(() => {
    if (!userData?.availableDays?.length) {
      setCurrentDayIndex(0);
      return;
    }

    setCurrentDayIndex((prev) =>
      Math.min(prev, userData.availableDays.length - 1),
    );
  }, [userData?.availableDays?.length]);

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

  const handleSlotClick = (slot: TimeSlot) => {
    if ((slot.available ?? !slot.booked) && !bookedSlots.has(slot._id)) {
      setSelectedSlot(slot);
      setSelectedSlotDate(currentDay.date);
      setIsModalOpen(true);
    }
  };

  const handleBookingComplete = () => {
    if (!selectedSlot) return;
    setBookedSlots((prev) => new Set([...prev, selectedSlot._id]));
  };

  const isSlotBooked = (slotId: string) => bookedSlots.has(slotId);

  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedSlot(null);
    setSelectedSlotDate(null);
  };

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
                      {userData.user.hourlyRate} USDT{' '}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-slate-100">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <div className="text-sm text-slate-100">Duration</div>
                    <div className="font-semibold">
                      {userData.duration} minutes
                    </div>
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
                  <input
                    type="text"
                    readOnly
                    value={userData.timezone || 'UTC'}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-transparent transition-all cursor-not-allowed text-center"
                  />
                  <p className="mt-2 text-xs text-slate-100">
                    Times shown exactly match the creator&rsquo;s availability.
                  </p>
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
                  {currentDay?.slots?.map((slot: TimeSlot) => {
                    const isBooked = isSlotBooked(slot._id);
                    const isAvailable =
                      (slot.available ?? !slot.booked) && !isBooked;
                    const statusLabel = isBooked
                      ? 'Booked'
                      : slot.isPast
                        ? 'Unavailable'
                        : 'Unavailable';
                    const disabledClasses = slot.isPast
                      ? 'bg-slate-700 text-slate-300 border border-slate-600 cursor-not-allowed'
                      : 'bg-red-500 text-white border-2 border-red-700 cursor-not-allowed';

                    return (
                      <button
                        key={slot._id}
                        onClick={() => handleSlotClick(slot)}
                        disabled={!isAvailable}
                        className={`w-full px-6 py-4 rounded-xl font-medium transition-all ${
                          isAvailable
                            ? 'bg-slate-800 hover:bg-blue-900 text-slate-100 border-2 border-slate-200 hover:border-slate-300 hover:shadow-md cursor-pointer'
                            : disabledClasses
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span>
                            {slot.time ??
                              formatSlotLabel(
                                currentDay.date,
                                slot.start,
                                slot.end,
                                userData.timezone || 'UTC',
                              )}
                          </span>
                          {!isAvailable && (
                            <span className="text-sm">{statusLabel}</span>
                          )}
                        </div>
                      </button>
                    );
                  })}

                  {/* {currentDay.slots.every(
                    (slot: TimeSlot) =>
                      !(slot.available ?? !slot.booked) ||
                      isSlotBooked(slot._id),
                  ) && (
                    <div className="mt-6 text-center p-6 bg-slate-50 rounded-xl border border-slate-200">
                      <p className="text-slate-100">
                        No available slots for this day. Try selecting another
                        date.
                      </p>
                    </div>
                  )} */}
                </div>

                {/* {currentDay.slots.every(
                  (slot: TimeSlot) =>
                    !(slot.available ?? !slot.booked) || isSlotBooked(slot._id),
                ) && (
                  <div className="mt-6 text-center p-6 bg-slate-50 rounded-xl border border-slate-200">
                    <p className="text-slate-100">
                      No available slots for this day. Try selecting another
                      date.
                    </p>
                  </div>
                )} */}
              </div>
            </div>
          </div>
        </div>
      </div>

      <BookingModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        slot={selectedSlot}
        date={selectedSlotDate || ''}
        userName={userData.user.fullName}
        hourlyRate={userData.user.hourlyRate}
        creatorAddress={walletAddress}
        onBookingComplete={handleBookingComplete}
        creatorEmail={userData.user.email}
        creatorName={userData.user.fullName}
        creatorTimezone={userData.timezone || 'UTC'}
      />
    </div>
  );
}
