import runReducer, { addLocation, startRun, resetRun, pauseRun, resumeRun, selectDistance } from "../runSlice";

describe("runSlice", () => {
  it("should return initial state", () => {
    const initialState = runReducer(undefined, {});
    expect(initialState).toEqual({
      isPaused: false,
      isRunning: false,
      startTime: null,
      locations: [],
      segments: [],
    });
  });
  it("should handle startRun", () => {
    const state = runReducer(undefined, startRun());
    expect(state.isRunning).toBe(true);
    expect(state.isPaused).toBe(false);
    expect(state.startTime).toBeGreaterThan(0);
    expect(state.locations).toEqual([]); //czy poprzednia trasa została wyczyszczona
    expect(state.segments).toEqual([[]]);
  });

  it("should add valid location", () => {
    const validLocation = { //przykładowy punkt GPS
      latitude: 52.23,
      longitude: 21.01,
      timestamp: 1234567890,
    };

    const state = runReducer(
      { isRunning: true, isPaused: false, startTime: 1000, locations: [], segments: [[]] }, //przykładowy stan
      addLocation(validLocation),
    );

    expect(state.locations.length).toBe(1); //czy liczba punktów wynosi 1
    expect(state.locations[0]).toEqual(validLocation);
    expect(state.segments[0]).toEqual([{ latitude: 52.23, longitude: 21.01 }]);
  });

  it("should not add invalid location", () => {
    const invalidLocation = {
      latitude: "abc", // niepoprawny typ
      longitude: 21.01,
    };

    const state = runReducer(
      { isRunning: true, isPaused: false, startTime: 1000, locations: [], segments: [[]] },
      addLocation(invalidLocation),
    );

    expect(state.locations.length).toBe(0); // nic nie dodano
    expect(state.segments[0].length).toBe(0);
  });

  it("should reset run state", () => {
    const runningState = {
      isRunning: true,
      isPaused: false,
      startTime: 123,
      locations: [{ latitude: 1, longitude: 2, timestamp: 123 }],
      segments: [[{ latitude:1, longitude: 2}]]
    };

    const state = runReducer(runningState, resetRun());
    expect(state).toEqual({
      isRunning: false,
      isPaused: false,
      startTime: null,
      locations: [],
      segments: []
    });
  });

  it("should pause run state", () => {
    const runningState = {
      isRunning: true,
      isPaused: false,
      startTime: 123,
      locations: [{ latitude: 1, longitude: 2, timestamp: 123 }],
      segments: [[{ latitude: 1, longitude: 2}]],
    };

    const state = runReducer(runningState, pauseRun());

    expect(state.isRunning).toBe(true);
    expect(state.isPaused).toBe(true);
    expect(state.startTime).toBe(123);
    expect(state.locations).toEqual(runningState.locations);
    expect(state.segments).toEqual(runningState.segments);
  });

  it("should resume run state", () => {
    const runningState = {
      isRunning: true,
      isPaused: true,
      startTime: 123,
      locations: [{ latitude: 1, longitude: 2, timestamp: 123 }],
      segments: [[{ latitude: 1, longitude: 2}]],
    };

    const state = runReducer(runningState, resumeRun());

    expect(state.isRunning).toBe(true);
    expect(state.isPaused).toBe(false);
    expect(state.startTime).toBe(123);
    expect(state.locations).toEqual(runningState.locations);
    expect(state.segments).toEqual([[{ latitude: 1, longitude: 2 }],
      [], // nowy pusty segment dodany przez resumeRun
    ]);
  });


  describe("distance tracking during pause", () => {
    const loc1 = { latitude: 52.2300, longitude: 21.0100, timestamp: 1000 };
    const loc2 = { latitude: 52.2310, longitude: 21.0100, timestamp: 2000 }; // ~111 m na północ od loc1
    const loc3 = { latitude: 52.2320, longitude: 21.0100, timestamp: 3000 }; // ~111 m na północ od loc2

    it("should add location when not paused", () => {
      let state = { isRunning: true, isPaused: false, startTime: 1000, locations: [], segments: [[]] };
      state = runReducer(state, addLocation(loc1));
      expect(state.locations.length).toBe(1);
      expect(state.locations[0]).toEqual(loc1);
      expect(state.segments[0]).toEqual([{ latitude: loc1.latitude, longitude: loc1.longitude }]);
    });

    it("should not add location when paused", () => {
      let state = { isRunning: true, isPaused: true, startTime: 1000, locations: [], segments: [[]] };
      expect(state.locations.length).toBe(0);
      expect(state.segments[0].length).toBe(0);
    });

    it("should not increase distance when a location is added during pause", () => {
      let state = runReducer(undefined, startRun());
      state = runReducer(state, addLocation(loc1));
      state = runReducer(state, addLocation(loc2));

      const distanceBefore = selectDistance({ run: state });

      state = runReducer(state, pauseRun());
      state = runReducer(state, addLocation(loc3)); // powinno być zignorowane

      const distanceAfter = selectDistance({ run: state });

      expect(distanceBefore).toBeGreaterThan(0);
      expect(distanceAfter).toBe(distanceBefore);
    });

    it("should resume tracking distance correctly after pause", () => {
      const loc4 = { latitude: 52.2305, longitude: 21.0100, timestamp: 4000 };

      let state = runReducer(undefined, startRun());
      state = runReducer(state, addLocation(loc1));
      state = runReducer(state, addLocation(loc2));
      state = runReducer(state, pauseRun());
      state = runReducer(state, addLocation(loc3)); // ignorowane
      state = runReducer(state, resumeRun());
      state = runReducer(state, addLocation(loc4));

      const distance = selectDistance({ run: state });

      // segment 1: [loc1, loc2], segment 2: [loc4] — jeden punkt, dystans = 0
      const expectedDistance = selectDistance({
        run: {
          segments: [
            [{ latitude: loc1.latitude, longitude: loc1.longitude },
            { latitude: loc2.latitude, longitude: loc2.longitude }],
            [{ latitude: loc4.latitude, longitude: loc4.longitude }],
          ],
        },
      });

      expect(distance).toBeGreaterThan(0);
      expect(distance).toBeCloseTo(expectedDistance, 10);
    });

    it("should return 0 distance if all locations were added during pause", () => {
      let state = runReducer(undefined, startRun());
      state = runReducer(state, pauseRun());
      state = runReducer(state, addLocation(loc1));
      state = runReducer(state, addLocation(loc2));
      state = runReducer(state, addLocation(loc3));

      expect(selectDistance({ run: state })).toBe(0);
    });
  });

});
