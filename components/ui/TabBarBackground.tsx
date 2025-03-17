import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { Colors } from '@/constants/Colors';

export default function TabBarBackground() {
  const { theme } = useTheme();
  const colors = Colors[theme];
  
  return (
    <View style={[
      styles.container,
      { 
        backgroundColor: theme === 'light' ? colors.surface : colors.card,
        shadowColor: theme === 'light' ? '#000' : 'transparent',
      }
    ]} />
  );
}

export function useBottomTabOverflow() {
  return 0;
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 20,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
  }
});