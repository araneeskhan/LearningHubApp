import { View, type ViewProps } from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { Colors } from '@/constants/Colors';

export type ThemedViewProps = ViewProps & {
  lightColor?: string;
  darkColor?: string;
  variant?: 'default' | 'card' | 'elevated';
};

export function ThemedView({ style, lightColor, darkColor, variant = 'default', ...otherProps }: ThemedViewProps) {
  const { theme } = useTheme();
  const colors = Colors[theme];
  
  // Base background color
  const backgroundColor = colors.background;
  
  // Apply variant styles
  let variantStyle = {};
  switch (variant) {
    case 'card':
      variantStyle = {
        backgroundColor: colors.surface,
        borderRadius: 12,
        padding: 16,
      };
      break;
    case 'elevated':
      variantStyle = {
        backgroundColor: colors.surface,
        borderRadius: 12,
        padding: 16,
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: theme === 'dark' ? 0.3 : 0.1,
        shadowRadius: 4,
      };
      break;
    default:
      variantStyle = {
        backgroundColor,
      };
  }

  return <View style={[variantStyle, style]} {...otherProps} />;
}
