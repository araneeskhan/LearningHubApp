import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from './AuthContext';
import { Platform } from 'react-native';

// Define types
type UserProgress = {
  id: string;
  userId: string;
  courseId: string;
  moduleId: string;
  lessonId: string;
  completed: boolean;
  progress: number;
  updated_at?: string;
  created_at?: string;
};

type CourseProgressContextType = {
  userProgress: UserProgress[];
  loading: boolean;
  markLessonCompleted: (courseId: string, moduleId: string, lessonId: string) => Promise<void>;
  updateLessonProgress: (courseId: string, moduleId: string, lessonId: string, progress: number) => Promise<void>;
  isLessonCompleted: (lessonId: string) => boolean;
  isLessonAccessible: (lessonId: string) => Promise<boolean>;
  getCompletedLessonsInModule: (moduleId: string) => number;
  getTotalLessonsInModule: (moduleId: string) => number;
  getCompletedLessonsInCourse: (courseId: string) => number;
  getTotalLessonsInCourse: (courseId: string) => number;
  refreshProgress: () => Promise<void>;
  getNextLesson: (courseId: string, moduleId: string, lessonId: string) => Promise<any>;
  getLastAccessedCourse: () => string | null;
};

// Check if we're in a browser environment
const isBrowser = Platform.OS === 'web';

const CourseProgressContext = createContext<CourseProgressContextType | undefined>(undefined);

export function CourseProgressProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [userProgress, setUserProgress] = useState<UserProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    if (user && isBrowser) {
      fetchUserProgress();
    } else {
      setLoading(false);
    }
  }, [user]);

  const fetchUserProgress = async () => {
    if (!user || !isBrowser) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('user_progress')
        .select('*')
        .eq('user_id', user.id);

      if (error) {
        console.error('Error fetching user progress:', error);
        setLoading(false);
        return;
      }

      // Transform the data to match our UserProgress type
      const progressData: UserProgress[] = data.map(item => ({
        id: item.id,
        userId: item.user_id,
        courseId: item.course_id,
        moduleId: item.module_id,
        lessonId: item.lesson_id,
        completed: item.completed,
        progress: item.progress,
        updated_at: item.updated_at,
        created_at: item.created_at
      }));

      setUserProgress(progressData);
    } catch (error) {
      console.error('Error in fetchUserProgress:', error);
    } finally {
      setLoading(false);
    }
  };

  const refreshProgress = async () => {
    if (user && isBrowser) {
      await fetchUserProgress();
    }
  };

  const isLessonCompleted = (lessonId: string): boolean => {
    if (!lessonId || userProgress.length === 0) return false;
    
    return userProgress.some(
      progress => progress.lessonId === lessonId && progress.completed
    );
  };

  const isLessonAccessible = async (lessonId: string): Promise<boolean> => {
    if (!lessonId) return false;
    
    try {
      // If the lesson is already completed, it's accessible
      if (isLessonCompleted(lessonId)) {
        return true;
      }
      
      // Get lesson details to know its module and order
      const { data: lesson, error: lessonError } = await supabase
        .from('lessons')
        .select('*, module_id')
        .eq('id', lessonId)
        .single();
        
      if (lessonError) {
        console.error('Error fetching lesson:', lessonError);
        return false;
      }
      
      // Get module details
      const { data: moduleData, error: moduleError } = await supabase
        .from('modules')
        .select('*, course_id')
        .eq('id', lesson.module_id)
        .single();
        
      if (moduleError) {
        console.error('Error fetching module:', moduleError);
        return false;
      }
      
      // Rule 1: First lesson of first module is always accessible
      if (lesson.order === 1) {
        if (moduleData.order === 1) {
          // First lesson of first module is always accessible
          return true;
        } else {
          // Rule 3: First lesson of subsequent modules is accessible only if all lessons in previous module are completed
          
          // Get previous module - FIX: Use filter instead of eq for order comparison
          const { data: modules, error: modulesError } = await supabase
            .from('modules')
            .select('id')
            .eq('course_id', moduleData.course_id)
            .order('order', { ascending: true });
            
          if (modulesError) {
            console.error('Error fetching modules:', modulesError);
            return false;
          }
          
          // Find the previous module based on order
          const prevModuleIndex = modules.findIndex(m => m.id === moduleData.id) - 1;
          if (prevModuleIndex < 0) {
            console.error('Could not find previous module');
            return false;
          }
          
          const prevModule = modules[prevModuleIndex];
          
          // Get all lessons in previous module
          const { data: prevModuleLessons, error: prevLessonsError } = await supabase
            .from('lessons')
            .select('id')
            .eq('module_id', prevModule.id);
            
          if (prevLessonsError) {
            console.error('Error fetching previous module lessons:', prevLessonsError);
            return false;
          }
          
          // Check if all lessons in previous module are completed
          const allPrevLessonsCompleted = prevModuleLessons.every(
            prevLesson => isLessonCompleted(prevLesson.id)
          );
          
          return allPrevLessonsCompleted;
        }
      } else {
        // Rule 2: Subsequent lessons in a module are accessible only if previous lesson is completed
        
        // Get previous lesson in same module
        const { data: lessons, error: lessonsError } = await supabase
          .from('lessons')
          .select('id')
          .eq('module_id', lesson.module_id)
          .order('order', { ascending: true });
          
        if (lessonsError) {
          console.error('Error fetching lessons:', lessonsError);
          return false;
        }
        
        // Find the previous lesson based on order
        const currentLessonIndex = lessons.findIndex(l => l.id === lesson.id);
        if (currentLessonIndex <= 0) {
          console.error('Could not find previous lesson or this is the first lesson');
          return false;
        }
        
        const prevLesson = lessons[currentLessonIndex - 1];
        
        // Check if previous lesson is completed
        return isLessonCompleted(prevLesson.id);
      }
    } catch (error) {
      console.error('Error in isLessonAccessible:', error);
      return false;
    }
  };

  const markLessonCompleted = async (courseId: string, moduleId: string, lessonId: string) => {
    if (!user || !isBrowser) return;
    
    try {
      // Check if we already have a progress record for this lesson
      const existingProgress = userProgress.find(
        p => p.lessonId === lessonId && p.userId === user.id
      );
      
      if (existingProgress) {
        // Update existing record
        const { error } = await supabase
          .from('user_progress')
          .update({
            completed: true,
            progress: 100,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingProgress.id);
          
        if (error) {
          console.error('Error updating lesson progress:', error);
          return;
        }
      } else {
        // Create new progress record
        const { error } = await supabase
          .from('user_progress')
          .insert({
            user_id: user.id,
            course_id: courseId,
            module_id: moduleId,
            lesson_id: lessonId,
            completed: true,
            progress: 100,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });
          
        if (error) {
          console.error('Error creating lesson progress:', error);
          return;
        }
      }
      
      // Update local state
      await refreshProgress();
      
    } catch (error) {
      console.error('Error in markLessonCompleted:', error);
    }
  };

  const updateLessonProgress = async (courseId: string, moduleId: string, lessonId: string, progress: number) => {
    if (!user || !isBrowser) return;
    
    try {
      // Check if we already have a progress record for this lesson
      const existingProgress = userProgress.find(
        p => p.lessonId === lessonId && p.userId === user.id
      );
      
      if (existingProgress) {
        // Only update if new progress is higher than existing
        if (progress > existingProgress.progress) {
          const { error } = await supabase
            .from('user_progress')
            .update({
              progress: progress,
              updated_at: new Date().toISOString()
            })
            .eq('id', existingProgress.id);
            
          if (error) {
            console.error('Error updating lesson progress:', error);
            return;
          }
        }
      } else {
        // Create new progress record
        const { error } = await supabase
          .from('user_progress')
          .insert({
            user_id: user.id,
            course_id: courseId,
            module_id: moduleId,
            lesson_id: lessonId,
            completed: false,
            progress: progress,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });
          
        if (error) {
          console.error('Error creating lesson progress:', error);
          return;
        }
      }
      
      // Update local state
      await refreshProgress();
      
    } catch (error) {
      console.error('Error in updateLessonProgress:', error);
    }
  };

  const getCompletedLessonsInModule = (moduleId: string): number => {
    if (!moduleId || userProgress.length === 0) return 0;
    
    return userProgress.filter(
      progress => progress.moduleId === moduleId && progress.completed
    ).length;
  };

  const getTotalLessonsInModule = async (moduleId: string): Promise<number> => {
    if (!moduleId) return 0;
    
    try {
      const { data, error } = await supabase
        .from('lessons')
        .select('id', { count: 'exact' })
        .eq('module_id', moduleId);
        
      if (error) {
        console.error('Error fetching lesson count:', error);
        return 0;
      }
      
      return data.length;
    } catch (error) {
      console.error('Error in getTotalLessonsInModule:', error);
      return 0;
    }
  };

  const getCompletedLessonsInCourse = (courseId: string): number => {
    if (!courseId || userProgress.length === 0) return 0;
    
    return userProgress.filter(
      progress => progress.courseId === courseId && progress.completed
    ).length;
  };

  const getTotalLessonsInCourse = async (courseId: string): Promise<number> => {
    if (!courseId) return 0;
    
    try {
      // First get all modules in this course
      const { data: modules, error: modulesError } = await supabase
        .from('modules')
        .select('id')
        .eq('course_id', courseId);
        
      if (modulesError) {
        console.error('Error fetching modules:', modulesError);
        return 0;
      }
      
      if (modules.length === 0) return 0;
      
      // Get count of all lessons in these modules
      const moduleIds = modules.map(m => m.id);
      const { data, error } = await supabase
        .from('lessons')
        .select('id', { count: 'exact' })
        .in('module_id', moduleIds);
        
      if (error) {
        console.error('Error fetching lesson count:', error);
        return 0;
      }
      
      return data.length;
    } catch (error) {
      console.error('Error in getTotalLessonsInCourse:', error);
      return 0;
    }
  };

  const getNextLesson = async (courseId: string, moduleId: string, lessonId: string) => {
    try {
      // Fetch all lessons in this module
      const { data: lessons, error } = await supabase
        .from('lessons')
        .select('*')
        .eq('module_id', moduleId)
        .order('order', { ascending: true });
        
      if (error) {
        console.error('Error fetching lessons:', error);
        return null;
      }
      
      // Find the current lesson index
      const currentIndex = lessons.findIndex(lesson => lesson.id === lessonId);
      if (currentIndex === -1 || currentIndex === lessons.length - 1) {
        // Current lesson not found or it's the last lesson in this module
        
        // Try to find the next module
        const { data: modules, error: modulesError } = await supabase
          .from('modules')
          .select('*')
          .eq('course_id', courseId)
          .order('order', { ascending: true });
          
        if (modulesError) {
          console.error('Error fetching modules:', modulesError);
          return null;
        }
        
        // Find the current module index
        const currentModuleIndex = modules.findIndex(module => module.id === moduleId);
        if (currentModuleIndex === -1 || currentModuleIndex === modules.length - 1) {
          // Current module not found or it's the last module
          return null;
        }
        
        // Get the next module
        const nextModule = modules[currentModuleIndex + 1];
        
        // Get the first lesson of the next module
        const { data: nextModuleLessons, error: nextModuleLessonsError } = await supabase
          .from('lessons')
          .select('*')
          .eq('module_id', nextModule.id)
          .order('order', { ascending: true })
          .limit(1);
          
        if (nextModuleLessonsError) {
          console.error('Error fetching next module lessons:', nextModuleLessonsError);
          return null;
        }
        
        return nextModuleLessons[0] || null;
      }
      
      // Return the next lesson in this module
      return lessons[currentIndex + 1];
    } catch (error) {
      console.error('Error in getNextLesson:', error);
      return null;
    }
  };

  const getLastAccessedCourse = (): string | null => {
    if (userProgress.length === 0) return null;
    
    // Sort progress by updated_at (most recent first)
    const sortedProgress = [...userProgress].sort((a, b) => {
      if (!a.updated_at || !b.updated_at) return 0;
      return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
    });
    
    // Return the course ID of the most recently updated progress
    return sortedProgress[0]?.courseId || null;
  };

  // Make sure the context provider is properly closed
  return (
    <CourseProgressContext.Provider
      value={{
        userProgress,
        loading,
        isLessonCompleted,
        isLessonAccessible,
        markLessonCompleted,
        updateLessonProgress,
        getCompletedLessonsInModule,
        getTotalLessonsInModule,
        getCompletedLessonsInCourse,
        getTotalLessonsInCourse,
        getNextLesson,
        getLastAccessedCourse,
        refreshProgress
      }}
    >
      {children}
    </CourseProgressContext.Provider>
  );
};

// Export the hook for using the context
export const useCourseProgress = () => {
  const context = useContext(CourseProgressContext);
  if (context === undefined) {
    throw new Error('useCourseProgress must be used within a CourseProgressProvider');
  }
  return context;
};