import React, { useEffect, useState } from 'react';
import { StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity, View, Image } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { supabase } from '@/lib/supabase';
import { useCourseProgress } from '@/context/CourseProgressContext';
import { Colors } from '@/constants/Colors';
import { useTheme } from '@/context/ThemeContext';
import { showToast } from '@/components/Toast';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Collapsible } from '@/components/Collapsible';
import { useSubscription } from '@/context/SubscriptionContext';

type Course = {
  id: string;
  title: string;
  description: string;
  image_url: string;
  instructor: string;
  duration: number;
  level: 'beginner' | 'intermediate' | 'advanced';
  tags: string[];
  created_at: string;
  is_premium: boolean;
};

type Module = {
  id: string;
  course_id: string;
  title: string;
  description: string;
  order: number;
};

type Lesson = {
  id: string;
  module_id: string;
  title: string;
  description: string;
  content_type: 'video' | 'text' | 'quiz';
  duration: number;
  order: number;
};

export default function CourseScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { theme } = useTheme();
  const colors = Colors[theme];
  const { canAccessPremiumContent } = useSubscription();
  const { 
    getCompletedLessonsInModule, 
    getTotalLessonsInModule,
    getCompletedLessonsInCourse,
    getTotalLessonsInCourse,
    isLessonCompleted,
    isLessonAccessible,
    refreshProgress
  } = useCourseProgress();
  
  const [course, setCourse] = useState<Course | null>(null);
  const [modules, setModules] = useState<Module[]>([]);
  const [lessons, setLessons] = useState<{ [key: string]: Lesson[] }>({});
  const [loading, setLoading] = useState(true);
  const [expandedModules, setExpandedModules] = useState<string[]>([]);

  useEffect(() => {
    if (id) {
      fetchCourseDetails();
      refreshProgress();
    }
  }, [id]);

  const fetchCourseDetails = async () => {
    try {
      setLoading(true);
      
      // Fetch course details
      const { data: courseData, error: courseError } = await supabase
        .from('courses')
        .select('*')
        .eq('id', id)
        .single();

      if (courseError) {
        console.error('Error fetching course:', courseError);
        showToast.error('Failed to load course details');
        return;
      }

      setCourse(courseData);

      // Fetch modules
      const { data: modulesData, error: modulesError } = await supabase
        .from('modules')
        .select('*')
        .eq('course_id', id)
        .order('order', { ascending: true });

      if (modulesError) {
        console.error('Error fetching modules:', modulesError);
        showToast.error('Failed to load course modules');
        return;
      }

      setModules(modulesData);
      
      // If there are modules, expand the first one by default
      if (modulesData.length > 0) {
        setExpandedModules([modulesData[0].id]);
      }

      // Fetch lessons for each module
      const lessonsObj: { [key: string]: Lesson[] } = {};
      
      for (const module of modulesData) {
        const { data: lessonsData, error: lessonsError } = await supabase
          .from('lessons')
          .select('*')
          .eq('module_id', module.id)
          .order('order', { ascending: true });

        if (lessonsError) {
          console.error(`Error fetching lessons for module ${module.id}:`, lessonsError);
          continue;
        }

        lessonsObj[module.id] = lessonsData;
      }

      setLessons(lessonsObj);
    } catch (error) {
      console.error('Error in fetchCourseDetails:', error);
      showToast.error('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const toggleModuleExpansion = (moduleId: string) => {
    setExpandedModules(prev => 
      prev.includes(moduleId)
        ? prev.filter(id => id !== moduleId)
        : [...prev, moduleId]
    );
  };

  const handleLessonPress = async (lesson: Lesson) => {
    const accessible = await isLessonAccessible(lesson.id);
    
    if (!accessible) {
      Alert.alert(
        "Lesson Locked",
        "Complete previous lessons first to unlock this lesson.",
        [{ text: "OK" }]
      );
      return;
    }

    if (course?.is_premium && !canAccessPremiumContent) {
      router.push('/subscription');
      return;
    }

    if (lesson.content_type === 'quiz') {
      router.push({
        pathname: `/quiz/${lesson.id}`,
        params: { moduleId: lesson.module_id, courseId: id as string }
      });
    } else {
      router.push({
        pathname: `/lesson/${lesson.id}`,
        params: { moduleId: lesson.module_id, courseId: id as string }
      });
    }
  };

  const getModuleProgress = (moduleId: string) => {
    const completed = getCompletedLessonsInModule(moduleId);
    const total = getTotalLessonsInModule(moduleId);
    return total > 0 ? Math.round((completed / total) * 100) : 0;
  };

  const getCourseProgress = () => {
    if (!course) return 0;
    const completed = getCompletedLessonsInCourse(course.id);
    const total = getTotalLessonsInCourse(course.id);
    return total > 0 ? Math.round((completed / total) * 100) : 0;
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <Stack.Screen options={{ title: 'Course Details' }} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (!course) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <Stack.Screen options={{ title: 'Course Not Found' }} />
        <View style={styles.errorContainer}>
          <IconSymbol name="exclamationmark.triangle" size={48} color={colors.error} />
          <ThemedText type="title" style={styles.errorTitle}>Course Not Found</ThemedText>
          <ThemedText style={styles.errorMessage}>
            The course you're looking for doesn't exist or has been removed.
          </ThemedText>
          <TouchableOpacity
            style={[styles.backButton, { backgroundColor: colors.primary }]}
            onPress={() => router.back()}
          >
            <ThemedText style={styles.backButtonText}>Go Back</ThemedText>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen options={{ title: course.title }} />
      
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.courseHeader}>
          <Image 
            source={{ uri: course.image_url || 'https://via.placeholder.com/400x200' }} 
            style={styles.courseImage}
            resizeMode="cover"
          />
          
          {course.is_premium && (
            <View style={[styles.premiumBadge, { backgroundColor: colors.accentOrange }]}>
              <ThemedText style={styles.premiumText}>PRO</ThemedText>
            </View>
          )}
          
          <View style={styles.courseInfo}>
            <ThemedText type="title" style={styles.courseTitle}>{course.title}</ThemedText>
            
            <View style={styles.courseMetaRow}>
              <View style={styles.metaItem}>
                <IconSymbol name="person.fill" size={16} color={colors.textSecondary} />
                <ThemedText style={styles.metaText}>{course.instructor}</ThemedText>
              </View>
              
              <View style={styles.metaItem}>
                <IconSymbol name="clock.fill" size={16} color={colors.textSecondary} />
                <ThemedText style={styles.metaText}>{course.duration} hours</ThemedText>
              </View>
              
              <View style={styles.metaItem}>
                <IconSymbol name="chart.bar.fill" size={16} color={colors.textSecondary} />
                <ThemedText style={styles.metaText}>{course.level}</ThemedText>
              </View>
            </View>
            
            <View style={styles.progressContainer}>
              <View style={[styles.progressBar, { backgroundColor: colors.border }]}>
                <View 
                  style={[
                    styles.progressFill, 
                    { 
                      backgroundColor: colors.primary,
                      width: `${getCourseProgress()}%` 
                    }
                  ]} 
                />
              </View>
              <ThemedText style={styles.progressText}>{getCourseProgress()}% complete</ThemedText>
            </View>
          </View>
          
          <ThemedText style={styles.courseDescription}>{course.description}</ThemedText>
          
          <View style={styles.tagsContainer}>
            {course.tags && course.tags.map((tag, index) => (
              <View 
                key={index} 
                style={[styles.tagBadge, { backgroundColor: colors.surface }]}
              >
                <ThemedText style={styles.tagText}>{tag}</ThemedText>
              </View>
            ))}
          </View>
        </View>
        
        <View style={styles.modulesContainer}>
          <ThemedText type="subtitle" style={styles.modulesTitle}>Course Content</ThemedText>
          
          {modules.length === 0 ? (
            <ThemedText style={styles.noContentText}>
              No content available for this course yet.
            </ThemedText>
          ) : (
            modules.map((module) => (
              <View key={module.id} style={styles.moduleCard}>
                <TouchableOpacity 
                  style={styles.moduleHeader}
                  onPress={() => toggleModuleExpansion(module.id)}
                >
                  <View style={styles.moduleHeaderLeft}>
                    <ThemedText type="subtitle" style={styles.moduleTitle}>
                      {module.title}
                    </ThemedText>
                    
                    <View style={styles.moduleProgress}>
                      <ThemedText style={styles.moduleProgressText}>
                        {getCompletedLessonsInModule(module.id)}/{getTotalLessonsInModule(module.id)} lessons
                      </ThemedText>
                      <View style={[styles.moduleProgressBar, { backgroundColor: colors.border }]}>
                        <View 
                          style={[
                            styles.moduleProgressFill, 
                            { 
                              backgroundColor: colors.primary,
                              width: `${getModuleProgress(module.id)}%` 
                            }
                          ]} 
                        />
                      </View>
                    </View>
                  </View>
                  
                  <IconSymbol 
                    name={expandedModules.includes(module.id) ? "chevron.up" : "chevron.down"} 
                    size={20} 
                    color={colors.text} 
                  />
                </TouchableOpacity>
                
                {expandedModules.includes(module.id) && (
                  <View style={styles.lessonsContainer}>
                    {lessons[module.id]?.length > 0 ? (
                      lessons[module.id].map((lesson, index) => (
                        <TouchableOpacity 
                          key={lesson.id}
                          style={[
                            styles.lessonItem,
                            !isLessonAccessible(lesson.id) && styles.lessonLocked,
                            isLessonCompleted(lesson.id) && styles.lessonCompleted,
                          ]}
                          onPress={() => handleLessonPress(lesson)}
                        >
                          <View style={styles.lessonLeft}>
                            <View style={[
                              styles.lessonIcon, 
                              { 
                                backgroundColor: isLessonCompleted(lesson.id) 
                                  ? colors.success 
                                  : !isLessonAccessible(lesson.id)
                                    ? colors.border
                                    : colors.primary 
                              }
                            ]}>
                              <IconSymbol 
                                name={
                                  isLessonCompleted(lesson.id) 
                                    ? "checkmark" 
                                    : !isLessonAccessible(lesson.id)
                                      ? "lock.fill"
                                      : lesson.content_type === 'video' 
                                        ? "play.fill" 
                                        : lesson.content_type === 'quiz'
                                          ? "list.bullet" 
                                          : "doc.text.fill"
                                } 
                                size={12} 
                                color="#fff" 
                              />
                            </View>
                            <View style={styles.lessonInfo}>
                              <ThemedText style={[
                                styles.lessonTitle,
                                !isLessonAccessible(lesson.id) && { opacity: 0.5 }
                              ]}>
                                {lesson.title}
                              </ThemedText>
                              <View style={styles.lessonMeta}>
                                <IconSymbol 
                                  name={
                                    lesson.content_type === 'video' 
                                      ? "video.fill" 
                                      : lesson.content_type === 'quiz'
                                        ? "questionmark.circle.fill" 
                                        : "text.book.closed.fill"
                                  } 
                                  size={12} 
                                  color={colors.textSecondary} 
                                />
                                <ThemedText style={styles.lessonType}>
                                  {lesson.content_type.charAt(0).toUpperCase() + lesson.content_type.slice(1)}
                                </ThemedText>
                                {lesson.duration > 0 && (
                                  <>
                                    <View style={styles.metaDot} />
                                    <ThemedText style={styles.lessonDuration}>
                                      {lesson.duration} min
                                    </ThemedText>
                                  </>
                                )}
                              </View>
                            </View>
                          </View>
                          
                          <IconSymbol 
                            name="chevron.right" 
                            size={16} 
                            color={colors.textSecondary} 
                          />
                        </TouchableOpacity>
                      ))
                    ) : (
                      <ThemedText style={styles.noLessonsText}>
                        No lessons available in this module.
                      </ThemedText>
                    )}
                  </View>
                )}
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorTitle: {
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  errorMessage: {
    textAlign: 'center',
    marginBottom: 24,
    opacity: 0.7,
  },
  backButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  backButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  scrollContent: {
    padding: 16,
  },
  courseHeader: {
    marginBottom: 24,
  },
  courseImage: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    marginBottom: 16,
  },
  premiumBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  premiumText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 12,
  },
  courseInfo: {
    marginBottom: 16,
  },
  courseTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  courseMetaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginBottom: 16,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    opacity: 0.7,
  },
  progressContainer: {
    marginBottom: 8,
  },
  progressBar: {
    height: 6,
    borderRadius: 3,
    marginBottom: 8,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 12,
    opacity: 0.7,
  },
  courseDescription: {
    lineHeight: 22,
    marginBottom: 16,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tagBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  tagText: {
    fontSize: 12,
  },
  modulesContainer: {
    marginTop: 8,
  },
  modulesTitle: {
    marginBottom: 16,
  },
  noContentText: {
    textAlign: 'center',
    opacity: 0.7,
    padding: 24,
  },
  moduleCard: {
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
  },
  moduleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  moduleHeaderLeft: {
    flex: 1,
  },
  moduleTitle: {
    marginBottom: 8,
  },
  moduleProgress: {
    width: '100%',
  },
  moduleProgressText: {
    fontSize: 12,
    opacity: 0.7,
    marginBottom: 4,
  },
  moduleProgressBar: {
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
  },
  moduleProgressFill: {
    height: '100%',
    borderRadius: 2,
  },
  lessonsContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  noLessonsText: {
    textAlign: 'center',
    opacity: 0.7,
    paddingVertical: 16,
  },
  lessonItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.05)',
  },
  lessonLocked: {
    opacity: 0.6,
  },
  lessonCompleted: {
    opacity: 0.8,
  },
  lessonLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  lessonIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  lessonInfo: {
    flex: 1,
  },
  lessonTitle: {
    fontWeight: '500',
    marginBottom: 4,
  },
  lessonMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  lessonType: {
    fontSize: 12,
    opacity: 0.7,
    marginLeft: 4,
  },
  metaDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    marginHorizontal: 6,
  },
  lessonDuration: {
    fontSize: 12,
    opacity: 0.7,
  },
});

// Update the renderLesson function to properly show completion status and lock/unlock state
const renderLesson = (lesson: Lesson, index: number) => {
  const [accessible, setAccessible] = useState(false);
  const [loading, setLoading] = useState(true);
  const completed = isLessonCompleted(lesson.id);
  
  useEffect(() => {
    const checkAccess = async () => {
      setLoading(true);
      try {
        const isAccessible = await isLessonAccessible(lesson.id);
        setAccessible(isAccessible);
      } catch (error) {
        console.error('Error checking lesson access:', error);
        setAccessible(false);
      } finally {
        setLoading(false);
      }
    };
    
    checkAccess();
  }, [lesson.id, userProgress]);
  
  return (
    <TouchableOpacity
      key={lesson.id}
      style={[
        styles.lessonItem,
        { backgroundColor: colors.surface }
      ]}
      onPress={() => {
        if (!accessible) {
          // Show alert if lesson is locked
          Alert.alert(
            "Lesson Locked",
            "You need to complete the previous lessons first before accessing this one.",
            [{ text: "OK", onPress: () => {} }]
          );
          return;
        }
        
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        router.push({
          pathname: `/lesson/${lesson.id}`,
          params: { courseId: id, moduleId: lesson.module_id }
        });
      }}
      disabled={!accessible}
    >
      <View style={styles.lessonIndex}>
        <View 
          style={[
            styles.lessonIndexCircle, 
            { 
              backgroundColor: completed 
                ? colors.primary 
                : accessible 
                  ? colors.background 
                  : colors.border,
              borderColor: completed 
                ? colors.primary 
                : accessible 
                  ? colors.primary 
                  : colors.border,
            }
          ]}
        >
          {completed ? (
            <IconSymbol name="checkmark" size={14} color="#FFFFFF" />
          ) : (
            <ThemedText style={styles.lessonIndexText}>
              {index + 1}
            </ThemedText>
          )}
        </View>
      </View>
      
      <View style={styles.lessonContent}>
        <ThemedText 
          style={[
            styles.lessonTitle, 
            { opacity: accessible ? 1 : 0.5 }
          ]}
        >
          {lesson.title}
        </ThemedText>
        
        <View style={styles.lessonMeta}>
          {lesson.duration && (
            <View style={styles.lessonMetaItem}>
              <IconSymbol name="clock" size={12} color={colors.text} style={{ opacity: 0.6 }} />
              <ThemedText style={styles.lessonMetaText}>
                {lesson.duration}
              </ThemedText>
            </View>
          )}
          
          {lesson.video_url && (
            <View style={styles.lessonMetaItem}>
              <IconSymbol name="play.circle" size={12} color={colors.text} style={{ opacity: 0.6 }} />
              <ThemedText style={styles.lessonMetaText}>
                Video
              </ThemedText>
            </View>
          )}
          
          {lesson.quiz_id && (
            <View style={styles.lessonMetaItem}>
              <IconSymbol name="list.bullet.clipboard" size={12} color={colors.text} style={{ opacity: 0.6 }} />
              <ThemedText style={styles.lessonMetaText}>
                Quiz
              </ThemedText>
            </View>
          )}
        </View>
      </View>
      
      <View style={styles.lessonStatus}>
        {!accessible && (
          <IconSymbol name="lock.fill" size={16} color={colors.border} />
        )}
        {accessible && !completed && (
          <IconSymbol name="circle" size={16} color={colors.border} />
        )}
        {completed && (
          <View style={[styles.completedBadge, { backgroundColor: colors.primary }]}>
            <ThemedText style={styles.completedText}>Completed</ThemedText>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

// Update the getModuleProgress function to handle async getTotalLessonsInModule
const getModuleProgress = async (moduleId: string) => {
  const completed = getCompletedLessonsInModule(moduleId);
  const total = await getTotalLessonsInModule(moduleId);
  return total > 0 ? Math.round((completed / total) * 100) : 0;
};

// Update the getCourseProgress function to handle async getTotalLessonsInCourse
const getCourseProgress = async () => {
  if (!course) return 0;
  const completed = getCompletedLessonsInCourse(course.id);
  const total = await getTotalLessonsInCourse(course.id);
  return total > 0 ? Math.round((completed / total) * 100) : 0;
};