import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { TimeSpan, TimeSpanLike } from "../../models/TimeSpan";

type TimerProps = {
  initialTime: TimeSpanLike;
  time: number;
  pendingChanges: TimeSpanLike[];
  isActive: boolean;
  isPaused: boolean;
  locked: boolean;
};

const defaultTime = TimeSpan.fromMinutes(15);

const initialState: TimerProps = {
  initialTime: defaultTime.toJSON(),
  time: defaultTime.totalSeconds,
  pendingChanges: [],
  isActive: false,
  isPaused: false,
  locked: false,
};

const timerSlice = createSlice({
  name: "timer",
  initialState,
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
      state.locked = true;
      state.isActive = false;
      state.isPaused = false;
      if (state.pendingChanges.length > 0) {
        state.initialTime =
          state.pendingChanges[state.pendingChanges.length - 1];
        state.pendingChanges = [];
      }
      state.time = state.initialTime.seconds;
      state.locked = false;
    },
    decrementTime: (state) => {
      if (state.locked || state.time <= 0) return;
      state.locked = true;
      if (state.time > 0) {
        state.time -= 1;
      }
      state.locked = false;
    },
    setTime: (state, action: PayloadAction<TimeSpan>) => {
      if (!state.isActive && !state.isPaused) {
        state.initialTime = action.payload.toJSON();
      } else {
        state.pendingChanges.push(action.payload.toJSON());
      }
    },
  },
});

export const { startTimer, pauseTimer, resetTimer, decrementTime, setTime } =
  timerSlice.actions;

export default timerSlice.reducer;
