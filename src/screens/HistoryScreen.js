import React, { useState, useMemo } from "react";
import { useFonts, FasterOne_400Regular } from "@expo-google-fonts/faster-one";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ImageBackground,
} from "react-native";
import Slider from "@react-native-community/slider";
import { useSelector } from "react-redux";

export default function HistoryScreen({ navigation }) {
  const [fontsLoaded] = useFonts({ FasterOne_400Regular });
  const { runs, loading, error } = useSelector((state) => state.history);

  const [sortBy, setSortBy] = useState("date_desc");
  const [minDistance, setMinDistance] = useState(0);
  const [minDurationMin, setMinDurationMin] = useState(0);
  const [showFilters, setShowFilters] = useState(false);

  const displayedRuns = useMemo(() => {
    let result = runs.filter((r) => {
      if (r.distance < minDistance) return false;
      if (r.duration < minDurationMin * 60) return false;
      return true;
    });

    result = [...result].sort((a, b) => {
      switch (sortBy) {
        case "date_asc":    return a.startTime - b.startTime;
        case "distance_desc": return b.distance - a.distance;
        case "distance_asc":  return a.distance - b.distance;
        case "duration_desc": return b.duration - a.duration;
        case "duration_asc":  return a.duration - b.duration;
        case "speed_desc":  return b.averageSpeed - a.averageSpeed;
        case "speed_asc":   return a.averageSpeed - b.averageSpeed;
        default:            return b.startTime - a.startTime;
      }
    });

    return result;
  }, [runs, sortBy, minDistance, minDurationMin]);

  const renderItem = ({ item }) => {
    const date = new Date(item.startTime).toLocaleString();
    const duration = `${Math.floor(item.duration / 60)}m ${item.duration % 60}s`;
    const distance = item.distance.toFixed(2);
    const speed = item.averageSpeed.toFixed(2);

    return (
      <TouchableOpacity
        style={styles.item}
        onPress={() => navigation.navigate("RunDetails", { run: item })}
        activeOpacity={0.75}
      >
        <View style={styles.itemAccent} />
        <View style={styles.itemContent}>
          <Text style={styles.date}>{date}</Text>
          <View style={styles.statRow}>
            <Text style={styles.statIcon}>📍</Text>
            <Text style={styles.statText}>{distance} km</Text>
            <Text style={styles.statIcon}>⏱</Text>
            <Text style={styles.statText}>{duration}</Text>
          </View>
          <View style={styles.statRow}>
            <Text style={styles.statIcon}>⚡</Text>
            <Text style={styles.statText}>{speed} km/h</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <ImageBackground source={require("../../assets/history.jpg")} style={styles.container} resizeMode="stretch">
      <View style={styles.overlay}>
      <Text style={styles.title}>Historia biegów</Text>

      {loading && <Text style={styles.status}>⏳ Loading data ...</Text>}
      {error && <Text style={[styles.status, { color: "red" }]}>{error}</Text>}

      {/* Sort bar */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.sortBar}
        contentContainerStyle={styles.sortBarContent}
      >
        {[
          { label: "Data",     icon: "📅", key: "date" },
          { label: "Dystans", icon: "📍", key: "distance" },
          { label: "Czas", icon: "⏱",  key: "duration" },
          { label: "Szybkość",    icon: "⚡", key: "speed" },
        ].map(({ label, icon, key }) => {
          const isActive = sortBy === `${key}_desc` || sortBy === `${key}_asc`;
          const arrow = sortBy === `${key}_asc` ? "↑" : "↓";
          return (
            <TouchableOpacity
              key={key}
              activeOpacity={0.7}
              style={[styles.chip, isActive && styles.chipActive]}
              onPress={() => setSortBy(sortBy === `${key}_desc` ? `${key}_asc` : `${key}_desc`)}
            >
              <Text style={styles.chipIcon}>{icon}</Text>
              <Text style={[styles.chipText, isActive && styles.chipTextActive]}>
                {label} {arrow}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Filter toggle */}
      <TouchableOpacity
        style={styles.filterToggle}
        onPress={() => setShowFilters((v) => !v)}
      >
        <Text style={styles.filterToggleText}>
          {showFilters ? "Ukryj filtry ▲" : "Pokaż filtry ▼"}
          {(minDistance > 0 || minDurationMin > 0) ? "  •" : ""}
        </Text>
      </TouchableOpacity>

      {showFilters && (
        <View style={styles.filterPanel}>
          <View style={styles.filterRow}>
            <Text style={styles.filterLabel}>Min dystans</Text>
            <Text style={styles.filterValue}>{minDistance} km</Text>
          </View>
          <Slider
            style={styles.slider}
            minimumValue={0}
            maximumValue={40}
            step={1}
            value={minDistance}
            onValueChange={setMinDistance}
            minimumTrackTintColor="#000"
            maximumTrackTintColor="#ddd"
            thumbTintColor="#000"
          />
          <View style={styles.filterRow}>
            <Text style={styles.filterLabel}>Min czas</Text>
            <Text style={styles.filterValue}>{minDurationMin} min</Text>
          </View>
          <Slider
            style={styles.slider}
            minimumValue={0}
            maximumValue={120}
            step={5}
            value={minDurationMin}
            onValueChange={setMinDurationMin}
            minimumTrackTintColor="#000"
            maximumTrackTintColor="#ddd"
            thumbTintColor="#000"
          />
        </View>
      )}

      <Text style={styles.count}>
        {displayedRuns.length} / {runs.length} biegów
      </Text>

      {displayedRuns.length === 0 ? (
        <Text style={styles.empty}>
          {runs.length === 0 ? "Brak zapisanych biegów." : "Żaden bieg nie spełnia kryteriów."}
        </Text>
      ) : (
        <FlatList
          style={{ flex: 1 }}
          data={displayedRuns}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
        />
      )}
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginTop: 40,
    marginBottom: 40,
  },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(255,255,255, 0.7)",
    padding: 20,
    paddingBottom: 0,
  },
  title: {
    fontSize: 32,
    fontFamily: "FasterOne_400Regular",
    marginBottom: 12,
  },
  status: {
    marginBottom: 8,
  },
  sortBar: {
    marginBottom: 8,
    minHeight: 60,
    flexGrow: 0,
  },
  sortBarContent: {
    gap: 8,
    paddingVertical: 8,
    alignItems: "center",
  },
  filterToggle: {
    paddingVertical: 8,
  },
  filterToggleText: {
    color: "#000000",
    fontSize: 14,
    fontWeight: "bold",
  },
  filterPanel: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
  },
  filterRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 2,
  },
  filterLabel: {
    fontSize: 13,
    color: "#888",
    fontWeight: "600",
  },
  filterValue: {
    fontSize: 15,
    fontWeight: "bold",
    color: "#111",
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 12,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: "#ddd",
    backgroundColor: "#fff",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
  },
  chipActive: {
    backgroundColor: "#000",
    borderColor: "#000",
    elevation: 5,
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  chipIcon: {
    fontSize: 14,
  },
  chipText: {
    fontSize: 13,
    color: "#333",
    fontWeight: "700",
  },
  chipTextActive: {
    color: "#fff",
  },
  count: {
    fontSize: 12,
    color: "#999",
    marginBottom: 8,
  },
  item: {
    backgroundColor: "#fff",
    borderRadius: 12,
    marginBottom: 12,
    flexDirection: "row",
    overflow: "hidden",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
  },
  itemAccent: {
    width: 6,
    backgroundColor: "#3aafc4",
  },
  itemContent: {
    flex: 1,
    padding: 14,
  },
  date: {
    fontWeight: "bold",
    fontSize: 13,
    color: "#555",
    marginBottom: 8,
  },
  statRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 4,
  },
  statIcon: {
    fontSize: 14,
  },
  statText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#222",
    marginRight: 8,
  },
  empty: {
    marginTop: 8,
    fontSize: 16,
    color: "#666",
  },
});
