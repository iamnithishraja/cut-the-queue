import React from "react";
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { useFonts } from "expo-font";
import { Slot } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { dark, light } from "@repo/constants";
import { useEffect } from "react";
import "react-native-reanimated";
import { useColorScheme } from "@repo/hooks";
import { Text, View, ScrollView, TouchableOpacity } from "react-native";
import tw from "twrnc";

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    SpaceMono: require("../../assets/fonts/SpaceMono-Regular.ttf"),
  });

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }
  return (
    <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
      <ScrollView style={tw`flex-1 bg-${light.background}`}>
        <View style={tw`p-4`}>
          <Text style={tw`text-2xl font-bold text-${light.foreground} mb-4`}>
            Tailwind CSS in React Native
          </Text>

          <View style={tw`bg-${light.card} p-4 rounded-lg mb-4`}>
            <Text style={tw`text-${light["card-foreground"]}`}>
              This is a card component using our custom colors.
            </Text>
          </View>

          <TouchableOpacity
            style={tw`bg-${light.primary} py-2 px-4 rounded-lg mb-4`}
            onPress={() => console.log("Primary button pressed")}
          >
            <Text
              style={tw`text-${light["primary-foreground"]} text-center font-bold`}
            >
              Primary Button
            </Text>
          </TouchableOpacity>

          <View style={tw`flex-row justify-between mb-4`}>
            <View style={tw`w-16 h-16 bg-${light["chart-1"]} rounded-lg`} />
            <View style={tw`w-16 h-16 bg-${light["chart-2"]} rounded-lg`} />
            <View style={tw`w-16 h-16 bg-${light["chart-3"]} rounded-lg`} />
            <View style={tw`w-16 h-16 bg-${light["chart-4"]} rounded-lg`} />
          </View>

          <Text style={tw`text-${light["muted-foreground"]} mb-2`}>
            This text uses the muted foreground color.
          </Text>

          <View style={tw`border border-${light.border} p-4 rounded-lg`}>
            <Text style={tw`text-${light["accent-foreground"]}`}>
              This box has a border using our custom border color.
            </Text>
          </View>
        </View>
        <Slot />
      </ScrollView>
    </ThemeProvider>
  );
}
