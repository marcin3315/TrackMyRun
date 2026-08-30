import React, { useEffect } from "react";
import { Provider, useDispatch } from "react-redux";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import * as SplashScreen from "expo-splash-screen";
import { useFonts, FasterOne_400Regular } from "@expo-google-fonts/faster-one";

import store from "./src/redux/store";
import { loadHistoryFromStorage } from "./src/redux/historySlice";

import HomeScreen from "./src/screens/HomeScreen";
import RunScreen from "./src/screens/RunScreen";
import HistoryScreen from "./src/screens/HistoryScreen";
import RunDetailsScreen from "./src/screens/RunDetailsScreen";

SplashScreen.preventAutoHideAsync();

const Stack = createStackNavigator();

const AppNavigator = () => {
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(loadHistoryFromStorage());
  }, []);

  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Home" screenOptions={{ headerShown: false }}>
        <Stack.Screen name="RunDetails" component={RunDetailsScreen} />
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="Run" component={RunScreen} />
        <Stack.Screen name="History" component={HistoryScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default function App() {
  const [fontsLoaded] = useFonts({ FasterOne_400Regular });

  useEffect(() => {
    if (fontsLoaded) SplashScreen.hideAsync();
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  return (
    <Provider store={store}>
      <AppNavigator />
    </Provider>
  );
}
