import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Button, Platform, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useTheme } from '@/context/ThemeContext';
import { Colors } from '@/constants/Colors';

export default function DebugScreen() {
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();
  const colors = Colors[theme];
  const [isClient, setIsClient] = useState(false);
  
  // Set isClient to true when component mounts (client-side only)
  useEffect(() => {
    setIsClient(true);
  }, []);
  
  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style="auto" />
      <Text style={[styles.title, { color: colors.text }]}>Debug Screen</Text>
      <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
        If you can see this, your app is loading correctly
      </Text>
      
      <View style={[styles.infoContainer, { backgroundColor: colors.surface }]}>
        <Text style={[styles.infoText, { color: colors.text }]}>Platform: {Platform.OS}</Text>
        <Text style={[styles.infoText, { color: colors.text }]}>Version: {Platform.Version}</Text>
        <Text style={[styles.infoText, { color: colors.text }]}>Is Web: {Platform.OS === 'web' ? 'Yes' : 'No'}</Text>
        <Text style={[styles.infoText, { color: colors.text }]}>Is Client: {isClient ? 'Yes' : 'No'}</Text>
        <Text style={[styles.infoText, { color: colors.text }]}>Theme: {theme}</Text>
      </View>
      
      <TouchableOpacity 
        style={[styles.themeButton, { backgroundColor: colors.primary }]}
        onPress={toggleTheme}
      >
        <Text style={styles.buttonText}>Toggle Theme</Text>
      </TouchableOpacity>
      
      <View style={styles.buttonContainer}>
        {isClient && (
          <>
            <Button 
              title="Go to Welcome" 
              onPress={() => router.push('/welcome')}
            />
            <View style={styles.buttonSpacer} />
            <Button 
              title="Go to Login" 
              onPress={() => router.push('/login')}
            />
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 30,
    textAlign: 'center',
  },
  infoContainer: {
    padding: 20,
    borderRadius: 10,
    marginBottom: 30,
    width: '100%',
    maxWidth: 400,
  },
  infoText: {
    fontSize: 16,
    marginBottom: 8,
  },
  buttonContainer: {
    width: '100%',
    maxWidth: 300,
    marginTop: 20,
  },
  buttonSpacer: {
    height: 16,
  },
  themeButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginBottom: 20,
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  }
});