import { useRef } from "react";
import { View, Button, StyleSheet, Text } from "react-native";
import MapView, { Polyline } from "react-native-maps";

export default function RunDetailsScreen({ route }) {
    const { run } = route.params;
    const mapRef = useRef(null);

    if (!run || !run.route || run.route.length === 0) {
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
                    latitude: run.route[0].latitude,
                    longitude: run.route[0].longitude,
                    latitudeDelta: 0.02,
                    longitudeDelta: 0.02,
                }}
                onLayout={() =>
                    mapRef.current?.fitToCoordinates(run.route, {
                        edgePadding: { top: 40, right: 40, bottom: 40, left: 40 },
                        animated: false,
                    })
                }
            >
                <Polyline
                    coordinates={run.route}
                    strokeWidth={5}
                    strokeColor="blue"
                />
            </MapView>
        </View>
    );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
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
});