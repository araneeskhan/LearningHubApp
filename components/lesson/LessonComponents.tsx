import React from 'react';
import { View, StyleSheet, ActivityIndicator, Dimensions, Platform, Animated, TouchableOpacity } from 'react-native';
import { WebView } from 'react-native-webview';
import { LinearGradient } from 'expo-linear-gradient';
import { MotiView } from 'moti';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Skeleton } from '@/components/ui/Skeleton';
import { Colors } from '@/constants/Colors';

// Types
export type Lesson = {
  id: string;
  module_id: string;
  title: string;
  description?: string;
  content_type: 'video' | 'text' | 'quiz';
  content_url?: string;
  content_text?: string;
  content?: string;
  code_snippets?: any[];
  media?: any[];
  duration?: number;
  order: number;
};

// Helper Functions
export const formatTime = (seconds: number) => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
};

export const getLangaugeColor = (language: string) => {
  const colorMap = {
    javascript: '#F7DF1E',
    typescript: '#3178C6',
    python: '#3572A5',
    html: '#E34F26',
    css: '#264de4',
    ruby: '#CC342D',
    swift: '#FFAC45',
    kotlin: '#7F52FF',
    go: '#00ADD8',
    rust: '#DEA584',
    java: '#B07219',
    php: '#4F5D95',
    csharp: '#178600',
    cpp: '#F34B7D',
    shell: '#89E051',
    markdown: '#083FA1',
    json: '#292929',
    sql: '#e38c00',
  };
  
  return colorMap[language.toLowerCase()] || '#607D8B';
};

export const getLanguageFromExtension = (extension: string) => {
  const extMap = {
    js: 'JavaScript',
    jsx: 'JavaScript',
    ts: 'TypeScript',
    tsx: 'TypeScript',
    py: 'Python',
    rb: 'Ruby',
    java: 'Java',
    kt: 'Kotlin',
    swift: 'Swift',
    go: 'Go',
    rs: 'Rust',
    html: 'HTML',
    css: 'CSS',
    scss: 'SCSS',
    php: 'PHP',
    cs: 'C#',
    cpp: 'C++',
    c: 'C',
    sh: 'Shell',
    md: 'Markdown',
    json: 'JSON',
    sql: 'SQL',
  };
  
  return extMap[extension] || 'Code';
};

// UI Components
export const LoadingScreen = ({ theme }: { theme: string }) => {
  const colors = Colors[theme];
  
  return (
    <View style={styles.loadingContainer}>
      <MotiView
        from={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: 'timing', duration: 500 }}
        style={styles.loadingContent}
      >
        <LinearGradient
          colors={theme === 'light' 
            ? ['#F0F4FF', '#E2E8FF'] 
            : ['#252836', '#1A1D23']}
          style={styles.loadingGradient}
        >
          <View style={styles.shimmerContainer}>
            <Skeleton width={200} height={24} borderRadius={4} />
            <Skeleton width={300} height={16} borderRadius={4} style={{ marginTop: 12 }} />
            <Skeleton width="100%" height={240} borderRadius={8} style={{ marginTop: 24 }} />
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 16 }}>
              <Skeleton width={100} height={36} borderRadius={8} />
              <Skeleton width={120} height={36} borderRadius={8} />
              <Skeleton width={100} height={36} borderRadius={8} />
            </View>
          </View>
        </LinearGradient>
      </MotiView>
    </View>
  );
};

export const VideoContent = ({ 
  lesson, 
  videoProgress, 
  webViewRef, 
  onVideoProgress, 
  colors 
}: { 
  lesson: Lesson, 
  videoProgress: number, 
  webViewRef: React.RefObject<WebView>,
  onVideoProgress: (progress: number) => void,
  colors: any
}) => {
  if (!lesson?.content_url) {
    return (
      <ThemedView style={styles.noContentContainer}>
        <IconSymbol name="exclamationmark.triangle" size={48} color={colors.textSecondary} />
        <ThemedText style={styles.noContentText}>
          No video URL provided for this lesson.
        </ThemedText>
      </ThemedView>
    );
  }
  
  return (
    <View style={styles.videoContainer}>
      <MotiView
        from={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: 'timing', duration: 600 }}
        style={styles.videoWrapper}
      >
        <View style={styles.videoPlayerContainer}>
          <WebView
            ref={webViewRef}
            source={{ uri: lesson.content_url }}
            style={styles.webView}
            onLoad={() => console.log('Video loaded')}
            allowsFullscreenVideo={true}
            javaScriptEnabled={true}
            domStorageEnabled={true}
            startInLoadingState={true}
            renderLoading={() => (
              <View style={styles.videoLoading}>
                <ActivityIndicator size="large" color={colors.primary} />
              </View>
            )}
            onMessage={(event) => {
              // Handle messages from the video player if needed
              try {
                const data = JSON.parse(event.nativeEvent.data);
                if (data.type === 'progress') {
                  onVideoProgress(data.progress);
                }
              } catch (e) {
                console.error('Error parsing video message:', e);
              }
            }}
          />
        </View>
        
        {/* Custom video progress bar */}
        <View style={styles.videoProgressContainer}>
          <View style={styles.videoProgressBar}>
            <View 
              style={[
                styles.videoProgressFill, 
                { 
                  width: `${videoProgress * 100}%`,
                  backgroundColor: colors.primary 
                }
              ]}
            />
          </View>
          <View style={styles.videoProgressLabels}>
            <ThemedText style={styles.videoProgressText}>
              {formatTime(videoProgress * (lesson.duration || 0))}
            </ThemedText>
            <ThemedText style={styles.videoProgressText}>
              {formatTime(lesson.duration || 0)}
            </ThemedText>
          </View>
        </View>
      </MotiView>
    </View>
  );
};

// Styles
const windowWidth = Dimensions.get('window').width;
const windowHeight = Dimensions.get('window').height;

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  loadingContent: {
    width: '100%',
    borderRadius: 16,
    overflow: 'hidden',
  },
  loadingGradient: {
    padding: 20,
    borderRadius: 16,
  },
  shimmerContainer: {
    width: '100%',
  },
  videoContainer: {
    marginBottom: 16,
  },
  videoWrapper: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  videoPlayerContainer: {
    width: '100%',
    height: 220,
    backgroundColor: '#000',
  },
  webView: {
    flex: 1,
  },
  videoLoading: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  videoProgressContainer: {
    padding: 12,
  },
  videoProgressBar: {
    height: 4,
    backgroundColor: 'rgba(0,0,0,0.1)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  videoProgressFill: {
    height: '100%',
    borderRadius: 2,
  },
  videoProgressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  videoProgressText: {
    fontSize: 12,
    opacity: 0.7,
  },
  noContentContainer: {
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
  },
  noContentText: {
    marginTop: 12,
    textAlign: 'center',
    opacity: 0.7,
  },
});