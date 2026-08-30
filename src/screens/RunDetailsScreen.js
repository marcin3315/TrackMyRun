import { useRef } from "react";
import { View, StyleSheet, Text } from "react-native";
import MapView, { Marker, Polyline } from "react-native-maps";

export default function RunDetailsScreen({ route }) {
    const { run } = route.params;
    const mapRef = useRef(null);

    // Support both new format (array of segments) and old flat-array format
    const segments = run?.route
        ? Array.isArray(run.route[0]) ? run.route : [run.route]
        : [];
    const allCoords = segments.flat();

    if (allCoords.length === 0) {
        return (
            <View style={styles.container}>
                <Text>No route data</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <MapView
                ref={mapRef}
                style={styles.map}
                initialRegion={{
                    latitude: allCoords[0].latitude,
                    longitude: allCoords[0].longitude,
                    latitudeDelta: 0.02,
                    longitudeDelta: 0.02,
                }}
                onLayout={() =>
                    mapRef.current?.fitToCoordinates(allCoords, {
                        edgePadding: { top: 40, right: 40, bottom: 40, left: 40 },
                        animated: false,
                    })
                }
            >
                {segments.map((seg, i) =>
                    seg.length > 1 ? (
                        <Polyline key={i} coordinates={seg} strokeWidth={5} strokeColor="blue" />
                    ) : null
                )}
                <Marker
                    coordinate={allCoords[0]}
                    title="Start"
                    pinColor="green"
                />
                <Marker
                    coordinate={allCoords[allCoords.length - 1]}
                    title="Meta"
                >
                    <View style={styles.finishMarker}>
                        <Text style={styles.finishFlag}>🏁</Text>
                        {/* <Text style={styles.finishLabel}>Meta</Text> */}
                    </View>
                </Marker>
            </MapView>
        </View>
    );
}

const styles = StyleSheet.create({
  container: { flex: 1, marginTop: 40, marginBottom: 40 },
  map: { flex: 1 },
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
  finishMarker: {
    alignItems: "center",
  },
  finishFlag: {
    fontSize: 28,
  },
  finishLabel: {
    fontSize: 11,
    fontWeight: "bold",
    color: "#333",
    backgroundColor: "rgba(255,255,255,0.85)",
    paddingHorizontal: 4,
    borderRadius: 4,
  },
});