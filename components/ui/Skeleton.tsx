import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, ViewStyle, Animated } from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { Colors } from '@/constants/Colors';

interface SkeletonProps {
  width: number | string;
  height: number;
  borderRadius?: number;
  style?: ViewStyle;
}

export const Skeleton = ({ width, height, borderRadius = 4, style }: SkeletonProps) => {
  const { theme } = useTheme();
  const colors = Colors[theme];
  const opacityAnim = useRef(new Animated.Value(0.6)).current;

  useEffect(() => {
    // Create a pulse animation
    const pulse = Animated.sequence([
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 0.6,
        duration: 800,
        useNativeDriver: true,
      })
    ]);

    // Run the animation in a loop
    Animated.loop(pulse).start();

    // Clean up animation when component unmounts
    return () => {
      opacityAnim.stopAnimation();
    };
  }, []);

  return (
    <View style={[{ width, height, borderRadius }, style]}>
      <Animated.View
        style={[
          StyleSheet.absoluteFillObject,
          { 
            backgroundColor: theme === 'light' ? '#E0E0E0' : '#333333',
            borderRadius,
            opacity: opacityAnim
          },
        ]}
      />
    </View>
  );
};