import { configureStore } from "@reduxjs/toolkit";
import runReducer from "./runSlice";
import historyReducer from "./historySlice";

const store = configureStore({
  reducer: {
    run: runReducer,
    history: historyReducer,
  },
});

export default store;
