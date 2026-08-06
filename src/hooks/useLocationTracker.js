import { useEffect } from "react";
import * as Location from "expo-location";
import LOCATION_TASK_NAME from "../tasks/locationTask";

export default function useLocationTracker(isTracking) {
  useEffect(() => {
    if (!isTracking) return;

    const startTracking = async () => {
      const { status: fgStatus } = await Location.requestForegroundPermissionsAsync();
      if (fgStatus !== "granted") {
        console.warn("Foreground location permission denied");
        return;
      }

      const { status: bgStatus } = await Location.requestBackgroundPermissionsAsync();
      if (bgStatus !== "granted") {
        console.warn("Background location permission denied — tracking will pause when screen is off");
      }

      const alreadyRunning = await Location.hasStartedLocationUpdatesAsync(LOCATION_TASK_NAME).catch(() => false);
      if (alreadyRunning) {
        await Location.stopLocationUpdatesAsync(LOCATION_TASK_NAME).catch(() => {});
      }

      await Location.startLocationUpdatesAsync(LOCATION_TASK_NAME, {
        accuracy: Location.Accuracy.High,
        timeInterval: 1000,
        distanceInterval: 5,
        showsBackgroundLocationIndicator: true,
        foregroundService: {
          notificationTitle: "TrackMyRun",
          notificationBody: "Tracking your run...",
          notificationColor: "#36bf21",
        },
      });
    };

    startTracking();

    return () => {
      Location.stopLocationUpdatesAsync(LOCATION_TASK_NAME).catch(() => {});
    };
  }, [isTracking]);
}
