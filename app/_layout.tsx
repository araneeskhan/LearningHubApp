import FontAwesome from '@expo/vector-icons/FontAwesome';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { useEffect, useState } from 'react';
import { useColorScheme, StatusBar, Platform, View, Text } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import Toast from 'react-native-toast-message';

import { AuthProvider } from '@/context/AuthContext';
import { ThemeProvider as AppThemeProvider, useTheme } from '@/context/ThemeContext';
import { CourseProgressProvider } from '@/context/CourseProgressContext';
import { SubscriptionProvider } from '@/context/SubscriptionContext';
import { ToastProvider } from '@/components/Toast';
import { Colors } from '@/constants/Colors';

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from 'expo-router';

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    ...FontAwesome.font,
  });
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    if (error) throw error;
  }, [error]);

  if (!loaded) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Loading fonts...</Text>
      </View>
    );
  }

  // Wrap the entire app with GestureHandlerRootView
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AppThemeProvider>
        <AuthProvider>
          <CourseProgressProvider>
            <SubscriptionProvider>
              {Platform.OS === 'web' ? (
                <Stack>
                  <Stack.Screen name="debug" options={{ title: 'Debug' }} />
                </Stack>
              ) : (
                <>
                  <RootLayoutNav />
                  <ToastProvider />
                  <Toast />
                </>
              )}
            </SubscriptionProvider>
          </CourseProgressProvider>
        </AuthProvider>
      </AppThemeProvider>
    </GestureHandlerRootView>
  );
}

function RootLayoutNav() {
  const { theme } = useTheme();
  const colors = Colors[theme];
  
  console.log("RootLayoutNav rendering with theme:", theme);

  // Set the status bar style based on theme
  if (Platform.OS !== 'web') {
    StatusBar.setBarStyle(theme === 'dark' ? 'light-content' : 'dark-content');
  }
  
  // Set the navigation theme based on our app theme
  const navigationTheme = theme === 'dark' ? {
    ...DarkTheme,
    colors: {
      ...DarkTheme.colors,
      primary: colors.primary,
      background: colors.background,
      card: colors.surface,
      text: colors.text,
      border: colors.border,
    }
  } : {
    ...DefaultTheme,
    colors: {
      ...DefaultTheme.colors,
      primary: colors.primary,
      background: colors.background,
      card: colors.surface,
      text: colors.text,
      border: colors.border,
    }
  };

  return (
    <ThemeProvider value={navigationTheme}>
      <Stack screenOptions={{
        headerStyle: {
          backgroundColor: colors.surface,
        },
        headerTintColor: colors.text,
        headerTitleStyle: {
          color: colors.text,
        },
        contentStyle: {
          backgroundColor: colors.background,
        },
      }}>
        <Stack.Screen name="debug" options={{ title: 'Debug' }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="welcome" options={{ headerShown: false }} />
        <Stack.Screen name="login" options={{ title: 'Sign In' }} />
        <Stack.Screen name="signup" options={{ title: 'Create Account' }} />
        <Stack.Screen name="forgot-password" options={{ title: 'Reset Password' }} />
      </Stack>
    </ThemeProvider>
  );
}
