import { useEffect, useState } from "react";
import { Plus, Trash2, Clock, Globe } from "lucide-react";
import { TimeSlot, WeekAvailability } from "../types";
import { useToast } from "../context/ToastContext";
import { useNotifications } from "../context/NotificationContext";
import moment from "moment-timezone";

interface AvailabilityViewProps {
  walletAddress: string;
  onWalletChange?: (wallet: string) => void;
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

const DEFAULT_SLOT: TimeSlot = { start: "09:00", end: "17:00", id: "" };

export function AvailabilityView({
  walletAddress,
  onWalletChange,
}: AvailabilityViewProps) {
  const wallet = walletAddress;
  const [saving, setSaving] = useState(false);
  const { showToast } = useToast();
  const { addNotification } = useNotifications();
  const allTimezones = moment.tz.names();
  const [timezone, setTimezone] = useState(moment.tz.guess());
  const [interval, setInterval] = useState<number>(30);

  const today = moment().format("YYYY-MM-DD");
  // temporary inputs for adding an unavailable range (do NOT reuse rangeStart/rangeEnd)
  const [tempUnavailableStart, setTempUnavailableStart] =
    useState<string>(today);
  const [tempUnavailableEnd, setTempUnavailableEnd] = useState<string>(
    moment().add(1, "days").format("YYYY-MM-DD")
  );

  const [rangeStart, setRangeStart] = useState<string>(today);
  const [rangeEnd, setRangeEnd] = useState<string>(
    moment().add(30, "days").format("YYYY-MM-DD")
  );
  const [infinite, setInfinite] = useState<boolean>(false);

  const [unavailableRanges, setUnavailableRanges] = useState<
    { start: string; end: string }[]
  >([]);
  const [dailyRecords, setDailyRecords] = useState<
    {
      date: string;
      slots: { start: string; end: string }[];
      interval?: number;
    }[]
  >([]);

  const [availability, setAvailability] = useState<WeekAvailability>({
    monday: { enabled: false, slots: [] },
    tuesday: { enabled: false, slots: [] },
    wednesday: { enabled: false, slots: [] },
    thursday: { enabled: false, slots: [] },
    friday: { enabled: false, slots: [] },
    saturday: { enabled: false, slots: [] },
    sunday: { enabled: false, slots: [] },
  });
  /** 🔹 Fetch existing availability */
  const fetchAvailability = async () => {
    if (!wallet) return;

    try {
      const res = await fetch(
        `http://localhost:5000/api/availability/getAvailability/${wallet}`
      );
      if (!res.ok) throw new Error(`Failed: ${res.status}`);
      const json = await res.json();

      const result = json?.data;
      if (!result) return;
    } catch (err) {
      console.error("fetchAvailability", err);
    }
  };

  useEffect(() => {
    if (wallet) fetchAvailability();
  }, [wallet]);

  const generateDateRange = (start: string, end: string, maxDays = 365) => {
    const result: string[] = [];
    let cur = moment(start, "YYYY-MM-DD");
    const last = moment(end, "YYYY-MM-DD");
    while (cur.isSameOrBefore(last) && result.length < maxDays) {
      result.push(cur.format("YYYY-MM-DD"));
      cur.add(1, "day");
    }
    return result;
  };

  const weekdayKeyFromDate = (dateStr: string): keyof WeekAvailability =>
    moment(dateStr, "YYYY-MM-DD")
      .format("dddd")
      .toLowerCase() as keyof WeekAvailability;

  const isDateInUnavailable = (dateStr: string) => {
    const d = moment(dateStr, "YYYY-MM-DD");
    return unavailableRanges.some((r) =>
      d.isBetween(moment(r.start), moment(r.end), "day", "[]")
    );
  };

  /** 🔹 Save availability */
  const handleSave = async () => {
    if (!wallet) {
      showToast("Please connect your wallet first.", "info");
      return;
    }

    setSaving(true);

    try {
      const INTERVAL = interval;
      const finalEnd = infinite
        ? moment(rangeStart).add(365, "days").format("YYYY-MM-DD")
        : rangeEnd;

      const allDates = generateDateRange(rangeStart, finalEnd);

      // 🔹 Build structured availability for all weekdays in each date
      const availableDays = allDates
        .filter((d) => !isDateInUnavailable(d))
        .map((d) => {
          const dayAvailability: Record<
            keyof WeekAvailability,
            { start: string; end: string }[]
          > = {
            monday: [],
            tuesday: [],
            wednesday: [],
            thursday: [],
            friday: [],
            saturday: [],
            sunday: [],
          };

          // 🔸 For each weekday, copy its enabled slots pattern
          (Object.keys(availability) as (keyof WeekAvailability)[]).forEach(
            (weekdayKey) => {
              const dayData = availability[weekdayKey];
              if (dayData.enabled) {
                const slots = dayData.slots.flatMap((slot) =>
                  splitIntoIntervals(slot.start, slot.end, INTERVAL)
                );
                dayAvailability[weekdayKey] = slots;
              }
            }
          );

          return { date: d, availability: dayAvailability };
        });

      // 🔹 Final payload
      const payload = {
        timezone,
        interval: INTERVAL,
        range: {
          start: rangeStart,
          end: infinite ? null : rangeEnd,
          infinite,
        },
        unavailableRanges,
        availableDays, // ✅ full weekly pattern per date
      };

      // 🔹 Save to backend
      const res = await fetch(
        `http://localhost:5000/api/availability/${wallet}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );

      const response = await res.json();
      if (!res.ok || !response) throw new Error("Failed to save");

      await fetchAvailability();
      showToast("Availability saved successfully!", "success");
      addNotification("Your availability was updated.");
    } catch (err) {
      console.error("❌ Save failed", err);
      showToast("Error saving availability", "error");
    } finally {
      setSaving(false);
    }
  };

  /** 🔹 Utility for slot splitting */
  const splitIntoIntervals = (start: string, end: string, interval: number) => {
    const slots: { start: string; end: string }[] = [];
    let current = moment(start, "HH:mm");
    const endMoment = moment(end, "HH:mm");
    while (current.isBefore(endMoment)) {
      const next = moment(current).add(interval, "minutes");
      if (next.isAfter(endMoment)) break;
      slots.push({ start: current.format("HH:mm"), end: next.format("HH:mm") });
      current = next;
    }
    return slots;
  };

  const normalizeAndMergeRanges = (
    ranges: { start: string; end: string }[]
  ) => {
    if (ranges.length === 0) return [];

    // sort by start
    const sorted = [...ranges].sort((a, b) =>
      moment(a.start).isBefore(moment(b.start)) ? -1 : 1
    );

    const merged: { start: string; end: string }[] = [];
    let current = { ...sorted[0] };

    for (let i = 1; i < sorted.length; i++) {
      const r = sorted[i];
      // if overlapping or contiguous (end >= next.start - 1 day), merge
      if (moment(r.start).isSameOrBefore(moment(current.end).add(1, "day"))) {
        // extend end if needed
        if (moment(r.end).isAfter(moment(current.end))) {
          current.end = r.end;
        }
      } else {
        merged.push(current);
        current = { ...r };
      }
    }
    merged.push(current);
    return merged;
  };

  const handleAddUnavailable = () => {
    if (!tempUnavailableStart) return;
    const start = tempUnavailableStart;
    const end = tempUnavailableEnd || tempUnavailableStart;

    // Basic validation: start must be <= end
    if (moment(start).isAfter(moment(end))) {
      showToast("Unavailable start must be before or equal to end", "error");
      return;
    }

    setUnavailableRanges((prev) => {
      const next = [...prev, { start, end }];
      return normalizeAndMergeRanges(next);
    });

    // optional: reset temp inputs or set to next default
    setTempUnavailableStart(start);
    setTempUnavailableEnd(moment(end).add(1, "days").format("YYYY-MM-DD"));
  };

  const handleRemoveUnavailable = (index: number) =>
    setUnavailableRanges((prev) => prev.filter((_, i) => i !== index));

  const toggleDay = (day: keyof WeekAvailability) =>
    setAvailability((prev) => {
      const wasEnabled = prev[day].enabled;

      return {
        ...prev,
        [day]: {
          enabled: !wasEnabled,
          slots: !wasEnabled ? [{ ...DEFAULT_SLOT }] : [], // add default when enabling
        },
      };
    });

  const addTimeSlot = (day: keyof WeekAvailability) =>
    setAvailability((prev) => ({
      ...prev,
      [day]: { ...prev[day], slots: [...prev[day].slots, { ...DEFAULT_SLOT }] },
    }));

  const removeTimeSlot = (day: keyof WeekAvailability, index: number) =>
    setAvailability((prev) => ({
      ...prev,
      [day]: {
        ...prev[day],
        slots: prev[day].slots.filter((_, i) => i !== index),
      },
    }));

  const updateTimeSlot = (
    day: keyof WeekAvailability,
    i: number,
    field: "start" | "end",
    val: string
  ) =>
    setAvailability((prev) => ({
      ...prev,
      [day]: {
        ...prev[day],
        slots: prev[day].slots.map((slot, idx) =>
          idx === i ? { ...slot, [field]: val } : slot
        ),
      },
    }));

  /** 🔹 Count preview */
  const previewGeneratedCount = () => {
    const finalEnd = infinite
      ? moment(rangeStart).add(365, "days").format("YYYY-MM-DD")
      : rangeEnd;
    const allDates = generateDateRange(rangeStart, finalEnd);
    return allDates.filter((d) => {
      const weekdayKey = weekdayKeyFromDate(d);
      return availability[weekdayKey].enabled && !isDateInUnavailable(d);
    }).length;
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

      {/* Interval + Date Range */}
      <div className="mb-6 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 transition-colors">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Slot length
            </label>
            <select
              value={interval}
              onChange={(e) => setInterval(Number(e.target.value))}
              className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value={15}>15 minutes</option>
              <option value={30}>30 minutes</option>
              <option value={45}>45 minutes</option>
              <option value={60}>60 minutes</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Range start
            </label>
            <input
              type="date"
              value={rangeStart}
              onChange={(e) => setRangeStart(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Range end / Infinite
            </label>
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={rangeEnd}
                onChange={(e) => setRangeEnd(e.target.value)}
                disabled={infinite}
                className="flex-1 px-3 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
              <label className="inline-flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={infinite}
                  onChange={(e) => setInfinite(e.target.checked)}
                />{" "}
                Infinite
              </label>
            </div>
          </div>
        </div>

        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Unavailable ranges (optional)
          </label>
          <div className="flex gap-2 items-center">
            <input
              type="date"
              value={tempUnavailableStart}
              onChange={(e) => setTempUnavailableStart(e.target.value)}
              className="px-3 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
            <input
              type="date"
              value={tempUnavailableEnd}
              onChange={(e) => setTempUnavailableEnd(e.target.value)}
              className="px-3 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
            <button
              onClick={handleAddUnavailable}
              className="px-3 py-2 bg-red-50 text-red-700 rounded-lg"
            >
              Add
            </button>
          </div>

          {unavailableRanges.length > 0 && (
            <div className="mt-3 space-y-2">
              {unavailableRanges.map((r, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between gap-2 bg-gray-50 dark:bg-gray-900/30 p-2 rounded-lg"
                >
                  <div className="text-sm">
                    {r.start} → {r.end}
                  </div>
                  <button
                    onClick={() => handleRemoveUnavailable(i)}
                    className="text-red-600"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="mt-3 text-sm text-gray-600 dark:text-gray-400">
            Preview will generate{" "}
            <span className="font-medium">{previewGeneratedCount()}</span> date
            records using {interval}-minute slots (unavailable dates are
            excluded).
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden transition-colors">
        <div className="divide-y divide-gray-200 dark:divide-gray-700">
          {DAYS.map(({ key, label }) => {
            const dayData = availability[key];
            return (
              <div
                key={key}
                className="p-6 hover:bg-gray-500 dark:hover:bg-gray-750 transition-colors"
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
          title={
            !wallet
              ? "Connect or login to save availability"
              : "Save availability"
          }
          className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium rounded-lg shadow-sm hover:shadow-md transition-all disabled:cursor-not-allowed"
        >
          {saving
            ? "Saving..."
            : !wallet
            ? "Connect to save"
            : "Save Availability"}
        </button>
      </div>

      {/* Saved per-date records from backend */}
      <div className="mt-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
          Saved Daily Slots
        </h3>
        {dailyRecords.length === 0 ? (
          <p className="text-sm text-gray-600 dark:text-gray-400">
            No per-date records saved yet.
          </p>
        ) : (
          <div className="space-y-3">
            {dailyRecords.map((rec) => (
              <div
                key={rec.date}
                className="p-3 bg-white dark:bg-gray-800 border rounded-lg"
              >
                <div className="flex items-center justify-between">
                  <div className="font-medium">{rec.date}</div>
                  <div className="text-sm text-gray-500">
                    {rec.interval ? `${rec.interval}m slots` : "slots"}
                  </div>
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {rec.slots.map((s, i) => (
                    <div
                      key={i}
                      className="px-3 py-1.5 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-lg text-sm"
                    >
                      {s.start} - {s.end}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
