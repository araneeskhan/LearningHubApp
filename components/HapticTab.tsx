// HapticTab.tsx
import { BottomTabBarButtonProps } from '@react-navigation/bottom-tabs';
import { PlatformPressable } from '@react-navigation/elements';
import * as Haptics from 'expo-haptics';
import React from 'react';
import { StyleSheet, View, Platform } from 'react-native';
import { MotiView } from 'moti';

export function HapticTab(props: BottomTabBarButtonProps) {
  const { accessibilityState } = props;
  const focused = accessibilityState?.selected;

  return (
    <PlatformPressable
      {...props}
      onPressIn={(ev) => {
        // Enhanced haptic feedback
        if (Platform.OS === 'ios') {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        } else {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        }
        props.onPressIn?.(ev);
      }}
      style={({ pressed }) => [
        styles.tabButton,
        props.style,
      ]}
    >
      <MotiView
        style={styles.tabContainer}
        animate={{
          scale: focused ? 1.1 : 1,
        }}
        transition={{
          type: 'timing',
          duration: 200,
        }}
      >
        {props.children}
      </MotiView>
    </PlatformPressable>
  );
}

const styles = StyleSheet.create({
  tabButton: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    height: '100%', // Ensure full height
  },
  tabContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});