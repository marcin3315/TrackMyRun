//dodawanie nowej lokalizacji GPS do stanu aplikacji w Reduxie
//rejestrowanie kolejnych punktów trasy podczas biegu

import React, { useState, useEffect, useRef } from "react";
import { View, StyleSheet, Text, TextInput, TouchableOpacity, ImageBackground, Linking } from "react-native";
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
import { useFonts, FasterOne_400Regular } from "@expo-google-fonts/faster-one";

export default function RunScreen({ navigation }) {
  const [fontsLoaded] = useFonts({ FasterOne_400Regular });
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
  const segments = useSelector((state) => state.run.segments);
  const isRunning = useSelector((state) => state.run.isRunning);
  const isPaused = useSelector((state) => state.run.isPaused);
  const { loading, error } = useSelector((state) => state.history);
  const distance = useSelector(selectDistance);

  const currentLocation = locations[locations.length - 1];
  const speed = duration > 0 ? (distance / (duration / 3600)).toFixed(1) : "0.0";

  const formatDuration = (secs) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
    return `${m}:${String(s).padStart(2, "0")}`;
  };

  const { permissionDenied } = useLocationTracker(isTracking, isPaused);

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
      Speech.speak(`Pokonałeś ${completedKm} ${completedKm === 1 ? "kilometr" : completedKm < 5 ? "kilometry" : "kilometrów"}
        Twoja średnia szybkość to ${speed.replace(".", ",")} kilometrów na godzinę.`,
        { language: "pl-PL" });
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
      route: segments,
    };

    dispatch(addRunAndSave(runData));
    dispatch(resetRun());
    setDuration(0);
    setStartTime(null);
    setTotalPausedTime(0);
    navigation.navigate("Home");
  };

  const handleReset = () => {
    dispatch(resetRun());
    setIsTracking(false);
    setDuration(0);
    setStartTime(null);
    setTotalPausedTime(0);
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
      <ImageBackground source={require("../../assets/logo.jpg")} style={styles.setupContainer} resizeMode="stretch">
        <Text style={styles.setupTitle}>Ustaw dystans</Text>
        <Text style={styles.setupTitle2}>w km:</Text>
        <TextInput
          style={styles.targetInput}
          keyboardType="decimal-pad"
          value={targetInput}
          onChangeText={setTargetInput}
        />
        <TouchableOpacity style={styles.startButton} onPress={handleStart}>
          <Text style={styles.startButtonText}>Zaczynamy!</Text>
        </TouchableOpacity>
        {error && <Text style={{ color: "red", marginTop: 8 }}>{error}</Text>}
      </ImageBackground>
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
        {segments.map((seg, i) =>
          seg.length > 1 ? (
            <Polyline key={i} coordinates={seg} strokeColor="blue" strokeWidth={6} />
          ) : null
        )}
        {segments[0]?.length > 0 && (
          <Marker coordinate={segments[0][0]} title="Start" pinColor="red" />
        )}
      </MapView>

      {isPaused && (
        <View style={styles.pauseOverlay} pointerEvents="none">
          <Text style={styles.pauseOverlayText}>PAUZA</Text>
        </View>
      )}

      {permissionDenied && (
        <View style={styles.permissionBanner}>
          <Text style={styles.permissionBannerTitle}>Brak dostępu do lokalizacji</Text>
          <Text style={styles.permissionBannerBody}>
            Aby śledzić trasę, zezwól aplikacji na dostęp do lokalizacji w ustawieniach urządzenia.
          </Text>
          <TouchableOpacity style={styles.permissionBannerButton} onPress={() => Linking.openSettings()}>
            <Text style={styles.permissionBannerButtonText}>Otwórz ustawienia</Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.statsCard}>
        <View style={styles.statRow}>
          <Text style={styles.statLabel}>CZAS</Text>
          <Text style={styles.statValue}>{formatDuration(duration)}</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statRow}>
          <Text style={styles.statLabel}>DYSTANS</Text>
          <Text style={styles.statValue}>{distance.toFixed(2)} km</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statRow}>
          <Text style={styles.statLabel}>SZYBKOŚĆ</Text>
          <Text style={styles.statValue}>{speed} km/h</Text>
        </View>
        {targetDistance && (
          <>
            <View style={styles.statDivider} />
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>CEL</Text>
              <Text style={distance >= targetDistance ? styles.goalReached : styles.goalPending}>
                {distance.toFixed(2)} / {targetDistance} km{distance >= targetDistance ? "  ✓" : ""}
              </Text>
            </View>
            <View style={styles.progressBarTrack}>
              <View style={[
                styles.progressBarFill,
                { width: `${Math.min((distance / targetDistance) * 100, 100)}%`,
                  backgroundColor: distance >= targetDistance ? "#A8E6B0" : "#99C5FF" }
              ]} />
            </View>
          </>
        )}
      </View>

      <View style={styles.controls}>
        <TouchableOpacity style={[styles.controlButton, styles.stopButton]} onPress={handleStop}>
          <Text style={styles.controlButtonText}>Stop</Text>
        </TouchableOpacity>
        {!isPaused
          ? <TouchableOpacity style={[styles.controlButton, styles.pauseButton]} onPress={handlePause}>
              <Text style={styles.controlButtonText}>Pauza</Text>
            </TouchableOpacity>
          : <TouchableOpacity style={[styles.controlButton, styles.resumeButton]} onPress={handleResume}>
              <Text style={styles.controlButtonText}>Wznów</Text>
            </TouchableOpacity>
        }
        <TouchableOpacity style={[styles.controlButton, styles.resetButton]} onPress={handleReset}>
          <Text style={styles.controlButtonText}>Reset</Text>
        </TouchableOpacity>
        {loading && <Text> Saving...</Text>}
        {error && <Text style={{ color: "red" }}>{error}</Text>}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, marginTop: 40, marginBottom: 40 },
  map: { flex: 1 },
  setupContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
    gap: 20,
    marginTop: 40,
    marginBottom: 40,
  },
  setupTitle: {
    fontSize: 40,
    fontFamily: "FasterOne_400Regular",
  },
  setupTitle2: {
    fontSize: 40,
    fontFamily: "FasterOne_400Regular",
    marginBottom: 130,
  },
  pauseOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.35)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 5,
  },
  pauseOverlayText: {
    fontFamily: "FasterOne_400Regular",
    fontSize: 52,
    color: "#ffffff",
    letterSpacing: 6,
  },
  controls: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-evenly",
    alignItems: "center",
    backgroundColor: "rgba(20,20,20,1)",
    paddingVertical: 12,
    paddingHorizontal: 16,
    paddingBottom: 20,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.15)",
  },
  controlButton: {
    paddingVertical: 10,
    paddingHorizontal: 22,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "rgba(0,0,0,0.25)",
  },
  stopButton: { backgroundColor: "#FFAAAA" },
  pauseButton: { backgroundColor: "#FFD8A0" },
  resumeButton: { backgroundColor: "#A8E6B0" },
  resetButton: { backgroundColor: "#C4C8CE" },
  controlButtonText: {
    color: "#000",
    fontSize: 18,
    textAlign: "center",
    fontFamily: "FasterOne_400Regular",
  },
  statsCard: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(255,255,255,1)",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderBottomWidth: 2,
    borderBottomColor: "#000",
    elevation: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
  },
  statRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 6,
  },
  statValue: {
    fontSize: 30,
    fontFamily: "FasterOne_400Regular",
    color: "#000",
  },
  statLabel: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#888",
    letterSpacing: 2,
  },
  statDivider: {
    height: 1,
    backgroundColor: "#e0e0e0",
  },
  progressBarTrack: {
    height: 8,
    backgroundColor: "#e0e0e0",
    borderRadius: 4,
    marginTop: 8,
    overflow: "hidden",
  },
  progressBarFill: {
    height: 8,
    borderRadius: 4,
  },
  targetInput: {
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 15,
    fontSize: 25,
    width: 160,
    textAlign: "center",
    fontFamily: "FasterOne_400Regular",
    elevation: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  startButton: {
    backgroundColor: "#ffffff",
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 12,
    marginBottom: 16,
    elevation: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    borderWidth: 2.5,
    borderColor: "#000",
  },
  startButtonText: {
    color: "black",
    fontSize: 30,
    textAlign: "center",
    fontFamily: "FasterOne_400Regular",
  },
  permissionBanner: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.75)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
    padding: 32,
  },
  permissionBannerTitle: {
    fontFamily: "FasterOne_400Regular",
    fontSize: 26,
    color: "#ffffff",
    textAlign: "center",
    marginBottom: 12,
  },
  permissionBannerBody: {
    fontSize: 16,
    color: "#dddddd",
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 24,
  },
  permissionBannerButton: {
    backgroundColor: "#ffffff",
    paddingVertical: 12,
    paddingHorizontal: 28,
    borderRadius: 10,
  },
  permissionBannerButtonText: {
    fontFamily: "FasterOne_400Regular",
    fontSize: 18,
    color: "#000000",
  },
  goalPending: {
    fontSize: 30,
    fontFamily: "FasterOne_400Regular",
    color: "#007AFF",
  },
  goalReached: {
    fontSize: 30,
    fontFamily: "FasterOne_400Regular",
    color: "#34C759",
  },
});
