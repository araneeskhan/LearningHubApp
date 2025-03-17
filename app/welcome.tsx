import React from 'react';
import { StyleSheet, View, Image, Dimensions } from 'react-native';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/ThemedText';
import { Button } from '@/components/ui/Button';
import { ThemeToggle } from '@/components/ThemeToggle';
import { useTheme } from '@/context/ThemeContext';
import { Colors } from '@/constants/Colors';

const { width } = Dimensions.get('window');

export default function WelcomeScreen() {
  const { theme } = useTheme();
  const colors = Colors[theme];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={theme === 'dark' ? 'light' : 'dark'} />
      
      <View style={styles.themeToggleContainer}>
        <ThemeToggle />
      </View>
      
      <View style={styles.logoContainer}>
        <Image 
          source={require('@/assets/images/learning-hub-logo.png')} 
          style={styles.logo}
          resizeMode="contain"
        />
        <ThemedText type="title" style={styles.title}>Learning Hub</ThemedText>
        <ThemedText style={styles.subtitle}>
          Your gateway to knowledge and skills
        </ThemedText>
      </View>
      
      <View style={styles.illustrationContainer}>
        <Image 
          source={
            theme === 'dark' 
              ? require('@/assets/images/welcome-illustration-dark.png')
              : require('@/assets/images/welcome-illustration-light.png')
          } 
          style={styles.illustration}
          resizeMode="contain"
        />
      </View>
      
      <View style={styles.buttonContainer}>
        <Button 
          title="Sign In" 
          onPress={() => router.push('/login')}
          variant="primary"
          size="large"
          fullWidth
        />
        <View style={styles.buttonSpacer} />
        <Button 
          title="Create Account" 
          onPress={() => router.push('/signup')}
          variant="outline"
          size="large"
          fullWidth
        />
        <View style={styles.buttonSpacer} />
        <Button 
          title="Continue as Guest" 
          onPress={() => router.push('/(tabs)')}
          variant="text"
          size="medium"
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
  },
  themeToggleContainer: {
    position: 'absolute',
    top: 50,
    right: 24,
    zIndex: 10,
  },
  logoContainer: {
    alignItems: 'center',
    marginTop: 60,
  },
  logo: {
    width: 80,
    height: 80,
    marginBottom: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
  },
  illustrationContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  illustration: {
    width: width * 0.8,
    height: width * 0.8,
  },
  buttonContainer: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 24,
  },
  buttonSpacer: {
    height: 16,
  },
});