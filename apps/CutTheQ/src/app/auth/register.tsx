import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { Link } from "expo-router";
import tw from "twrnc";
import { light } from "@repo/constants";

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
    <ScrollView contentContainerStyle={tw`flex-grow bg-${light.background}`}>
      <View style={tw`flex-1 justify-center items-center p-5`}>
        <Text style={tw`text-2xl font-bold mb-5 text-${light.foreground}`}>
          Register
        </Text>

        <TextInput
          style={tw`w-full h-10 border border-${light.input} rounded-lg px-3 mb-3 text-${light.foreground}`}
          placeholder="First Name"
          placeholderTextColor={light["muted-foreground"]}
          value={firstName}
          onChangeText={setFirstName}
        />

        <TextInput
          style={tw`w-full h-10 border border-${light.input} rounded-lg px-3 mb-3 text-${light.foreground}`}
          placeholder="Last Name"
          placeholderTextColor={light["muted-foreground"]}
          value={lastName}
          onChangeText={setLastName}
        />

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
          placeholder="Phone Number"
          placeholderTextColor={light["muted-foreground"]}
          value={phoneNumber}
          onChangeText={setPhoneNumber}
          keyboardType="phone-pad"
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
          onPress={handleRegister}
        >
          <Text style={tw`text-${light["primary-foreground"]} font-bold`}>
            Register
          </Text>
        </TouchableOpacity>

        <Link href="/(auth)/" style={tw`mt-3 text-${light.primary}`}>
          Already have an account? Login here
        </Link>
      </View>
    </ScrollView>
  );
}
