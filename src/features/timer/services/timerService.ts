import { create } from "zustand";
import { TimeSpan } from "../../../models/TimeSpan";
import { showInfoNotification } from "../../../utilities/notificationUtilities";

export interface TimerStore {
  initialTime: number;
  time: number;
  isActive: boolean;
  isPaused: boolean;
  message: string;
  playingSound: boolean;
  hours: number;
  minutes: number;
  seconds: number;
  defaultTimer: TimeSpan;
  startTimer: () => void;
  pauseTimer: () => void;
  resetTimer: () => void;
  resetToDefault: () => void;
  decrementTime: () => void;
  setIsPlaying: (isPlaying: boolean) => void;
  setTimeoutMessage: (message: string) => void;
  setHours: (hours: number) => void;
  setMinutes: (minutes: number) => void;
  setSeconds: (second: number) => void;
  setDefaultTimer: (timer: TimeSpan) => void;
}
const defaultTimer = TimeSpan.fromSeconds(0);
let initialTimer = TimeSpan.fromSeconds(defaultTimer.totalSeconds);
let remainingTime = initialTimer.totalSeconds;

const defaultMessage = "Beep beep, time has run out.";

const existingTimeKey = "saved_timer";
const existingInitialTimeKey = "saved_timer_initial_value";

const existingTime = localStorage.getItem(existingTimeKey);
const existingInitialTime = localStorage.getItem(existingInitialTimeKey);
let isPaused = false;

if (existingTime !== null && existingInitialTime !== null) {
  remainingTime = Number(existingTime);
  initialTimer = TimeSpan.fromSeconds(Number(existingInitialTime));
  isPaused = true;
  showInfoNotification(
    "Your previous timer has been restored and is currently paused."
  );
}

export const useTimerStore = create<TimerStore>((set, get) => ({
  initialTime: initialTimer.totalSeconds,
  time: remainingTime,
  isActive: false,
  isPaused,
  message: defaultMessage,
  playingSound: false,
  hours: initialTimer.hours,
  minutes: initialTimer.minutes,
  seconds: initialTimer.seconds,
  defaultTimer: TimeSpan.fromSeconds(0),
  startTimer: () => {
    set({ isActive: true, isPaused: false });
    localStorage.setItem(existingTimeKey, get().time.toString());
    localStorage.setItem(existingInitialTimeKey, get().initialTime.toString());
  },
  pauseTimer: () => {
    set({ isPaused: true, isActive: false });
  },
  resetTimer: () => {
    set({
      isActive: false,
      isPaused: false,
      time: get().initialTime,
      playingSound: false,
    });

    localStorage.removeItem(existingTimeKey);
    localStorage.removeItem(existingInitialTimeKey);
  },
  resetToDefault: () => {
    set({
      initialTime: get().defaultTimer.totalSeconds,
      time: get().defaultTimer.totalSeconds,
      message: defaultMessage,
      hours: get().defaultTimer.hours,
      minutes: get().defaultTimer.minutes,
      seconds: get().defaultTimer.seconds,
    });

    localStorage.removeItem(existingTimeKey);
    localStorage.removeItem(existingInitialTimeKey);
  },
  decrementTime: () => {
    const time = get().time;
    if (time > 0) {
      set({ time: time - 1 });
      localStorage.setItem(existingTimeKey, (time - 1).toString());
    }
  },
  setIsPlaying: (playing) => {
    set({ playingSound: playing });
  },
  setTimeoutMessage: (message) => {
    set({ message });
  },
  setHours: (hours) => {
    const ts = TimeSpan.add(
      TimeSpan.fromHours(hours),
      TimeSpan.fromMinutes(get().minutes),
      TimeSpan.fromSeconds(get().seconds)
    );

    set({ hours, initialTime: ts.totalSeconds, time: ts.totalSeconds });
  },
  setMinutes: (minutes) => {
    const ts = TimeSpan.add(
      TimeSpan.fromHours(get().hours),
      TimeSpan.fromMinutes(minutes),
      TimeSpan.fromSeconds(get().seconds)
    );

    set({ minutes, initialTime: ts.totalSeconds, time: ts.totalSeconds });
  },
  setSeconds: (seconds) => {
    const ts = TimeSpan.add(
      TimeSpan.fromHours(get().hours),
      TimeSpan.fromMinutes(get().minutes),
      TimeSpan.fromSeconds(seconds)
    );

    set({ seconds, initialTime: ts.totalSeconds, time: ts.totalSeconds });
  },
  setDefaultTimer: (timer) => {
    set({ defaultTimer: timer });
    if (!get().isActive && !get().isPaused) {
      set({
        initialTime: timer.totalSeconds,
        time: timer.totalSeconds,
        hours: timer.hours,
        minutes: timer.minutes,
        seconds: timer.seconds,
      });
    }
  },
}));
