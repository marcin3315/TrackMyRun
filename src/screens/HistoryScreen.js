import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { useSelector } from "react-redux";


const DISTANCE_FILTERS = [
  { label: "Any", value: 0 },
  { label: "1 km+", value: 1 },
  { label: "5 km+", value: 5 },
  { label: "10 km+", value: 10 },
];

const DURATION_FILTERS = [
  { label: "Any", value: 0 },
  { label: "15 min+", value: 15 },
  { label: "30 min+", value: 30 },
  { label: "1 h+", value: 60 },
];

export default function HistoryScreen({ navigation }) {
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
      >
        <Text style={styles.date}>{date}</Text>
        <Text>Distance: {distance} km</Text>
        <Text>Duration: {duration}</Text>
        <Text>Average speed: {speed} km/h</Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Run history</Text>

      {loading && <Text style={styles.status}>⏳ Loading data ...</Text>}
      {error && <Text style={[styles.status, { color: "red" }]}>{error}</Text>}

      {/* Sort bar */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.sortBar}
        contentContainerStyle={styles.sortBarContent}
      >
        <TouchableOpacity
          style={[styles.chip, (sortBy === "date_desc" || sortBy === "date_asc") && styles.chipActive]}
          onPress={() => setSortBy(sortBy === "date_desc" ? "date_asc" : "date_desc")}
        >
          <Text style={[styles.chipText, (sortBy === "date_desc" || sortBy === "date_asc") && styles.chipTextActive]}>
            Date {sortBy === "date_asc" ? "↑" : "↓"}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.chip, (sortBy === "distance_desc" || sortBy === "distance_asc") && styles.chipActive]}
          onPress={() => setSortBy(sortBy === "distance_desc" ? "distance_asc" : "distance_desc")}
        >
          <Text style={[styles.chipText, (sortBy === "distance_desc" || sortBy === "distance_asc") && styles.chipTextActive]}>
            Distance {sortBy === "distance_asc" ? "↑" : "↓"}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.chip, (sortBy === "duration_desc" || sortBy === "duration_asc") && styles.chipActive]}
          onPress={() => setSortBy(sortBy === "duration_desc" ? "duration_asc" : "duration_desc")}
        >
          <Text style={[styles.chipText, (sortBy === "duration_desc" || sortBy === "duration_asc") && styles.chipTextActive]}>
            Duration {sortBy === "duration_asc" ? "↑" : "↓"}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.chip, (sortBy === "speed_desc" || sortBy === "speed_asc") && styles.chipActive]}
          onPress={() => setSortBy(sortBy === "speed_desc" ? "speed_asc" : "speed_desc")}
        >
          <Text style={[styles.chipText, (sortBy === "speed_desc" || sortBy === "speed_asc") && styles.chipTextActive]}>
            Speed {sortBy === "speed_asc" ? "↑" : "↓"}
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Filter toggle */}
      <TouchableOpacity
        style={styles.filterToggle}
        onPress={() => setShowFilters((v) => !v)}
      >
        <Text style={styles.filterToggleText}>
          {showFilters ? "Hide filters ▲" : "Show filters ▼"}
          {(minDistance > 0 || minDurationMin > 0) ? "  •" : ""}
        </Text>
      </TouchableOpacity>

      {showFilters && (
        <View style={styles.filterPanel}>
          <Text style={styles.filterLabel}>Min distance</Text>
          <View style={styles.chipRow}>
            {DISTANCE_FILTERS.map((f) => (
              <TouchableOpacity
                key={f.value}
                style={[styles.chip, minDistance === f.value && styles.chipActive]}
                onPress={() => setMinDistance(f.value)}
              >
                <Text style={[styles.chipText, minDistance === f.value && styles.chipTextActive]}>
                  {f.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.filterLabel}>Min duration</Text>
          <View style={styles.chipRow}>
            {DURATION_FILTERS.map((f) => (
              <TouchableOpacity
                key={f.value}
                style={[styles.chip, minDurationMin === f.value && styles.chipActive]}
                onPress={() => setMinDurationMin(f.value)}
              >
                <Text style={[styles.chipText, minDurationMin === f.value && styles.chipTextActive]}>
                  {f.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      <Text style={styles.count}>
        {displayedRuns.length} / {runs.length} runs
      </Text>

      {displayedRuns.length === 0 ? (
        <Text style={styles.empty}>
          {runs.length === 0 ? "No saved runs." : "No runs match the current filters."}
        </Text>
      ) : (
        <FlatList
          data={displayedRuns}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#fff",
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 12,
  },
  status: {
    marginBottom: 8,
  },
  sortBar: {
    marginBottom: 8,
    minHeight: 60,
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
    color: "#007AFF",
    fontWeight: "600",
    fontSize: 14,
  },
  filterPanel: {
    backgroundColor: "#f8f8f8",
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
  },
  filterLabel: {
    fontWeight: "600",
    marginBottom: 6,
    fontSize: 13,
    color: "#444",
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 12,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#ccc",
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    minWidth: 80,
  },
  chipActive: {
    backgroundColor: "#007AFF",
    borderColor: "#007AFF",
  },
  chipText: {
    fontSize: 13,
    color: "#333",
    textAlign: "center",
    flexShrink: 0,
  },
  chipTextActive: {
    color: "#fff",
    fontWeight: "600",
  },
  count: {
    fontSize: 12,
    color: "#999",
    marginBottom: 8,
  },
  item: {
    backgroundColor: "#f1f1f1",
    padding: 14,
    borderRadius: 10,
    marginBottom: 12,
  },
  date: {
    fontWeight: "bold",
    marginBottom: 4,
  },
  empty: {
    marginTop: 40,
    fontSize: 16,
    color: "#666",
  },
});
