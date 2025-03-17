import React, { useRef } from 'react';
import { View, StyleSheet, ScrollView, Image, Platform, Animated, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Markdown from 'react-native-markdown-display';
import { MotiView } from 'moti';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/context/ThemeContext';
import { Colors } from '@/constants/Colors';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';


interface TextContentProps {
  content: string;
  fadeAnim: Animated.Value;
}



interface TextContentProps {
  content: string;
  fadeAnim: Animated.Value;
}

export const TextContent = ({ content, fadeAnim }: TextContentProps) => {
  const { theme } = useTheme();
  const colors = Colors[theme];

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <Markdown
        style={{
          body: { color: colors.text, fontSize: 16, lineHeight: 24 },
          heading1: { color: colors.text, fontSize: 24, fontWeight: 'bold', marginVertical: 16 },
          heading2: { color: colors.text, fontSize: 20, fontWeight: 'bold', marginVertical: 12 },
          heading3: { color: colors.text, fontSize: 18, fontWeight: 'bold', marginVertical: 8 },
          paragraph: { marginVertical: 8 },
          link: { color: colors.primary },
          blockquote: { 
            backgroundColor: colors.surface, 
            paddingHorizontal: 16, 
            paddingVertical: 8, 
            borderLeftWidth: 4, 
            borderLeftColor: colors.primary 
          },
          code_block: { 
            backgroundColor: theme === 'dark' ? '#1E1E1E' : '#F5F5F5', 
            padding: 16, 
            borderRadius: 8,
            fontFamily: 'monospace'
          },
          code_inline: { 
            backgroundColor: theme === 'dark' ? '#1E1E1E' : '#F5F5F5', 
            padding: 4, 
            borderRadius: 4,
            fontFamily: 'monospace'
          },
          list_item: { marginVertical: 4 },
          bullet_list: { marginVertical: 8 },
          ordered_list: { marginVertical: 8 },
          image: { width: '100%', height: 200, borderRadius: 8, marginVertical: 12 },
        }}
      >
        {content}
      </Markdown>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 16,
    marginBottom: 24,
  },
});

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    marginBottom: 16,
    overflow: 'hidden',
  },
  wrapper: {
    padding: 0,
  },
  headerBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  headerDots: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  scrollTopButton: {
    padding: 6,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  heading1Container: {
    marginTop: 28,
    marginBottom: 16,
    position: 'relative',
  },
  heading2Container: {
    marginTop: 24,
    marginBottom: 12,
  },
  heading1Accent: {
    position: 'absolute',
    left: 0,
    top: 0,
    width: 4,
    height: '100%',
    borderRadius: 2,
  },
  blockquote: {
    backgroundColor: 'rgba(0,0,0,0.03)',
    borderLeftWidth: 4,
    borderLeftColor: 'rgba(0,0,0,0.1)',
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginVertical: 16,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  blockquoteIcon: {
    marginRight: 12,
    marginTop: 4,
  },
  blockquoteContent: {
    flex: 1,
  },
  imageContainer: {
    marginVertical: 16,
    borderRadius: 12,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: 200,
    borderRadius: 12,
  },
  imageCaption: {
    fontSize: 14,
    textAlign: 'center',
    fontStyle: 'italic',
    marginTop: 8,
    opacity: 0.7,
  },
  listItem: {
    flexDirection: 'row',
    marginVertical: 6,
    alignItems: 'flex-start',
  },
  bulletPoint: {
    marginRight: 8,
    marginTop: 4,
  },
  listItemContent: {
    flex: 1,
  },
});

export default TextContent;