import React from 'react';
import { DarkTheme, DefaultTheme , ThemeProvider } from "@react-navigation/native";
import { useFonts } from "expo-font";
import * as SplashScreen from "expo-splash-screen";
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
      <ScrollView style={tw`flex-1 bg-background`}>
        <View style={tw`p-4`}>
          <Text style={tw`text-2xl font-bold text-foreground mb-4`}>
            Tailwind CSS in React Native
          </Text>

          <View style={tw`bg-card p-4 rounded-lg mb-4`}>
            <Text style={tw`text-card-foreground`}>
              This is a card component using our custom colors.
            </Text>
          </View>

          <TouchableOpacity
            style={tw`bg-primary py-2 px-4 rounded-lg mb-4`}
            onPress={() => console.log("Primary button pressed")}
          >
            <Text style={tw`text-primary-foreground text-center font-bold`}>
              Primary Button
            </Text>
          </TouchableOpacity>

          <View style={tw`flex-row justify-between mb-4`}>
            <View style={tw`w-16 h-16 bg-chart-1 rounded-lg`} />
            <View style={tw`w-16 h-16 bg-chart-2 rounded-lg`} />
            <View style={tw`w-16 h-16 bg-chart-3 rounded-lg`} />
            <View style={tw`w-16 h-16 bg-chart-4 rounded-lg`} />
          </View>

          <Text style={tw`text-muted-foreground mb-2`}>
            This text uses the muted foreground color.
          </Text>

          <View style={tw`border border-border p-4 rounded-lg`}>
            <Text style={tw`text-accent-foreground`}>
              This box has a border using our custom border color.
            </Text>
          </View>
        </View>
      </ScrollView>
    </ThemeProvider>
  );
}
