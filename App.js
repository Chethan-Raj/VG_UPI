import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import HomeScreen from "./app/HomeScreen";
import QRScreen from "./app/QRScreen";
import PaymentHistoryScreen from "./app/PaymentHistoryScreen";
import { PaymentProvider } from "./app/PaymentContext";

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <PaymentProvider>
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Home" component={HomeScreen} />
          <Stack.Screen name="QRScreen" component={QRScreen} />
          <Stack.Screen name="PaymentHistory" component={PaymentHistoryScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </PaymentProvider>
  );
}