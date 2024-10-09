import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity } from "react-native";
import { Link } from "expo-router";
import tw from "twrnc";
import { light } from "@repo/constants";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = () => {
    // Implement login logic here
    console.log("Login with:", email, password);
  };

  const handleGoogleLogin = () => {
    // Implement Google login logic here
    console.log("Login with Google");
  };

  return (
    <View
      style={tw`flex-1 justify-center items-center p-5 bg-${light.background}`}
    >
      <Text style={tw`text-2xl font-bold mb-5 text-${light.foreground}`}>
        Login
      </Text>

      <TextInput
        style={tw`w-full h-10 border border-${light.input} rounded-lg px-3 mb-3 text-${light.foreground}`}
        placeholder="Email"
        placeholderTextColor={light["muted-foreground"]}
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />

      <TextInput
        style={tw`w-full h-10 border border-${light.input} rounded-lg px-3 mb-3 text-${light.foreground}`}
        placeholder="Password"
        placeholderTextColor={light["muted-foreground"]}
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      <TouchableOpacity
        style={tw`w-full h-10 bg-${light.primary} rounded-lg justify-center items-center mb-3`}
        onPress={handleLogin}
      >
        <Text style={tw`text-${light["primary-foreground"]} font-bold`}>
          Login
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={tw`w-full h-10 bg-[#4285F4] rounded-lg justify-center items-center mb-3`}
        onPress={handleGoogleLogin}
      >
        <Text style={tw`text-white font-bold`}>Login with Google</Text>
      </TouchableOpacity>

      <Link href="/register" style={tw`mt-3 text-${light.primary}`}>
        Don't have an account? Register here
      </Link>
    </View>
  );
}
