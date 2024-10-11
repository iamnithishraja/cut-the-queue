import { Tabs } from "expo-router";
import { MaterialCommunityIcons } from '@expo/vector-icons'; 
import { dark, light } from "@repo/constants";


export default () => {
  return (
    <Tabs screenOptions={{ tabBarActiveTintColor: light.background }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => <MaterialCommunityIcons name="home" size={28} color={color} />,
        }}
      />
      <Tabs.Screen
        name="orders"
        options={{
          title: 'Orders',
          tabBarIcon: ({ color }) => <MaterialCommunityIcons name="food-fork-drink" size={28} color={color} />, 
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'My Profile',
          tabBarIcon: ({ color }) => <MaterialCommunityIcons name="account" size={28} color={color} />,
        }}
      />
    </Tabs>
  );
};
