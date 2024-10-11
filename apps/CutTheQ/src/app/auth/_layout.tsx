import React from 'react';
import { Stack } from "expo-router";
import { useColorScheme } from "react-native";
import tw from "twrnc";

export default function Layout() {
  const colorScheme = useColorScheme();

  return (
    <Stack
      screenOptions={{
        headerStyle: tw`${colorScheme === "dark" ? "bg-black" : "bg-white"}`,
        headerTintColor: colorScheme === "dark" ? "#FFFFFF" : "#0A0A0A",
        headerTitleStyle: tw`font-bold`,
      }}
    >
      <Stack.Screen name="index" options={{ title: "Login" }} />
      <Stack.Screen name="register" options={{ title: "Register" }} />
    </Stack>
  );
}
