import React, { useState, useEffect, useRef } from 'react';
import { 
  StyleSheet, 
  View, 
  ScrollView, 
  TouchableOpacity, 
  ActivityIndicator,
  Dimensions,
  Platform,
  KeyboardAvoidingView,
  Animated,
  Share,
  Alert
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { MotiView } from 'moti';
import Markdown from 'react-native-markdown-display';
import { ThemedText } from '@/components/ThemedText';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { Colors } from '@/constants/Colors';
import { Lesson, Module } from '@/types';
import { CodeSnippet } from '@/components/lesson/CodeSnippet';
import { VideoPlayer } from '@/components/lesson/VideoPlayer';
import { useCourseProgress } from '@/context/CourseProgressContext';

const { width, height } = Dimensions.get('window');

export default function LessonScreen() {
  const { id, courseId, moduleId } = useLocalSearchParams();
  const router = useRouter();
  const { theme } = useTheme();
  const colors = Colors[theme];
  const { user } = useAuth();
  const { 
    isLessonCompleted, 
    markLessonCompleted,
    updateLessonProgress,
    getNextLesson,
    isLessonAccessible
  } = useCourseProgress();
  
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [module, setModule] = useState<Module | null>(null);
  const [loading, setLoading] = useState(true);
  const [videoProgress, setVideoProgress] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const [nextLessonId, setNextLessonId] = useState<string | null>(null);
  const [isNextLessonAccessible, setIsNextLessonAccessible] = useState(false);
  
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scrollY = useRef(new Animated.Value(0)).current; // Add this line to define scrollY
  const scrollViewRef = useRef<ScrollView>(null);
  
  useEffect(() => {
    fetchLessonDetails();
    checkLessonStatus();
  }, [id]);
  
  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, [lesson]);

  const fetchLessonDetails = async () => {
    if (!id) return;
    
    try {
      setLoading(true);
      
      // Fetch lesson details
      const { data: lessonData, error: lessonError } = await supabase
        .from('lessons')
        .select('*')
        .eq('id', id)
        .single();
      
      if (lessonError) {
        console.error('Error fetching lesson:', lessonError);
        return;
      }
      
      setLesson(lessonData);
      
      // Fetch module details
      if (moduleId) {
        const { data: moduleData, error: moduleError } = await supabase
          .from('modules')
          .select('*')
          .eq('id', moduleId)
          .single();
        
        if (moduleError) {
          console.error('Error fetching module:', moduleError);
        } else {
          setModule(moduleData);
        }
      }
      
      // Get next lesson
      if (courseId && moduleId) {
        const nextLesson = await getNextLesson(courseId.toString(), moduleId.toString(), id.toString());
        setNextLessonId(nextLesson?.id || null);
        
        // Check if next lesson is accessible
        if (nextLesson?.id) {
          const canAccess = isLessonAccessible(nextLesson.id.toString());
          setIsNextLessonAccessible(canAccess);
        }
      }
      
    } catch (error) {
      console.error('Error in fetchLessonDetails:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkLessonStatus = async () => {
    if (!id) return;
    
    const completed = isLessonCompleted(id.toString());
    setIsCompleted(completed);
  };

  const handleMarkAsCompleted = async () => {
    if (!id || !courseId || !moduleId) return;
    
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      
      console.log('Marking lesson as completed:', {
        courseId: courseId.toString(),
        moduleId: moduleId.toString(),
        lessonId: id.toString()
      });
      
      await markLessonCompleted(
        courseId.toString(),
        moduleId.toString(),
        id.toString()
      );
      
      setIsCompleted(true);
      
      // Check if next lesson is now accessible
      if (nextLessonId) {
        const canAccess = isLessonAccessible(nextLessonId.toString());
        setIsNextLessonAccessible(canAccess);
      }
      
      // Show success feedback
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      
    } catch (error) {
      console.error('Error marking lesson as completed:', error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  };

  // Update the handleNavigateToNextLesson function
  const handleNavigateToNextLesson = async () => {
    if (!nextLessonId || !courseId || !moduleId) {
      // If no next lesson, go back to course page
      router.push(`/course/${courseId}`);
      return;
    }
    
    const isNextLessonAccessible = await isLessonAccessible(nextLessonId);
    
    if (!isNextLessonAccessible && !isCompleted) {
      // Show alert if next lesson is locked
      Alert.alert(
        "Lesson Locked",
        "You need to complete the current lesson first before proceeding to the next one.",
        [{ text: "OK", onPress: () => {} }]
      );
      return;
    }
    
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push({
      pathname: `/lesson/${nextLessonId}`,
      params: { courseId, moduleId }
    });
  };

  const handleShare = async () => {
    if (!lesson) return;
    
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      await Share.share({
        message: `I'm learning about "${lesson.title}" on LearningHub!`,
        title: lesson.title,
      });
    } catch (error) {
      console.error('Error sharing lesson:', error);
    }
  };

  const handleContinue = () => {
    if (isCompleted) {
      handleNavigateToNextLesson();
    } else {
      handleMarkAsCompleted();
    }
  };

  const handleVideoProgress = (progress: number) => {
    setVideoProgress(progress);
    
    // Auto-mark as completed when video is 95% watched
    if (progress > 0.95 && !isCompleted && lesson) {
      handleMarkAsCompleted();
    }
  };

  const renderHeader = () => (
    <SafeAreaView style={[styles.headerContainer, { borderBottomColor: colors.border }]}>
      <View style={styles.headerContent}>
        <TouchableOpacity 
          style={[styles.backButton, { backgroundColor: colors.surface }]}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.back();
          }}
        >
          <IconSymbol name="chevron.left" size={24} color={colors.text} />
        </TouchableOpacity>
        
        <View style={styles.headerTitleContainer}>
          <ThemedText style={styles.headerTitle} numberOfLines={1}>
            {lesson?.title}
          </ThemedText>
          {module && (
            <ThemedText style={styles.moduleTitle} numberOfLines={1}>
              {module.title}
            </ThemedText>
          )}
        </View>
        
        <TouchableOpacity 
          style={[styles.shareButton, { backgroundColor: colors.surface }]}
          onPress={handleShare}
        >
          <IconSymbol name="square.and.arrow.up" size={20} color={colors.text} />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );

  const renderVideoContent = () => {
    if (!lesson?.video_url) {
      return null;
    }
    
    return (
      <MotiView
        from={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: 'timing', duration: 500 }}
        style={styles.videoContainer}
      >
        <VideoPlayer 
          videoUrl={lesson.video_url} 
          onProgress={handleVideoProgress}
          thumbnail={lesson.thumbnail_url}
        />
      </MotiView>
    );
  };

  const renderMarkdownContent = () => {
    if (!lesson?.content) {
      return null;
    }
    
    return (
      <MotiView
        from={{ opacity: 0, translateY: 20 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: 'timing', duration: 500, delay: 200 }}
        style={[styles.contentContainer, { backgroundColor: colors.card }]}
      >
        <Markdown
          style={{
            body: { color: colors.text, fontSize: 16, lineHeight: 24 },
            heading1: { color: colors.text, fontSize: 24, fontWeight: 'bold', marginVertical: 16 },
            heading2: { color: colors.text, fontSize: 20, fontWeight: 'bold', marginVertical: 12 },
            heading3: { color: colors.text, fontSize: 18, fontWeight: 'bold', marginVertical: 8 },
            paragraph: { marginVertical: 8 },
            link: { color: colors.primary },
            blockquote: { backgroundColor: colors.surface, paddingHorizontal: 16, paddingVertical: 8, borderLeftWidth: 4, borderLeftColor: colors.primary },
            code_block: { backgroundColor: theme === 'dark' ? '#1E1E1E' : '#F5F5F5', padding: 16, borderRadius: 8 },
            code_inline: { backgroundColor: theme === 'dark' ? '#1E1E1E' : '#F5F5F5', padding: 4, borderRadius: 4 },
            list_item: { marginVertical: 4 },
          }}
        >
          {lesson.content}
        </Markdown>
      </MotiView>
    );
  };

  const renderCodeSnippets = () => {
    if (!lesson?.code_snippets || lesson.code_snippets.length === 0) {
      return null;
    }
    
    return (
      <MotiView
        from={{ opacity: 0, translateY: 20 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: 'timing', duration: 500, delay: 400 }}
        style={styles.codeSnippetsContainer}
      >
        <ThemedText style={styles.sectionTitle}>Code Examples</ThemedText>
        {lesson.code_snippets.map((snippet, index) => (
          <CodeSnippet key={index} snippet={snippet} index={index} />
        ))}
      </MotiView>
    );
  };

  const renderQuizButton = () => {
    if (!lesson?.quiz_id) {
      return null;
    }
    
    return (
      <MotiView
        from={{ opacity: 0, translateY: 20 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: 'timing', duration: 500, delay: 600 }}
        style={styles.quizButtonContainer}
      >
        <TouchableOpacity
          style={[styles.quizButton, { backgroundColor: colors.primary }]}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            router.push({
              pathname: `/quiz/${lesson.quiz_id}`,
              params: { lessonId: id, courseId, moduleId }
            });
          }}
        >
          <IconSymbol name="list.bullet.clipboard" size={20} color="#FFFFFF" />
          <ThemedText style={styles.quizButtonText}>Take Quiz</ThemedText>
        </TouchableOpacity>
      </MotiView>
    );
  };

  const renderNavigationButtons = () => {
    return (
      <MotiView
        from={{ opacity: 0, translateY: 20 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: 'timing', duration: 500, delay: 700 }}
        style={[styles.navigationContainer, { backgroundColor: colors.card }]}
      >
        <TouchableOpacity
          style={[styles.navigationButton, { backgroundColor: colors.primary }]}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.back();
          }}
        >
          <IconSymbol name="chevron.left" size={20} color="#FFFFFF" />
          <ThemedText style={styles.navigationButtonText}>Back</ThemedText>
        </TouchableOpacity>

        {nextLessonId && (
          <TouchableOpacity
            style={[
              styles.navigationButton, 
              { 
                backgroundColor: isNextLessonAccessible || isCompleted ? colors.primary : colors.border,
                opacity: isNextLessonAccessible || isCompleted ? 1 : 0.7
              }
            ]}
            onPress={handleNavigateToNextLesson}
            disabled={!isNextLessonAccessible && !isCompleted}
          >
            <ThemedText style={styles.navigationButtonText}>Next Lesson</ThemedText>
            <IconSymbol name="chevron.right" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        )}
      </MotiView>
    );
  };

  const renderProgressIndicator = () => {
    return (
      <MotiView
        from={{ opacity: 0, translateY: -10 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: 'timing', duration: 500 }}
        style={[styles.progressContainer, { backgroundColor: colors.card }]}
      >
        <View style={styles.progressIndicator}>
          <View style={[styles.progressBar, { backgroundColor: colors.border }]}>
            <View 
              style={[
                styles.progressFill, 
                { 
                  backgroundColor: colors.primary,
                  width: `${videoProgress * 100}%` 
                }
              ]} 
            />
          </View>
          <ThemedText style={styles.progressText}>
            {Math.round(videoProgress * 100)}% Complete
          </ThemedText>
        </View>
      </MotiView>
    );
  };

  const renderContinueButton = () => (
    <TouchableOpacity
      style={[
        styles.continueButton, 
        { 
          backgroundColor: isCompleted ? colors.secondary || colors.primary : colors.primary,
          opacity: 1
        }
      ]}
      onPress={handleContinue}
      activeOpacity={0.8}
    >
      <ThemedText style={styles.continueButtonText}>
        {isCompleted ? 'Continue to Next Lesson' : 'Mark as Completed'}
      </ThemedText>
      <IconSymbol 
        name={isCompleted ? "arrow.right" : "checkmark"} 
        size={20} 
        color="#FFFFFF" 
      />
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {renderHeader()}
      
      <ScrollView
        ref={scrollViewRef}
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        scrollEventThrottle={16}
      >
        {renderVideoContent()}
        {renderProgressIndicator()}
        {renderMarkdownContent()}
        {renderCodeSnippets()}
        {renderQuizButton()}
        {renderNavigationButtons()}
        <View style={styles.spacer} />
      </ScrollView>
      
      <View style={[styles.bottomBar, { 
        backgroundColor: colors.background,
        borderTopWidth: 1,
        borderTopColor: colors.border,
        zIndex: 10,
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      }]}>
        {renderContinueButton()}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerContainer: {
    width: '100%',
    borderBottomWidth: 1,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  moduleTitle: {
    fontSize: 14,
    opacity: 0.7,
  },
  shareButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100, // Extra padding to account for the bottom bar
  },
  videoContainer: {
    width: '100%',
    aspectRatio: 16 / 9,
    marginBottom: 16,
  },
  progressContainer: {
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 12,
    borderRadius: 12,
  },
  progressIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  progressBar: {
    flex: 1,
    height: 8,
    borderRadius: 4,
    marginRight: 12,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 14,
    fontWeight: '600',
  },
  contentContainer: {
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
  },
  codeSnippetsContainer: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  quizButtonContainer: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
  quizButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
  },
  quizButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 16,
    marginLeft: 8,
  },
  navigationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginHorizontal: 16,
    marginTop: 20,
    marginBottom: 10,
    borderRadius: 12,
    padding: 16,
  },
  navigationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  navigationButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    marginHorizontal: 8,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    paddingBottom: Platform.OS === 'ios' ? 32 : 16, // Extra padding for iOS
  },
  continueButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    minHeight: 56,
  },
  continueButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 16,
    marginRight: 8,
  },
  spacer: {
    height: 100, // Space at the bottom to ensure content isn't hidden behind the bottom bar
  },
});