import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { TimeSpan, TimeSpanLike } from "../../models/TimeSpan";

interface TimerProps {
  initialTime: TimeSpanLike;
  time: number;
  isActive: boolean;
  isPaused: boolean;
  message: string;
  playingSound: boolean;
  hours: number;
  minutes: number;
  seconds: number;
};
const defaultHours = 1;
const defaultMinutes = 0;
const defaultSeconds = 0;
const defaultTime = TimeSpan.add(
  TimeSpan.fromHours(defaultHours),
  TimeSpan.fromMinutes(defaultMinutes),
  TimeSpan.fromSeconds(defaultSeconds)
);
const defaultMessage = "Beep beep, time has run out.";
const initialState: TimerProps = {
  initialTime: defaultTime.toJSON(),
  time: defaultTime.totalSeconds,
  isActive: false,
  isPaused: false,
  message: defaultMessage,
  playingSound: false,
  hours: defaultHours,
  minutes: defaultMinutes,
  seconds: defaultSeconds,
};

const timerSlice = createSlice({
  name: "timer",
  initialState: initialState,
  reducers: {
    startTimer: (state) => {
      state.isActive = true;
      state.isPaused = false;
    },
    pauseTimer: (state) => {
      state.isPaused = true;
      state.isActive = false;
    },
    resetTimer: (state) => {
      state.isActive = false;
      state.isPaused = false;
      state.time = state.initialTime.seconds;
      state.playingSound = false;
    },
    resetToDefault: (state) => {
      state.initialTime = defaultTime.toJSON();
      state.time = defaultTime.totalSeconds;
      state.message = defaultMessage;
      state.hours = defaultHours;
      state.minutes = defaultMinutes;
      state.seconds = defaultSeconds;
    },
    decrementTime: (state) => {
      if (state.time > 0) {
        state.time -= 1;
      }
    },
    setIsPlaying: (state, action: PayloadAction<boolean>) => {
      state.playingSound = action.payload;
    },
    setTimeoutMessage: (state, action: PayloadAction<string>) => {
      state.message = action.payload;
    },
    setHours: (state, action: PayloadAction<number>) => {
      const ts = TimeSpan.add(
        TimeSpan.fromHours(action.payload),
        TimeSpan.fromMinutes(state.minutes),
        TimeSpan.fromSeconds(state.seconds)
      );
      state.hours = action.payload;
      state.initialTime = ts.toJSON();
      state.time = ts.totalSeconds;
    },
    setMinutes: (state, action: PayloadAction<number>) => {
      const ts = TimeSpan.add(
        TimeSpan.fromHours(state.hours),
        TimeSpan.fromMinutes(action.payload),
        TimeSpan.fromSeconds(state.seconds)
      );

      state.minutes = action.payload;
      state.initialTime = ts.toJSON();
      state.time = ts.totalSeconds;
    },
    setSeconds: (state, action: PayloadAction<number>) => {
      const ts = TimeSpan.add(
        TimeSpan.fromHours(state.hours),
        TimeSpan.fromMinutes(state.minutes),
        TimeSpan.fromSeconds(action.payload)
      );

      state.seconds = action.payload;
      state.initialTime = ts.toJSON();
      state.time = ts.totalSeconds;
    },
  },
});

export const {
  startTimer,
  pauseTimer,
  resetTimer,
  decrementTime,
  setIsPlaying,
  setTimeoutMessage,
  resetToDefault,
  setHours,
  setMinutes,
  setSeconds,
} = timerSlice.actions;

export default timerSlice.reducer;
