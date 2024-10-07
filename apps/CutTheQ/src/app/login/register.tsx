import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { Link } from "expo-router";

export default function Register() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [password, setPassword] = useState("");

  const handleRegister = () => {
    // Implement registration logic here
    console.log("Register:", {
      firstName,
      lastName,
      email,
      phoneNumber,
      password,
    });
  };

  return (
    <ScrollView
      contentContainerStyle={{ flexGrow: 1 }}
      className="bg-background"
    >
      <View className="flex-1 justify-center items-center p-5">
        <Text className="text-2xl font-bold mb-5 text-foreground">
          Register
        </Text>
        <TextInput
          className="w-full h-10 border border-input rounded-lg px-3 mb-3 text-foreground"
          placeholder="First Name"
          placeholderTextColor="#737373"
          value={firstName}
          onChangeText={setFirstName}
        />
        <TextInput
          className="w-full h-10 border border-input rounded-lg px-3 mb-3 text-foreground"
          placeholder="Last Name"
          placeholderTextColor="#737373"
          value={lastName}
          onChangeText={setLastName}
        />
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
          placeholder="Phone Number"
          placeholderTextColor="#737373"
          value={phoneNumber}
          onChangeText={setPhoneNumber}
          keyboardType="phone-pad"
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
          onPress={handleRegister}
        >
          <Text className="text-primary-foreground font-bold">Register</Text>
        </TouchableOpacity>
        <Link href="/login" className="mt-3 text-primary">
          Already have an account? Login here
        </Link>
      </View>
    </ScrollView>
  );
}
