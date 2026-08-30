import React from "react";
import { Text, StyleSheet, TouchableOpacity, ImageBackground } from "react-native";
import PropTypes from "prop-types";

export default function HomeScreen({ navigation }) {
  const handleStartRun = () => {
    navigation.navigate("Run"); // przejście do ekranu biegu
  };

  const handleViewHistory = () => {
    navigation.navigate("History"); // przejście do historii biegów
  };

  return (
    <ImageBackground source={require("../../assets/logo.jpg")} style={styles.container} resizeMode="stretch">
      <Text style={styles.title}>Śledź swój bieg</Text>

      <TouchableOpacity style={styles.button} onPress={handleStartRun}>
        <Text style={styles.buttonText}>Start</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.button2} onPress={handleViewHistory}>
        <Text style={styles.buttonText}>Historia</Text>
      </TouchableOpacity>
    </ImageBackground>
  );
}

HomeScreen.propTypes = {
  navigation: PropTypes.object.isRequired,
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fcfcfc",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
    marginTop: 40,
    marginBottom: 40,
  },
  title: {
    fontSize: 40,
    fontFamily: "FasterOne_400Regular",
    marginBottom: 500,
    color: "#222",
  },
  button: {
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
  button2: {
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
  buttonText: {
    color: "black",
    fontSize: 30,
    textAlign: "center",
    fontFamily: "FasterOne_400Regular",
  },
});
