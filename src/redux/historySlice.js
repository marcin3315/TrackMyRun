import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Odczyt historii z pamięci przy starcie aplikacji
export const loadHistoryFromStorage = () => async (dispatch) => {
  try {
    const data = await AsyncStorage.getItem("@runHistory");
    const parsed = data ? JSON.parse(data) : [];
    dispatch(setHistoryFromStorage(parsed));
  } catch (e) {
    console.warn("Błąd odczytu historii:", e);
  }
};

// Dodanie biegu i zapisanie historii w pamięci urządzenia
export const addRunAndSave = createAsyncThunk(
  "history/addRunAndSave",
  async (run, { getState, dispatch }) => {
    dispatch(addRunToHistory(run));

    const allRuns = getState().history.runs;
    try {
      await AsyncStorage.setItem("@runHistory", JSON.stringify(allRuns));
    } catch (e) {
      console.warn("Błąd zapisu historii:", e);
    }
  },
);

// Wyczyszczenie historii i pamięci
export const clearHistoryAndStorage = createAsyncThunk(
  "history/clearHistoryAndStorage",
  async (_, { dispatch }) => {
    dispatch(clearHistory());
    try {
      await AsyncStorage.removeItem("@runHistory");
    } catch (e) {
      console.warn("Błąd usuwania historii:", e);
    }
  },
);

// Slice z reducerami
const historySlice = createSlice({
  name: "history",
  initialState: {
    runs: [],
    loading: false,
    error: null,
  },
  reducers: {
    addRunToHistory: (state, action) => {
      state.runs.push(action.payload);
    },
    clearHistory: (state) => {
      state.runs = [];
    },
    setHistoryFromStorage: (state, action) => {
      state.runs = action.payload || [];
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(addRunAndSave.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addRunAndSave.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(addRunAndSave.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Błąd zapisu danych";
      })
      .addCase(clearHistoryAndStorage.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(clearHistoryAndStorage.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(clearHistoryAndStorage.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Błąd czyszczenia historii";
      });
  },
});

export const { addRunToHistory, clearHistory, setHistoryFromStorage } =
  historySlice.actions;
export default historySlice.reducer;
