import React, { useEffect } from "react";
import { Provider, useDispatch } from "react-redux";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";

import store from "./src/redux/store";
import { loadHistoryFromStorage } from "./src/redux/historySlice";

import HomeScreen from "./src/screens/HomeScreen";
import RunScreen from "./src/screens/RunScreen";
import HistoryScreen from "./src/screens/HistoryScreen";
import RunDetailsScreen from "./src/screens/RunDetailsScreen";

const Stack = createStackNavigator();

const AppNavigator = () => {
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(loadHistoryFromStorage());
  }, []);

  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Home">
        <Stack.Screen
          name="RunDetails"
          component={RunDetailsScreen}
        />
        <Stack.Screen
          name="Home"
          component={HomeScreen}
        />
        <Stack.Screen
          name="Run"
          component={RunScreen}
          options={{ title: "Run" }}
        />
        <Stack.Screen
          name="History"
          component={HistoryScreen}
          options={{ title: "Run history" }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default function App() {
  return (
    <Provider store={store}>
      <AppNavigator />
    </Provider>
  );
}
