//dodawanie nowej lokalizacji GPS do stanu aplikacji w Reduxie
//rejestrowanie kolejnych punktów trasy podczas biegu

import React, { useState, useEffect, useRef } from "react";
import { View, Button, StyleSheet, Text, TextInput, Alert } from "react-native";
import * as Speech from "expo-speech";
import MapView, { Polyline, Marker } from "react-native-maps";
import { useSelector, useDispatch } from "react-redux";
import {
  startRun,
  stopRun,
  resetRun,
  pauseRun,
  resumeRun,
} from "../redux/runSlice";
import useLocationTracker from "../hooks/useLocationTracker";
import { selectDistance } from "../redux/runSlice";
import { addRunAndSave } from "../redux/historySlice";

export default function RunScreen() {
  const dispatch = useDispatch();
  const [isTracking, setIsTracking] = useState(false);
  const [startTime, setStartTime] = useState(null);
  const [duration, setDuration] = useState(0);
  const [pausedAt, setPausedAt] = useState(null);
  const [totalPausedTime, setTotalPausedTime] = useState(0);
  const [targetInput, setTargetInput] = useState("");
  const [targetDistance, setTargetDistance] = useState(null);
  const goalAlertShown = useRef(false);
  const lastAnnouncedKm = useRef(0);

  const locations = useSelector((state) => state.run.locations);
  const isRunning = useSelector((state) => state.run.isRunning);
  const isPaused = useSelector((state) => state.run.isPaused);
  const { loading, error } = useSelector((state) => state.history);
  const distance = useSelector(selectDistance);

  const currentLocation = locations[locations.length - 1];
  const speed = duration > 0 ? (distance / (duration / 3600)).toFixed(2) : "0";

  useLocationTracker(isTracking, isPaused);

  useEffect(() => {
    if (isTracking) {
      setStartTime(Date.now());
    }
  }, [isTracking]);

  useEffect(() => {
    let timer = null;

    if (isTracking && !isPaused && startTime) {
      timer = setInterval(() => {
        setDuration(
          Math.floor((Date.now() - startTime - totalPausedTime) / 1000),
        );
      }, 1000);
    }

    return () => clearInterval(timer);
  }, [isTracking, isPaused, startTime]);

  useEffect(() => {
    if (targetDistance && distance >= targetDistance && !goalAlertShown.current) {
      goalAlertShown.current = true;
    }
  }, [distance, targetDistance]);

  useEffect(() => {
    if (!isTracking) return;
    const completedKm = Math.floor(distance);
    if (completedKm > 0 && completedKm > lastAnnouncedKm.current) {
      lastAnnouncedKm.current = completedKm;
      Speech.speak(`You have run ${completedKm} kilometer${completedKm > 1 ? "s" : ""}. Your average speed is ${speed} kilometers per hour.`, { language: "en-US" });
    }
  }, [distance, isTracking]);

  const handleStart = () => {
    const parsed = parseFloat(targetInput);
    setTargetDistance(parsed > 0 ? parsed : null);
    goalAlertShown.current = false;
    dispatch(startRun());
    setIsTracking(true);
  };

  const handleStop = () => {
    setIsTracking(false);
    lastAnnouncedKm.current = 0;
    goalAlertShown.current = false;
    dispatch(stopRun());

    const endTime = Date.now();
    const timeInSeconds = Math.floor(
      (endTime - startTime - totalPausedTime) / 1000,
    );
    const totalDistance = distance; // w km
    const averageSpeed =
      timeInSeconds > 0 ? totalDistance / (timeInSeconds / 3600) : 0;

    const runData = {
      id: Date.now(),
      startTime,
      endTime,
      duration: timeInSeconds,
      distance: totalDistance,
      averageSpeed,
      route: locations,
    };

    dispatch(addRunAndSave(runData));
    dispatch(resetRun());
    setDuration(0);
    setStartTime(null);
    setTotalPausedTime(0);
  };

  const handleReset = () => {
    dispatch(resetRun());
    setDuration(0);
    setStartTime(null);
    setTargetDistance(null);
    setTargetInput("");
    goalAlertShown.current = false;
    lastAnnouncedKm.current = 0;
  };

  const handlePause = () => {
    setPausedAt(Date.now());
    dispatch(pauseRun());
  };
  const handleResume = () => {
    if (pausedAt) {
      const pauseTime = Date.now() - pausedAt;
      setTotalPausedTime((prev) => prev + pauseTime);
      setPausedAt(null);
    }
    dispatch(resumeRun());
  };

  if (!isRunning) {
    return (
      <View style={styles.setupContainer}>
        <Text style={styles.setupTitle}>Set distance in km:</Text>
        <TextInput
          style={styles.targetInput}
          keyboardType="decimal-pad"
          value={targetInput}
          onChangeText={setTargetInput}
        />
        <Button title="Start" onPress={handleStart} />
        {error && <Text style={{ color: "red", marginTop: 8 }}>{error}</Text>}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        showsUserLocation
        followsUserLocation
        region={
          currentLocation
            ? {
                latitude: currentLocation.latitude,
                longitude: currentLocation.longitude,
                latitudeDelta: 0.005,
                longitudeDelta: 0.005,
              }
            : undefined
        }
      >
        {locations.length > 0 && (
          <>
            <Polyline
              coordinates={locations}
              strokeColor="blue"
              strokeWidth={6}
            />
            <Marker coordinate={locations[0]} title="Start" pinColor="red" />
          </>
        )}
      </MapView>

      <View style={styles.stats}>
        <Text>Duration: {Math.floor(duration / 60)}m {duration % 60}s</Text>
        <Text>Distance: {distance.toFixed(2)} km</Text>
        <Text>Speed: {speed} km/h</Text>
        {targetDistance && (
          <Text style={distance >= targetDistance ? styles.goalReached : styles.goalPending}>
            Goal: {distance.toFixed(2)} / {targetDistance} km
            {distance >= targetDistance ? " ✓" : ""}
          </Text>
        )}
      </View>

      <View style={styles.controls}>
        <Button title="Stop" onPress={handleStop} />
        {!isPaused
          ? <Button title="Pause" onPress={handlePause} />
          : <Button title="Resume" onPress={handleResume} />
        }
        <Button title="Reset" onPress={handleReset} />
        {loading && <Text> Saving...</Text>}
        {error && <Text style={{ color: "red" }}>{error}</Text>}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },
  setupContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
    gap: 20,
  },
  setupTitle: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 8,
  },
  controls: {
    position: "absolute",
    bottom: 200,
    alignSelf: "center",
    flexDirection: "row",
    gap: 10,
  },
  stats: {
    position: "absolute",
    top: 40,
    left: 20,
    backgroundColor: "rgba(255,255,255,0.9)",
    padding: 10,
    borderRadius: 8,
  },
  targetInput: {
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 16,
    width: 200,
    textAlign: "center",
  },
  goalPending: {
    marginTop: 4,
    color: "#007AFF",
    fontWeight: "600",
  },
  goalReached: {
    marginTop: 4,
    color: "#34C759",
    fontWeight: "700",
  },
});
