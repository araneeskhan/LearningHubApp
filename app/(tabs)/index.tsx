import React, { useState, useEffect, useRef } from 'react';
import { 
  StyleSheet, 
  ScrollView, 
  View, 
  Image, 
  TouchableOpacity, 
  TextInput, 
  Animated, 
  Platform,
  Dimensions, 
  FlatList,
  RefreshControl,
  Text
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { HelloWave } from '@/components/HelloWave';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { Colors } from '@/constants/Colors';
import { MotiView } from 'moti';
import { LinearGradient } from 'expo-linear-gradient';
import { useCourseProgress } from '@/context/CourseProgressContext';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';

// Get the window dimensions
const { width, height } = Dimensions.get('window');

function TestScreen() {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text>TEST SCREEN RENDERING</Text>
    </View>
  );
}

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

// Add this after the Course type definition
type CourseCardProps = {
  title: string;
  instructor: string;
  image: string;
  progress?: number;
  isPremium: boolean;
  onPress: () => void;
  delay?: number;
  theme: 'light' | 'dark';
  colors: any;
};

// Add the CourseCard component
const CourseCard = ({ 
  title, 
  instructor, 
  image, 
  progress, 
  isPremium, 
  onPress, 
  delay = 0,
  theme,
  colors
}: CourseCardProps) => {
  return (
    <MotiView
      from={{ opacity: 0, translateY: 20 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: 'spring', damping: 15, delay: 100 + delay }}
      style={styles.courseCardContainer}
    >
      <TouchableOpacity 
        style={[
          styles.courseCard,
          { backgroundColor: theme === 'light' ? '#FFFFFF' : '#2A2D3A' }
        ]}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          onPress();
        }}
        activeOpacity={0.95}
      >
        <Image 
          source={{ uri: image || 'https://via.placeholder.com/150' }} 
          style={styles.courseImage} 
          resizeMode="cover"
        />
        
        {isPremium && (
          <View style={styles.premiumBadge}>
            <LinearGradient
              colors={['#FFD700', '#FFA500']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.premiumGradient}
            >
              <IconSymbol name="star.fill" size={12} color="#FFFFFF" />
            </LinearGradient>
          </View>
        )}
        
        <View style={styles.courseContent}>
          <ThemedText style={styles.courseTitle} numberOfLines={2}>{title}</ThemedText>
          <View style={styles.instructorContainer}>
            <IconSymbol name="person.circle.fill" size={16} color={colors.textSecondary} />
            <ThemedText style={styles.instructorName}>{instructor}</ThemedText>
          </View>
          
          {progress !== undefined && (
            <View style={styles.progressContainer}>
              <View style={styles.progressBar}>
                <LinearGradient
                  colors={[colors.primary, colors.secondary]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={[styles.progressFill, { width: `${progress}%` }]}
                />
              </View>
              <ThemedText style={styles.progressText}>{progress}%</ThemedText>
            </View>
          )}
        </View>
      </TouchableOpacity>
    </MotiView>
  );
};

// Main HomeScreen component - this is the default export
export default function HomeScreen() {
  const { theme } = useTheme();
  const { user } = useAuth();
  const colors = Colors[theme];
  const router = useRouter();
  const { 
    getCompletedLessonsInCourse, 
    getTotalLessonsInCourse,
    getLastAccessedCourse
  } = useCourseProgress();

  const [courses, setCourses] = useState<Course[]>([]);
  const [filteredCourses, setFilteredCourses] = useState<Course[]>([]);
  const [popularCourses, setPopularCourses] = useState<Course[]>([]);
  const [inProgressCourses, setInProgressCourses] = useState<Course[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const scrollY = useRef(new Animated.Value(0)).current;
  const headerHeight = scrollY.interpolate({
    inputRange: [0, 120],
    outputRange: [height * 0.22, height * 0.12],
    extrapolate: 'clamp',
  });

  useEffect(() => {
    fetchCourses();
  }, []);

  useEffect(() => {
    if (courses.length > 0) {
      filterCourses();
    }
  }, [searchQuery, selectedCategory, courses]);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching courses:', error);
        return;
      }

      setCourses(data || []);
      
      // Extract unique categories from course tags
      const allTags = data?.flatMap(course => course.tags || []) || [];
      const uniqueCategories = [...new Set(allTags)];
      setCategories(uniqueCategories);

      // Set popular courses (for demo, just using the first 5)
      setPopularCourses(data?.slice(0, 5) || []);
      
      // Set in-progress courses (courses with progress > 0%)
      const coursesInProgress = data?.filter(course => {
        const completedLessons = getCompletedLessonsInCourse(course.id);
        const totalLessons = getTotalLessonsInCourse(course.id);
        return completedLessons > 0 && completedLessons < totalLessons;
      }) || [];
      
      setInProgressCourses(coursesInProgress);
      
    } catch (error) {
      console.error('Error in fetchCourses:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // First, let's update the renderSearchBar function to improve visibility and styling
  const renderSearchBar = () => (
    <MotiView
      from={{ opacity: 0, translateY: 20 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: 'spring', damping: 18, delay: 100 }}
      style={[styles.searchContainer, { marginTop: 20 }]} // Added marginTop for better visibility
    >
      <View style={[
        styles.searchBar, 
        { 
          backgroundColor: colors.surface,
          borderColor: isSearchFocused ? colors.primary : 'transparent',
          borderWidth: isSearchFocused ? 1 : 0,
          borderRadius: 20, // Increased border radius for more rounded appearance
        }
      ]}>
        <IconSymbol 
          name="magnifyingglass" 
          size={20} 
          color={isSearchFocused ? colors.primary : colors.textSecondary} 
        />
        <TextInput
          style={[styles.searchInput, { color: colors.text }]}
          placeholder="What do you want to learn today?"
          placeholderTextColor={colors.textSecondary}
          value={searchQuery}
          onChangeText={setSearchQuery}
          onFocus={() => setIsSearchFocused(true)}
          onBlur={() => setIsSearchFocused(false)}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <IconSymbol name="xmark.circle.fill" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        )}
      </View>
    </MotiView>
  );

  const renderCategories = () => (
    <MotiView
      from={{ opacity: 0, translateY: 20 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: 'spring', damping: 18, delay: 200 }}
      style={styles.categoriesSection}
    >
      <View style={styles.sectionHeader}>
        <ThemedText style={styles.sectionTitle}>Categories</ThemedText>
        {selectedCategory && (
          <TouchableOpacity onPress={() => setSelectedCategory(null)}>
            <ThemedText style={{ color: colors.primary, fontWeight: '600' }}>Clear</ThemedText>
          </TouchableOpacity>
        )}
      </View>
      
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false} 
        contentContainerStyle={styles.categoriesContainer}
      >
        {categories.map((category, index) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.categoryChip,
              { 
                backgroundColor: selectedCategory === category 
                  ? colors.primary 
                  : theme === 'light' ? '#F0F4FF' : '#2A2D3A',
              }
            ]}
            onPress={() => handleCategoryPress(category)}
          >
            <ThemedText 
              style={[
                styles.categoryText, 
                { 
                  color: selectedCategory === category 
                    ? '#FFFFFF' 
                    : colors.text 
                }
              ]}
            >
              {category}
            </ThemedText>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </MotiView>
  );

  const renderContinueLearning = () => {
    if (inProgressCourses.length === 0) return null;
    
    return (
      <MotiView
        from={{ opacity: 0, translateY: 20 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: 'timing', duration: 500, delay: 300 }}
        style={styles.section}
      >
        <View style={styles.sectionHeader}>
          <ThemedText type="subtitle">Continue Learning</ThemedText>
          <TouchableOpacity onPress={() => router.push('/(tabs)/courses')}>
            <ThemedText style={{ color: colors.primary }}>See All</ThemedText>
          </TouchableOpacity>
        </View>
        
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false} 
          contentContainerStyle={styles.coursesContainer}
        >
          {inProgressCourses.map((course, index) => {
            const completedLessons = getCompletedLessonsInCourse(course.id);
            const totalLessons = getTotalLessonsInCourse(course.id);
            const progress = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;
            
            return (
              <CourseCard 
                key={course.id}
                title={course.title}
                progress={progress}
                instructor={course.instructor}
                image={course.image_url}
                isPremium={course.is_premium}
                onPress={() => handleCoursePress(course.id)}
                delay={index * 100}
                theme={theme}
                colors={colors}
              />
            );
          })}
        </ScrollView>
      </MotiView>
    );
  };

  const renderPopularCourses = () => (
    <MotiView
      from={{ opacity: 0, translateY: 20 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: 'timing', duration: 500, delay: 400 }}
      style={styles.section}
    >
      <View style={styles.sectionHeader}>
        <ThemedText type="subtitle">Popular Courses</ThemedText>
        <TouchableOpacity onPress={() => router.push('/(tabs)/courses')}>
          <ThemedText style={{ color: colors.primary }}>See All</ThemedText>
        </TouchableOpacity>
      </View>
      
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false} 
        contentContainerStyle={styles.coursesContainer}
      >
        {popularCourses.map((course, index) => (
          <CourseCard 
            key={course.id}
            title={course.title}
            instructor={course.instructor}
            image={course.image_url}
            isPremium={course.is_premium}
            onPress={() => handleCoursePress(course.id)}
            delay={index * 100}
            theme={theme}
            colors={colors}
          />
        ))}
      </ScrollView>
    </MotiView>
  );

  const renderSearchResults = () => {
    if (!searchQuery) return null;
    
    return (
      <MotiView
        from={{ opacity: 0, translateY: 20 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: 'timing', duration: 300 }}
        style={styles.searchResultsContainer}
        >
        <ThemedText type="subtitle" style={styles.resultsTitle}>
          Search Results ({filteredCourses.length})
        </ThemedText>
        
        {filteredCourses.length === 0 ? (
          <View style={styles.noResultsContainer}>
            <IconSymbol name="magnifyingglass" size={50} color={colors.textSecondary} />
            <ThemedText style={styles.noResultsText}>
              No courses found for "{searchQuery}"
            </ThemedText>
          </View>
        ) : (
          <FlatList
            data={filteredCourses}
            keyExtractor={(item) => item.id}
            renderItem={({ item, index }) => (
              <MotiView
                from={{ opacity: 0, translateX: 20 }}
                animate={{ opacity: 1, translateX: 0 }}
                transition={{ type: 'timing', duration: 300, delay: index * 100 }}
              >
                <TouchableOpacity 
                  style={[styles.searchResultItem, { backgroundColor: colors.surface }]}
                  onPress={() => handleCoursePress(item.id)}
                >
                  <Image 
                    source={{ uri: item.image_url || 'https://via.placeholder.com/60' }} 
                    style={styles.searchResultImage} 
                  />
                  <View style={styles.searchResultContent}>
                    <ThemedText style={styles.searchResultTitle}>{item.title}</ThemedText>
                    <ThemedText style={styles.searchResultInstructor}>{item.instructor}</ThemedText>
                    <View style={styles.searchResultMeta}>
                      <View style={styles.metaItem}>
                        <IconSymbol name="clock.fill" size={12} color={colors.textSecondary} />
                        <ThemedText style={styles.metaText}>{item.duration}h</ThemedText>
                      </View>
                      <View style={styles.metaItem}>
                        <IconSymbol name="chart.bar.fill" size={12} color={colors.textSecondary} />
                        <ThemedText style={styles.metaText}>{item.level}</ThemedText>
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>
              </MotiView>
            )}
          />
        )}
      </MotiView>
    );
  };

  // Now let's fix the filterCourses function to handle undefined tags
  const filterCourses = () => {
    let filtered = [...courses];
    
    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(course => 
        course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        course.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        // Fix for "Cannot read property 'some' of undefined" error
        (course.tags && course.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase())))
      );
    }
    
    // Apply category filter
    if (selectedCategory) {
      filtered = filtered.filter(course => 
        // Fix for undefined tags
        course.tags && course.tags.includes(selectedCategory)
      );
    }
    
    setFilteredCourses(filtered);
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchCourses();
  };

  const handleCoursePress = (courseId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push(`/course/${courseId}`);
  };

  const handleCategoryPress = (category: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedCategory(selectedCategory === category ? null : category);
  };

  const renderHeader = () => (
    <Animated.View style={[styles.headerContainer, { height: headerHeight }]}>
      <LinearGradient
        colors={theme === 'light' 
          ? ['#4F6EF7', '#5A7BFF'] 
          : ['#2A2D3A', '#1F2232']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.headerGradient}
      >
        <View style={styles.welcomeContainer}>
          <View>
            <ThemedText style={styles.welcomeText}>
              Hello, {user?.name?.split(' ')[0] || user?.email?.split('@')[0] || 'Learner'}
            </ThemedText>
            <ThemedText style={styles.subtitle}>
              What would you like to learn today?
            </ThemedText>
          </View>
          <HelloWave size={40} />
        </View>
      </LinearGradient>
    </Animated.View>
  );

  // Fix the return statement in your HomeScreen component
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      {renderHeader()}
      
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        scrollEventThrottle={16}
      >
        {renderSearchBar()}
        {renderCategories()}
        {searchQuery ? renderSearchResults() : (
          <>
            {renderContinueLearning()}
            {renderPopularCourses()}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingBottom: 100,
  },
  contentContainer: {
    padding: 0,
  },
  headerContainer: {
    width: '100%',
    overflow: 'hidden',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerGradient: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'flex-end',
    paddingBottom: 30,
  },
  welcomeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 20,
  },
  welcomeText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '500',
  },
  searchContainer: {
    marginHorizontal: 24,
    marginTop: -25,
    marginBottom: 24,
    borderRadius: 16,
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    fontWeight: '500',
  },
  categoriesSection: {
    marginTop: 16,
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  seeAllText: {
    fontSize: 14,
    fontWeight: '600',
  },
  categoriesContainer: {
    paddingVertical: 8,
    paddingLeft: 24,
  },
  categoryChip: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
    marginRight: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  categoryText: {
    fontSize: 15,
    fontWeight: '600',
  },
  section: {
    marginBottom: 32,
  },
  coursesContainer: {
    paddingVertical: 8,
    paddingLeft: 24,
  },
  courseCardContainer: {
    width: width * 0.75,
    height: 280,
    marginRight: 20,
    borderRadius: 24,
    overflow: 'hidden',
  },
  courseCard: {
    flex: 1,
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 10,
  },
  cardGradient: {
    flex: 1,
    borderRadius: 24,
    overflow: 'hidden',
  },
  courseImage: {
    width: '100%',
    height: 180,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  courseContent: {
    padding: 16,
  },
  courseTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
  },
  instructorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  instructorName: {
    fontSize: 14,
    marginLeft: 6,
    fontWeight: '500',
    opacity: 0.8,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  progressBar: {
    flex: 1,
    height: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    borderRadius: 2,
    marginRight: 8,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  progressText: {
    fontSize: 12,
    fontWeight: '600',
  },
  premiumBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    borderRadius: 20,
    overflow: 'hidden',
  },
  premiumGradient: {
    padding: 8,
  },
  premiumText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  searchResultsContainer: {
    marginTop: 16,
    paddingHorizontal: 24,
  },
  resultsTitle: {
    marginBottom: 16,
  },
  noResultsContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  noResultsText: {
    marginTop: 16,
    textAlign: 'center',
    opacity: 0.7,
  },
  searchResultItem: {
    flexDirection: 'row',
    borderRadius: 16,
    marginBottom: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  searchResultImage: {
    width: 80,
    height: 80,
    borderRadius: 12,
  },
  searchResultContent: {
    flex: 1,
    marginLeft: 16,
    justifyContent: 'space-between',
  },
  searchResultTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  searchResultInstructor: {
    fontSize: 14,
    opacity: 0.7,
    marginTop: 4,
  },
  searchResultMeta: {
    flexDirection: 'row',
    marginTop: 8,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  metaText: {
    fontSize: 12,
    marginLeft: 4,
    opacity: 0.7,
  },
});