import { useState } from "react";
import { Plus, Trash2, Clock, Globe } from "lucide-react";
import { TimeSlot, DayAvailability, WeekAvailability } from "../types";
import { useToast } from "../context/ToastContext";
import { useNotifications } from "../context/NotificationContext";
import moment from "moment-timezone";

interface AvailabilityViewProps {
  walletAddress: string;
}
const DAYS = [
  { key: "monday", label: "Monday" },
  { key: "tuesday", label: "Tuesday" },
  { key: "wednesday", label: "Wednesday" },
  { key: "thursday", label: "Thursday" },
  { key: "friday", label: "Friday" },
  { key: "saturday", label: "Saturday" },
  { key: "sunday", label: "Sunday" },
] as const;

const DEFAULT_SLOT: TimeSlot = { start: "09:00", end: "17:00" };

export function AvailabilityView({ walletAddress }: AvailabilityViewProps) {
  const wallet = walletAddress;
  const [saving, setSaving] = useState(false);
  const { showToast } = useToast();
  const { addNotification } = useNotifications();
  const allTimezones = moment.tz.names(); // ✅ Full list of global timezones
  const [timezone, setTimezone] = useState(moment.tz.guess()); // user's local zone

  const [availability, setAvailability] = useState<WeekAvailability>({
    monday: { enabled: true, slots: [{ ...DEFAULT_SLOT }] },
    tuesday: { enabled: true, slots: [{ ...DEFAULT_SLOT }] },
    wednesday: { enabled: true, slots: [{ ...DEFAULT_SLOT }] },
    thursday: { enabled: true, slots: [{ ...DEFAULT_SLOT }] },
    friday: { enabled: true, slots: [{ ...DEFAULT_SLOT }] },
    saturday: { enabled: false, slots: [] },
    sunday: { enabled: false, slots: [] },
  });

  const toggleDay = (day: keyof WeekAvailability) => {
    setAvailability((prev) => ({
      ...prev,
      [day]: {
        enabled: !prev[day].enabled,
        slots: !prev[day].enabled ? [{ ...DEFAULT_SLOT }] : [],
      },
    }));
  };

  const addTimeSlot = (day: keyof WeekAvailability) => {
    setAvailability((prev) => ({
      ...prev,
      [day]: {
        ...prev[day],
        slots: [...prev[day].slots, { ...DEFAULT_SLOT }],
      },
    }));
  };

  const removeTimeSlot = (day: keyof WeekAvailability, index: number) => {
    setAvailability((prev) => ({
      ...prev,
      [day]: {
        ...prev[day],
        slots: prev[day].slots.filter((_, i) => i !== index),
      },
    }));
  };

  const updateTimeSlot = (
    day: keyof WeekAvailability,
    index: number,
    field: "start" | "end",
    value: string
  ) => {
    setAvailability((prev) => ({
      ...prev,
      [day]: {
        ...prev[day],
        slots: prev[day].slots.map((slot, i) =>
          i === index ? { ...slot, [field]: value } : slot
        ),
      },
    }));
  };

  // const handleSave = async () => {
  //   setSaving(true);

  //   await new Promise((resolve) => setTimeout(resolve, 1500));

  //   console.log("Saving availability:", { timezone, availability });

  //   setSaving(false);
  //   showToast("Availability saved successfully!", "success");
  //   addNotification("Your availability was updated.");
  // };

  const handleSave = async () => {
    setSaving(true);

    const payload = {
      timezone,
      ...availability,
    };

    try {
      const res = await fetch(
        `http://localhost:5000/api/availability/${wallet}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );

      const data = await res.json();
      console.log("Saved availability:", data);

      showToast("Availability saved successfully!", "success");
      addNotification("Your availability was updated.");
    } catch (err) {
      showToast("Error saving availability", "error");
    } finally {
      setSaving(false);
    }
  };

  const getAvailableSlots = () => {
    return DAYS.filter(
      ({ key }) =>
        availability[key].enabled && availability[key].slots.length > 0
    ).map(({ key, label }) => ({
      day: label,
      slots: availability[key].slots,
    }));
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Set Your Availability
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Define when you're available for meetings throughout the week
        </p>
      </div>

      {/* Timezone Selector */}
      <div className="mb-6 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 transition-colors">
        <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
          <Globe className="w-4 h-4" />
          Timezone
        </label>
        <select
          value={timezone}
          onChange={(e) => setTimezone(e.target.value)}
          className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
        >
          {allTimezones.map((tz) => (
            <option key={tz} value={tz}>
              {tz}
            </option>
          ))}
        </select>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden transition-colors">
        <div className="divide-y divide-gray-200 dark:divide-gray-700">
          {DAYS.map(({ key, label }) => {
            const dayData = availability[key];
            return (
              <div
                key={key}
                className="p-6 hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors"
              >
                <div className="flex items-start gap-4">
                  {/* Day Toggle */}
                  <div className="flex items-center gap-3 w-40 flex-shrink-0">
                    <button
                      onClick={() => toggleDay(key)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        dayData.enabled
                          ? "bg-blue-600"
                          : "bg-gray-200 dark:bg-gray-700"
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          dayData.enabled ? "translate-x-6" : "translate-x-1"
                        }`}
                      />
                    </button>
                    <span
                      className={`font-medium ${
                        dayData.enabled
                          ? "text-gray-900 dark:text-white"
                          : "text-gray-400 dark:text-gray-500"
                      }`}
                    >
                      {label}
                    </span>
                  </div>

                  {/* Time Slots */}
                  <div className="flex-1 space-y-3">
                    {dayData.enabled && dayData.slots.length === 0 && (
                      <button
                        onClick={() => addTimeSlot(key)}
                        className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        Add time slot
                      </button>
                    )}

                    {dayData.enabled &&
                      dayData.slots.map((slot, index) => (
                        <div
                          key={index}
                          className="flex items-center gap-3 flex-wrap"
                        >
                          <input
                            type="time"
                            value={slot.start}
                            onChange={(e) =>
                              updateTimeSlot(
                                key,
                                index,
                                "start",
                                e.target.value
                              )
                            }
                            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                          />
                          <span className="text-gray-500 dark:text-gray-400">
                            to
                          </span>
                          <input
                            type="time"
                            value={slot.end}
                            onChange={(e) =>
                              updateTimeSlot(key, index, "end", e.target.value)
                            }
                            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                          />
                          {dayData.slots.length > 1 && (
                            <button
                              onClick={() => removeTimeSlot(key, index)}
                              className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                              aria-label="Remove time slot"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      ))}

                    {dayData.enabled && dayData.slots.length > 0 && (
                      <button
                        onClick={() => addTimeSlot(key)}
                        className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        <Plus className="w-4 h-4" />
                        Add another time slot
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Save Button */}
      <div className="mt-6">
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium rounded-lg shadow-sm hover:shadow-md transition-all disabled:cursor-not-allowed"
        >
          {saving ? "Saving..." : "Save Availability"}
        </button>
      </div>

      {/* Preview Schedule */}
      {getAvailableSlots().length > 0 && (
        <div className="mt-8 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 transition-colors">
          <h2 className="flex items-center gap-2 text-xl font-semibold text-gray-900 dark:text-white mb-4">
            <Clock className="w-5 h-5" />
            Preview Schedule
          </h2>
          <div className="space-y-4">
            {getAvailableSlots().map(({ day, slots }) => (
              <div key={day} className="flex items-start gap-4">
                <div className="w-32 flex-shrink-0 font-medium text-gray-700 dark:text-gray-300">
                  {day}
                </div>
                <div className="flex-1 space-y-2">
                  {slots.map((slot, idx) => (
                    <div
                      key={idx}
                      className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-lg text-sm font-medium mr-2"
                    >
                      {slot.start} - {slot.end}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Timezone:{" "}
              <span className="font-medium text-gray-900 dark:text-white">
                Current selection:{" "}
                <span className="font-medium">{timezone}</span>
              </span>
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
