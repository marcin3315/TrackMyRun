import runReducer, { addLocation, startRun, resetRun, pauseRun, resumeRun, selectDistance } from "../runSlice";

describe("runSlice", () => {
  it("should return initial state", () => {
    const initialState = runReducer(undefined, {});
    expect(initialState).toEqual({
      isRunning: false,
      isPaused: false,
      startTime: null,
      locations: [],
    });
  });

  it("should handle startRun", () => {
    const state = runReducer(undefined, startRun());
    expect(state.isRunning).toBe(true);
    expect(state.isPaused).toBe(false);
    expect(state.startTime).toBeDefined(); //czy nie jest null ani undefined
    expect(state.locations).toEqual([]); //czy poprzednia trasa została wyczyszczona
  });

  it("should add valid location", () => {
    const validLocation = { //przykładowy punkt GPS
      latitude: 52.23,
      longitude: 21.01,
      timestamp: 1234567890,
    };

    const state = runReducer(
      { isRunning: true, startTime: 1000, locations: [] }, //przykładowy stan
      addLocation(validLocation),
    );

    expect(state.locations.length).toBe(1); //czy liczba punktów wynosi 1
    expect(state.locations[0]).toEqual(validLocation);
  });

  it("should not add invalid location", () => {
    const invalidLocation = {
      latitude: "abc", // niepoprawny typ
      longitude: 21.01,
    };

    const state = runReducer(
      { isRunning: true, startTime: 1000, locations: [] },
      addLocation(invalidLocation),
    );

    expect(state.locations.length).toBe(0); // nic nie dodano
  });

  it("should reset run state", () => {
    const runningState = {
      isRunning: true,
      isPaused: false,
      startTime: 123,
      locations: [{ latitude: 1, longitude: 2, timestamp: 123 }],
    };

    const state = runReducer(runningState, resetRun());
    expect(state).toEqual({
      isRunning: false,
      isPaused: false,
      startTime: null,
      locations: [],
    });
  });

  it("should pause run state", () => {
    const runningState = {
      isRunning: true,
      isPaused: false,
      startTime: 123,
      locations: [{ latitude: 1, longitude: 2, timestamp: 123 }],
    };

    const state = runReducer(runningState, pauseRun());

    expect(state.isRunning).toBe(true);
    expect(state.isPaused).toBe(true);
    expect(state.startTime).toBe(123);
    expect(state.locations).toEqual(runningState.locations);
  });

  it("should resume run state", () => {
    const runningState = {
      isRunning: true,
      isPaused: true,
      startTime: 123,
      locations: [{ latitude: 1, longitude: 2, timestamp: 123 }],
    };

    const state = runReducer(runningState, resumeRun());

    expect(state.isRunning).toBe(true);
    expect(state.isPaused).toBe(false);
    expect(state.startTime).toBe(123);
    expect(state.locations).toEqual(runningState.locations);
  });


  describe("distance tracking during pause", () => {
    const loc1 = { latitude: 52.2300, longitude: 21.0100, timestamp: 1000 };
    const loc2 = { latitude: 52.2310, longitude: 21.0100, timestamp: 2000 }; // ~111 m na północ od loc1
    const loc3 = { latitude: 52.2320, longitude: 21.0100, timestamp: 3000 }; // ~111 m na północ od loc2

    it("should mark locations added while running as not paused", () => {
      let state = { isRunning: true, isPaused: false, startTime: 1000, locations: [] };
      state = runReducer(state, addLocation(loc1));
      expect(state.locations[0].paused).toBe(false);
    });

    it("should mark locations added during pause as paused", () => {
      let state = { isRunning: true, isPaused: true, startTime: 1000, locations: [] };
      state = runReducer(state, addLocation(loc1));
      expect(state.locations[0].paused).toBe(true);
    });

    it("should not increase distance when a location is added during pause", () => {
      const stateBeforePause = {
        run: {
          locations: [
            { ...loc1, paused: false },
            { ...loc2, paused: false },
          ],
        },
      };
      const distanceBefore = selectDistance(stateBeforePause);

      const stateWithPausedPoint = {
        run: {
          locations: [
            { ...loc1, paused: false },
            { ...loc2, paused: false },
            { ...loc3, paused: true },
          ],
        },
      };
      const distanceAfterPause = selectDistance(stateWithPausedPoint);

      expect(distanceBefore).toBeGreaterThan(0);
      expect(distanceAfterPause).toBe(distanceBefore);
    });

    it("should resume tracking distance correctly after pause", () => {
      const loc4 = { latitude: 52.2305, longitude: 21.0100, timestamp: 4000 };

      let state = { isRunning: true, isPaused: false, startTime: 1000, locations: [] };
      state = runReducer(state, addLocation(loc1));
      state = runReducer(state, addLocation(loc2));
      state = runReducer(state, pauseRun());
      state = runReducer(state, addLocation(loc3)); // paused
      state = runReducer(state, resumeRun());
      state = runReducer(state, addLocation(loc4));

      const distance = selectDistance({ run: state });

      // tylko z aktywnych punktów [loc1, loc2, loc4]
      const expectedDistance = selectDistance({
        run: {
          locations: [
            { ...loc1, paused: false },
            { ...loc2, paused: false },
            { ...loc4, paused: false },
          ],
        },
      });

      expect(distance).toBeGreaterThan(0);
      expect(distance).toBeCloseTo(expectedDistance, 10);
    });

    it("should return 0 distance if all locations were added during pause", () => {
      const state = {
        run: {
          locations: [
            { ...loc1, paused: true },
            { ...loc2, paused: true },
            { ...loc3, paused: true },
          ],
        },
      };
      expect(selectDistance(state)).toBe(0);
    });
  });
});
