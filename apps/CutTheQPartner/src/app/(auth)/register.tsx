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
    <ScrollView contentContainerStyle={tw`flex-grow bg-background`}>
      <View style={tw`flex-1 justify-center items-center p-5`}>
        <Text style={tw`text-2xl font-bold mb-5 text-foreground`}>
          Register
        </Text>

        <TextInput
          style={tw`w-full h-10 border border-input rounded-lg px-3 mb-3 text-foreground`}
          placeholder="First Name"
          placeholderTextColor="#737373"
          value={firstName}
          onChangeText={setFirstName}
        />

        <TextInput
          style={tw`w-full h-10 border border-input rounded-lg px-3 mb-3 text-foreground`}
          placeholder="Last Name"
          placeholderTextColor="#737373"
          value={lastName}
          onChangeText={setLastName}
        />

        <TextInput
          style={tw`w-full h-10 border border-input rounded-lg px-3 mb-3 text-foreground`}
          placeholder="Email"
          placeholderTextColor="#737373"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <TextInput
          style={tw`w-full h-10 border border-input rounded-lg px-3 mb-3 text-foreground`}
          placeholder="Phone Number"
          placeholderTextColor="#737373"
          value={phoneNumber}
          onChangeText={setPhoneNumber}
          keyboardType="phone-pad"
        />

        <TextInput
          style={tw`w-full h-10 border border-input rounded-lg px-3 mb-3 text-foreground`}
          placeholder="Password"
          placeholderTextColor="#737373"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        <TouchableOpacity
          style={tw`w-full h-10 bg-primary rounded-lg justify-center items-center mb-3`}
          onPress={handleRegister}
        >
          <Text style={tw`text-primary-foreground font-bold`}>Register</Text>
        </TouchableOpacity>

        <Link href="/(auth)/" style={tw`mt-3 text-primary`}>
          Already have an account? Login here
        </Link>
      </View>
    </ScrollView>
  );
}
