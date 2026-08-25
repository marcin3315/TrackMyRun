//zarządzanie aktywnym biegiem
import { createSlice } from "@reduxjs/toolkit";
import { calculateDistance } from "../utils/calculateDistance";

const initialState = {
  isRunning: false,
  isPaused: false,
  startTime: null,
  locations: [],
  segments: [],
};

const runSlice = createSlice({
  name: "run",
  initialState,
  reducers: {
    startRun: (state) => {
      state.isRunning = true;
      state.isPaused = false;
      state.startTime = Date.now();
      state.locations = [];
      state.segments = [[]];
    },
    stopRun: (state) => {
      state.isRunning = false;
    },
    pauseRun: (state) => {
      state.isPaused = true;
    },

    resumeRun: (state) => {
      state.isPaused = false;
      state.segments.push([]);
    },

    addLocation: (state, action) => {
      const { latitude, longitude, timestamp } = action.payload || {};
      const isPaused = state.isPaused;

      // Sprawdza poprawność danych
      const isValid =
        typeof latitude === "number" &&
        typeof longitude === "number" &&
        !isNaN(latitude) &&
        !isNaN(longitude) &&
        Math.abs(latitude) <= 90 &&
        Math.abs(longitude) <= 180;

      if (!isValid) {
        console.warn("Nieprawidłowe dane lokalizacji:", action.payload);
        return; // nie dodaje błędnych danych
      }

      if (isPaused) return;

      state.locations.push({ latitude, longitude, timestamp });
      state.segments[state.segments.length - 1].push({ latitude, longitude });
    },

    resetRun: () => initialState,
  },
});

//selector do obliczania dystansu w czasie rzeczywistym na podstawie lokalizacji
export const selectDistance = (state) => {
  return state.run.segments.reduce((total, seg) => {
    if (seg.length < 2) return total;
    return total + calculateDistance(seg);
  }, 0);
};

export const { startRun, stopRun, addLocation, resetRun, pauseRun, resumeRun } =
  runSlice.actions;
export default runSlice.reducer;
