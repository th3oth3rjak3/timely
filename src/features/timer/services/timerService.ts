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
}

const defaultHours = 1;
const defaultMinutes = 0;
const defaultSeconds = 0;

const defaultTimer = TimeSpan.add(
  TimeSpan.fromHours(defaultHours),
  TimeSpan.fromMinutes(defaultMinutes),
  TimeSpan.fromSeconds(defaultSeconds)
);

let initialTimer = TimeSpan.fromSeconds(defaultTimer.totalSeconds);
let remainingTime = initialTimer.totalSeconds;

const defaultMessage = "Beep beep, time has run out.";

const existingTimeKey = "saved_timer";
const existingInitialTimeKey = "saved_timer_initial_value";

const existingTime = localStorage.getItem(existingTimeKey);
const existingInitialTime = localStorage.getItem(existingInitialTimeKey);

if (existingTime !== null && existingInitialTime !== null) {
  remainingTime = Number(existingTime);
  initialTimer = TimeSpan.fromSeconds(Number(existingInitialTime));
  showInfoNotification(
    "Your previous timer has been restored and is currently paused."
  );
}

export const useTimerStore = create<TimerStore>((set, get) => ({
  initialTime: initialTimer.totalSeconds,
  time: remainingTime,
  isActive: false,
  isPaused: false,
  message: defaultMessage,
  playingSound: false,
  hours: initialTimer.hours,
  minutes: initialTimer.minutes,
  seconds: initialTimer.seconds,
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
      initialTime: defaultTimer.totalSeconds,
      time: defaultTimer.totalSeconds,
      message: defaultMessage,
      hours: defaultHours,
      minutes: defaultMinutes,
      seconds: defaultSeconds,
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
}));
