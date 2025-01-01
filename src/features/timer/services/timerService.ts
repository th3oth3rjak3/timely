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

let defaultTime = TimeSpan.add(
  TimeSpan.fromHours(defaultHours),
  TimeSpan.fromMinutes(defaultMinutes),
  TimeSpan.fromSeconds(defaultSeconds)
);

let initialTimer = TimeSpan.fromSeconds(defaultTime.totalSeconds);

const defaultMessage = "Beep beep, time has run out.";

const existingTimerKey = "saved_timer";
const existingInitialTimerKey = "saved_timer_initial_value";

const existingTimer = localStorage.getItem(existingTimerKey);
const existingInitialTimer = localStorage.getItem(existingInitialTimerKey);

if (existingTimer !== null && existingInitialTimer !== null) {
  defaultTime = TimeSpan.fromSeconds(Number(existingTimer));
  initialTimer = TimeSpan.fromSeconds(Number(existingInitialTimer));
  showInfoNotification(
    "Your previous timer has been restored and is currently paused."
  );
}

export const useTimerStore = create<TimerStore>((set, get) => ({
  initialTime: initialTimer.totalSeconds,
  time: defaultTime.totalSeconds,
  isActive: false,
  isPaused: false,
  message: defaultMessage,
  playingSound: false,
  hours: defaultHours,
  minutes: defaultMinutes,
  seconds: defaultSeconds,
  startTimer: () => {
    set({ isActive: true, isPaused: false });
    localStorage.setItem(existingTimerKey, get().time.toString());
    localStorage.setItem(existingInitialTimerKey, get().initialTime.toString());
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

    localStorage.removeItem(existingTimerKey);
    localStorage.removeItem(existingInitialTimerKey);
  },
  resetToDefault: () => {
    set({
      initialTime: defaultTime.totalSeconds,
      time: defaultTime.totalSeconds,
      message: defaultMessage,
      hours: defaultHours,
      minutes: defaultMinutes,
      seconds: defaultSeconds,
    });

    localStorage.removeItem(existingTimerKey);
    localStorage.removeItem(existingInitialTimerKey);
  },
  decrementTime: () => {
    const time = get().time;
    if (time > 0) {
      set({ time: time - 1 });
      localStorage.setItem(existingTimerKey, (time - 1).toString());
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
