import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { useTheme } from '@/context/ThemeContext';
import { Colors } from '@/constants/Colors';

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  
  return (
    <TouchableOpacity
      onPress={toggleTheme}
      style={[
        styles.container,
        { backgroundColor: theme === 'light' ? Colors.light.surface : Colors.dark.surface }
      ]}
      activeOpacity={0.7}
    >
      <View style={styles.iconContainer}>
        <IconSymbol
          name={theme === 'light' ? 'sun.max.fill' : 'moon.fill'}
          size={24}
          color={theme === 'light' ? Colors.light.primary : Colors.dark.primary}
        />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});