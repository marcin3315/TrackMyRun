import * as TaskManager from "expo-task-manager";
import store from "../redux/store";
import { addLocation } from "../redux/runSlice";

const LOCATION_TASK_NAME = "background-location-task";

TaskManager.defineTask(LOCATION_TASK_NAME, ({ data, error }) => {
  if (error) {
    console.error("Błąd śledzenia w tle:", error);
    return;
  }

  const location = data?.locations?.[0];
  if (location) {
    const { latitude, longitude } = location.coords;
    const timestamp = location.timestamp;
    store.dispatch(addLocation({ latitude, longitude, timestamp }));
  }
});

export default LOCATION_TASK_NAME;
