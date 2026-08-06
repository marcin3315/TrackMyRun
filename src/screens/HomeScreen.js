import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import PropTypes from "prop-types";

export default function HomeScreen({ navigation }) {
  const handleStartRun = () => {
    navigation.navigate("Run"); // przejście do ekranu biegu
  };

  const handleViewHistory = () => {
    navigation.navigate("History"); // przejście do historii biegów
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Track your run</Text>

      <TouchableOpacity style={styles.button} onPress={handleStartRun}>
        <Text style={styles.buttonText}>Start a run</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.button2} onPress={handleViewHistory}>
        <Text style={styles.buttonText}>See history</Text>
      </TouchableOpacity>
    </View>
  );
}

HomeScreen.propTypes = {
  navigation: PropTypes.object.isRequired,
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f6f6f6",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    marginBottom: 48,
    color: "#222",
  },
  button: {
    backgroundColor: "#36bf21",
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 12,
    marginBottom: 16,
    width: "80%",
  },
  button2: {
    backgroundColor: "#1259c4",
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 12,
    width: "80%",
  },
  buttonText: {
    color: "white",
    fontSize: 18,
    textAlign: "center",
  },
});
