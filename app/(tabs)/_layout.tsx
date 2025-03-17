
import React from "react";
import { Tabs } from "expo-router";
import { Platform, View, StyleSheet, Dimensions } from "react-native";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { HapticTab } from "@/components/HapticTab";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Colors } from "@/constants/Colors";
import { useTheme } from "@/context/ThemeContext";

const { width } = Dimensions.get("window");

export default function TabLayout() {
  const { theme } = useTheme();
  const colors = Colors[theme];

  // Define tab bar colors based on theme
  const tabBarBgColor = theme === "light" ? "#1E293B" : "#487c4b";
  const activeIconColor = "#FFFFFF";
  const inactiveIconColor = "rgba(255,255,255,0.6)";

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: activeIconColor,
        tabBarInactiveTintColor: inactiveIconColor,
        headerShown: false,
        // Temporarily comment out the custom tab button to see if that's causing issues
        // tabBarButton: HapticTab,
        headerStyle: {
          backgroundColor: colors.surface,
          elevation: 0,
          shadowOpacity: 0,
          borderBottomWidth: 0,
        },
        headerTitleStyle: {
          color: colors.text,
          fontWeight: "600",
          fontSize: 17,
        },
        headerRight: () => (
          <View style={styles.headerRight}>
            <ThemeToggle />
          </View>
        ),
        tabBarShowLabel: false,
        tabBarStyle: {
          height: 80,
          paddingTop: 20,
          marginHorizontal: 30,
          marginBottom: 30,
          borderRadius: 20,
          backgroundColor: tabBarBgColor,
          borderTopWidth: 0,
          elevation: 0,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.1,
          shadowRadius: 10,
          bottom: 10,
          justifyContent: "center", // Center items on y-axis
          alignItems: "center", // Center items on x-axis
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          headerShown: false,
          tabBarIcon: ({ focused, color }) => (
            <FontAwesome
              name="home"
              size={focused ? 32 : 24}
              color={focused ? activeIconColor : inactiveIconColor}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          headerShown: false,
          tabBarIcon: ({ focused, color }) => (
            <FontAwesome
              name="user"
              size={focused ? 32 : 24}
              color={focused ? activeIconColor : inactiveIconColor}
            />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  headerRight: {
    marginRight: 15,
  },
});
