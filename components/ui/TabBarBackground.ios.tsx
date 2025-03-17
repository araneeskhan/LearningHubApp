import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/context/ThemeContext';
import { Colors } from '@/constants/Colors';

export default function BlurTabBarBackground() {
  const { theme } = useTheme();
  const colors = Colors[theme];
  
  return (
    <View style={[
      styles.container,
      { backgroundColor: theme === 'light' ? '#F8F9FA' : '#1E1E1E' }
    ]} />
  );
}

export function useBottomTabOverflow() {
  const tabHeight = useBottomTabBarHeight();
  const { bottom } = useSafeAreaInsets();
  return tabHeight - bottom;
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 30, // Fully rounded corners on all sides
    marginHorizontal: 24, // Margin on left and right
    marginBottom: 12, // Margin at bottom
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
  }
});
