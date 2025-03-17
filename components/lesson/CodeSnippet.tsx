import React, { useState } from 'react';
import { StyleSheet, View, TouchableOpacity, ScrollView } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { useTheme } from '@/context/ThemeContext';
import { Colors } from '@/constants/Colors';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import { showToast } from '@/components/Toast';
import { MotiView } from 'moti';

interface CodeSnippetProps {
  snippet: {
    language: string;
    code: string;
    title?: string;
  };
  index: number;
}

export const CodeSnippet = ({ snippet, index }: CodeSnippetProps) => {
  const { theme } = useTheme();
  const colors = Colors[theme];
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await Clipboard.setStringAsync(snippet.code);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setCopied(true);
      showToast.success('Code copied to clipboard');
      
      // Reset copied state after 2 seconds
      setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch (error) {
      console.error('Failed to copy code:', error);
      showToast.error('Failed to copy code');
    }
  };

  return (
    <MotiView
      from={{ opacity: 0, translateY: 10 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: 'timing', duration: 400, delay: index * 100 }}
      style={styles.container}
    >
      <View style={[styles.header, { backgroundColor: theme === 'dark' ? '#2D2D2D' : '#E8E8E8' }]}>
        <View style={styles.headerLeft}>
          <ThemedText style={styles.language}>
            {snippet.language || 'code'}
          </ThemedText>
          {snippet.title && (
            <ThemedText style={styles.title} numberOfLines={1}>
              {snippet.title}
            </ThemedText>
          )}
        </View>
        <TouchableOpacity 
          style={styles.copyButton} 
          onPress={handleCopy}
          accessibilityLabel="Copy code"
        >
          <IconSymbol 
            name={copied ? "checkmark" : "doc.on.doc"} 
            size={16} 
            color={copied ? colors.accentGreen : colors.textSecondary} 
          />
        </TouchableOpacity>
      </View>
      
      <ScrollView 
        horizontal 
        style={[
          styles.codeContainer, 
          { backgroundColor: theme === 'dark' ? '#1E1E1E' : '#F5F5F5' }
        ]}
        showsHorizontalScrollIndicator={true}
      >
        <ThemedText style={styles.code}>
          {snippet.code}
        </ThemedText>
      </ScrollView>
    </MotiView>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  language: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    marginRight: 8,
  },
  title: {
    fontSize: 12,
    opacity: 0.7,
    flex: 1,
  },
  copyButton: {
    padding: 8,
  },
  codeContainer: {
    padding: 12,
    maxHeight: 300,
  },
  code: {
    fontFamily: 'monospace',
    fontSize: 14,
    lineHeight: 20,
  },
});