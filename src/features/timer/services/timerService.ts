import {create} from "zustand";
import {TimeSpan, TimeSpanLike} from "../../../models/TimeSpan";

export interface TimerStore {
  initialTime: TimeSpanLike;
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

const defaultTime = TimeSpan.add(
  TimeSpan.fromHours(defaultHours),
  TimeSpan.fromMinutes(defaultMinutes),
  TimeSpan.fromSeconds(defaultSeconds)
);
const defaultMessage = "Beep beep, time has run out.";

export const useTimerStore = create<TimerStore>((set, get) => ({
  initialTime: defaultTime.toJSON(),
  time: defaultTime.totalSeconds,
  isActive: false,
  isPaused: false,
  message: defaultMessage,
  playingSound: false,
  hours: defaultHours,
  minutes: defaultMinutes,
  seconds: defaultSeconds,
  startTimer: () => {
    set({isActive: true, isPaused: false});
  },
  pauseTimer: () => {
    set({isPaused: true, isActive: false});
  },
  resetTimer: () => {
    set({
      isActive: false,
      isPaused: false,
      time: get().initialTime.seconds,
      playingSound: false,
    });
  },
  resetToDefault: () => {
    set({
      initialTime: defaultTime.toJSON(),
      time: defaultTime.totalSeconds,
      message: defaultMessage,
      hours: defaultHours,
      minutes: defaultMinutes,
      seconds: defaultSeconds,
    });
  },
  decrementTime: () => {
    const time = get().time;
    if (time > 0) {
      set({time: time - 1});
    }
  },
  setIsPlaying: (playing) => {
    set({playingSound: playing});
  },
  setTimeoutMessage: (message) => {
    set({message});
  },
  setHours: (hours) => {
    const ts = TimeSpan.add(
      TimeSpan.fromHours(hours),
      TimeSpan.fromMinutes(get().minutes),
      TimeSpan.fromSeconds(get().seconds)
    );

    set({hours, initialTime: ts.toJSON(), time: ts.totalSeconds});
  },
  setMinutes: (minutes) => {
    const ts = TimeSpan.add(
      TimeSpan.fromHours(get().hours),
      TimeSpan.fromMinutes(minutes),
      TimeSpan.fromSeconds(get().seconds)
    );

    set({minutes, initialTime: ts.toJSON(), time: ts.totalSeconds});
  },
  setSeconds: (seconds) => {
    const ts = TimeSpan.add(
      TimeSpan.fromHours(get().hours),
      TimeSpan.fromMinutes(get().minutes),
      TimeSpan.fromSeconds(seconds)
    );

    set({seconds, initialTime: ts.toJSON(), time: ts.totalSeconds});
  },
}));
