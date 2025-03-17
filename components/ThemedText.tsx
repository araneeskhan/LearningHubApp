import { Text, TextProps } from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { Colors } from '@/constants/Colors';

export type ThemedTextProps = TextProps & {
  lightColor?: string;
  darkColor?: string;
  type?: 'default' | 'defaultSemiBold' | 'title' | 'subtitle' | 'link';
};

export function ThemedText(props: ThemedTextProps) {
  const { style, lightColor, darkColor, type = 'default', ...otherProps } = props;
  const { theme } = useTheme();
  const colors = Colors[theme];

  // Default text color based on theme
  const color = theme === 'dark' ? colors.text : colors.text;

  // Font styles based on text type
  let textStyle = {};
  switch (type) {
    case 'title':
      textStyle = {
        fontSize: 24,
        fontWeight: '700',
        marginBottom: 8,
      };
      break;
    case 'subtitle':
      textStyle = {
        fontSize: 18,
        fontWeight: '600',
        marginBottom: 4,
      };
      break;
    case 'defaultSemiBold':
      textStyle = {
        fontWeight: '600',
      };
      break;
    case 'link':
      textStyle = {
        color: colors.primary,
        textDecorationLine: 'underline',
      };
      break;
    default:
      textStyle = {
        fontSize: 16,
      };
  }

  return (
    <Text
      style={[{ color }, textStyle, style]}
      {...otherProps}
    />
  );
}
