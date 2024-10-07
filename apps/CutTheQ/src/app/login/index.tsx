import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity } from "react-native";
import { Link } from "expo-router";

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
    <View className="flex-1 justify-center items-center p-5 bg-background">
      <Text className="text-2xl font-bold mb-5 text-foreground">Login</Text>
      <TextInput
        className="w-full h-10 border border-input rounded-lg px-3 mb-3 text-foreground"
        placeholder="Email"
        placeholderTextColor="#737373"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <TextInput
        className="w-full h-10 border border-input rounded-lg px-3 mb-3 text-foreground"
        placeholder="Password"
        placeholderTextColor="#737373"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      <TouchableOpacity
        className="w-full h-10 bg-primary rounded-lg justify-center items-center mb-3"
        onPress={handleLogin}
      >
        <Text className="text-primary-foreground font-bold">Login</Text>
      </TouchableOpacity>
      <TouchableOpacity
        className="w-full h-10 bg-[#4285F4] rounded-lg justify-center items-center mb-3"
        onPress={handleGoogleLogin}
      >
        <Text className="text-white font-bold">Login with Google</Text>
      </TouchableOpacity>
      <Link href="/register" className="mt-3 text-primary">
        Don't have an account? Register here
      </Link>
    </View>
  );
}
