import React, { useState, useRef, useEffect } from 'react';
import { StyleSheet, View, TouchableOpacity, ActivityIndicator, Dimensions } from 'react-native';
import { Video, ResizeMode } from 'expo-av';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { ThemedText } from '@/components/ThemedText';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { useTheme } from '@/context/ThemeContext';
import { Colors } from '@/constants/Colors';
import { formatTime } from './LessonComponents';

const { width } = Dimensions.get('window');

interface VideoPlayerProps {
  videoUrl: string;
  onProgress?: (progress: number) => void;
  onComplete?: () => void;
  autoplay?: boolean;
}

export const VideoPlayer = ({ 
  videoUrl, 
  onProgress, 
  onComplete,
  autoplay = false 
}: VideoPlayerProps) => {
  const { theme } = useTheme();
  const colors = Colors[theme];
  const videoRef = useRef<Video>(null);
  
  const [status, setStatus] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [controlsVisible, setControlsVisible] = useState(true);
  const [controlsTimeout, setControlsTimeout] = useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Hide controls after 3 seconds of inactivity
    if (controlsVisible && !status.paused) {
      if (controlsTimeout) clearTimeout(controlsTimeout);
      const timeout = setTimeout(() => {
        setControlsVisible(false);
      }, 3000);
      setControlsTimeout(timeout);
    }

    return () => {
      if (controlsTimeout) clearTimeout(controlsTimeout);
    };
  }, [controlsVisible, status.paused]);

  const handlePlaybackStatusUpdate = (status: any) => {
    setStatus(status);
    
    if (status.isLoaded) {
      setLoading(false);
      
      // Report progress to parent component
      if (onProgress && status.positionMillis && status.durationMillis) {
        const progress = status.positionMillis / status.durationMillis;
        onProgress(progress);
      }
      
      // Check if video is completed
      if (status.didJustFinish && onComplete) {
        onComplete();
      }
    }
  };

  const togglePlayPause = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (status.isPlaying) {
      videoRef.current?.pauseAsync();
    } else {
      videoRef.current?.playAsync();
    }
  };

  const handleVideoPress = () => {
    setControlsVisible(true);
    if (controlsTimeout) clearTimeout(controlsTimeout);
  };

  const seekBackward = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (videoRef.current && status.positionMillis) {
      videoRef.current.setPositionAsync(Math.max(0, status.positionMillis - 10000));
    }
  };

  const seekForward = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (videoRef.current && status.positionMillis && status.durationMillis) {
      videoRef.current.setPositionAsync(
        Math.min(status.durationMillis, status.positionMillis + 10000)
      );
    }
  };

  const onSliderValueChange = (value: number) => {
    if (videoRef.current && status.durationMillis) {
      const newPosition = value * status.durationMillis;
      videoRef.current.setPositionAsync(newPosition);
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity 
        activeOpacity={1} 
        onPress={handleVideoPress}
        style={styles.videoContainer}
      >
        <Video
          ref={videoRef}
          style={styles.video}
          source={{ uri: videoUrl }}
          resizeMode={ResizeMode.CONTAIN}
          onPlaybackStatusUpdate={handlePlaybackStatusUpdate}
          useNativeControls={false}
          shouldPlay={autoplay}
        />
        
        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        )}
        
        {controlsVisible && (
          <View style={styles.controlsOverlay}>
            <LinearGradient
              colors={['rgba(0,0,0,0.7)', 'transparent', 'transparent', 'rgba(0,0,0,0.7)']}
              style={styles.controlsGradient}
            >
              <View style={styles.controlsContainer}>
                <TouchableOpacity onPress={seekBackward} style={styles.controlButton}>
                  <IconSymbol name="gobackward.10" size={24} color="#FFFFFF" />
                </TouchableOpacity>
                
                <TouchableOpacity onPress={togglePlayPause} style={styles.playPauseButton}>
                  <IconSymbol 
                    name={status.isPlaying ? "pause.fill" : "play.fill"} 
                    size={30} 
                    color="#FFFFFF" 
                  />
                </TouchableOpacity>
                
                <TouchableOpacity onPress={seekForward} style={styles.controlButton}>
                  <IconSymbol name="goforward.10" size={24} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
              
              <View style={styles.progressContainer}>
                <View style={styles.timeInfo}>
                  <ThemedText style={styles.timeText}>
                    {formatTime(status.positionMillis ? status.positionMillis / 1000 : 0)}
                  </ThemedText>
                  <ThemedText style={styles.timeText}>
                    {formatTime(status.durationMillis ? status.durationMillis / 1000 : 0)}
                  </ThemedText>
                </View>
                
                <View style={styles.progressBarContainer}>
                  <View style={[styles.progressBar, { backgroundColor: 'rgba(255,255,255,0.3)' }]}>
                    <View 
                      style={[
                        styles.progressFill, 
                        { 
                          width: `${status.positionMillis && status.durationMillis ? 
                            (status.positionMillis / status.durationMillis) * 100 : 0}%`,
                          backgroundColor: colors.primary
                        }
                      ]} 
                    />
                  </View>
                </View>
              </View>
            </LinearGradient>
          </View>
        )}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    aspectRatio: 16 / 9,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#000',
  },
  videoContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  video: {
    width: '100%',
    height: '100%',
  },
  loadingContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  controlsOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  controlsGradient: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'space-between',
    padding: 16,
  },
  controlsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    flex: 1,
  },
  controlButton: {
    padding: 12,
  },
  playPauseButton: {
    padding: 16,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 30,
    marginHorizontal: 20,
  },
  progressContainer: {
    width: '100%',
    paddingHorizontal: 8,
  },
  timeInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  timeText: {
    color: '#FFFFFF',
    fontSize: 12,
  },
  progressBarContainer: {
    width: '100%',
    height: 20,
    justifyContent: 'center',
  },
  progressBar: {
    height: 4,
    width: '100%',
    borderRadius: 2,
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
});