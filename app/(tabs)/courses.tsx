import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  View, 
  FlatList, 
  TouchableOpacity, 
  TextInput,
  ActivityIndicator,
  Image,
  Dimensions,
  RefreshControl
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MotiView } from 'moti';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { ScrollView } from 'react-native-gesture-handler';
import { ThemedText } from '@/components/ThemedText';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { useTheme } from '@/context/ThemeContext';
import { useCourseProgress } from '@/context/CourseProgressContext';
import { supabase } from '@/lib/supabase';
import { Colors } from '@/constants/Colors';
import { Course } from '@/types';

const { width } = Dimensions.get('window');

export default function CoursesScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const colors = Colors[theme];
  const { getCompletedLessonsInCourse, getTotalLessonsInCourse } = useCourseProgress();
  
  const [courses, setCourses] = useState<Course[]>([]);
  const [filteredCourses, setFilteredCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');

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
      
      const allTags = data?.flatMap(course => course.tags || []) || [];
      const uniqueCategories = [...new Set(allTags)];
      setCategories(uniqueCategories);
      
    } catch (error) {
      console.error('Error in fetchCourses:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const filterCourses = () => {
    let filtered = [...courses];
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        course => 
          course.title.toLowerCase().includes(query) || 
          course.description?.toLowerCase().includes(query) ||
          course.instructor?.toLowerCase().includes(query) ||
          course.tags?.some(tag => tag.toLowerCase().includes(query))
      );
    }
    
    if (selectedCategory) {
      filtered = filtered.filter(
        course => course.tags?.includes(selectedCategory)
      );
    }
    
    setFilteredCourses(filtered);
  };

  const onRefresh = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setRefreshing(true);
    await fetchCourses();
    setRefreshing(false);
  };

  const handleCategoryPress = (category: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedCategory(selectedCategory === category ? null : category);
  };

  const renderHeader = () => (
    <MotiView
      from={{ opacity: 0, translateY: -20 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: 'spring', damping: 18 }}
      style={styles.header}
    >
      <ThemedText style={styles.headerTitle}>Explore Courses</ThemedText>
      <ThemedText style={styles.headerSubtitle}>
        {selectedCategory ? `Filtered by: ${selectedCategory}` : 'Find your next learning adventure'}
      </ThemedText>
    </MotiView>
  );

  const renderSearchBar = () => (
    <MotiView
      from={{ opacity: 0, translateY: 20 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: 'spring', damping: 18, delay: 100 }}
      style={styles.searchContainer}
    >
      <View style={[ 
        styles.searchBar, 
        { 
          backgroundColor: colors.surface,
          borderColor: isSearchFocused ? colors.primary : 'transparent',
          borderWidth: isSearchFocused ? 1 : 0,
        }
      ]}>
        <IconSymbol 
          name="magnifyingglass" 
          size={20} 
          color={isSearchFocused ? colors.primary : colors.textSecondary} 
        />
        <TextInput
          style={[styles.searchInput, { color: colors.text }]}
          placeholder="Search courses..."
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
      style={styles.categoriesContainer}
    >
      <View style={styles.categoriesHeader}>
        <ThemedText style={styles.categoriesTitle}>Categories</ThemedText>
        <View style={styles.viewToggle}>
          <TouchableOpacity 
            style={[ 
              styles.viewToggleButton, 
              viewMode === 'grid' && { backgroundColor: colors.primary }
            ]}
            onPress={() => setViewMode('grid')}
          >
            <IconSymbol 
              name="square.grid.2x2" 
              size={18} 
              color={viewMode === 'grid' ? '#FFFFFF' : colors.textSecondary} 
            />
          </TouchableOpacity>
          <TouchableOpacity 
            style={[ 
              styles.viewToggleButton, 
              viewMode === 'list' && { backgroundColor: colors.primary }
            ]}
            onPress={() => setViewMode('list')}
          >
            <IconSymbol 
              name="list.bullet" 
              size={18} 
              color={viewMode === 'list' ? '#FFFFFF' : colors.textSecondary} 
            />
          </TouchableOpacity>
        </View>
      </View>
      
      <ScrollView 
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categoriesContent}
      >
        <TouchableOpacity 
          style={[ 
            styles.categoryChip, 
            { backgroundColor: selectedCategory === null 
                ? colors.primary 
                : theme === 'light' ? '#F0F4FF' : '#2A2D3A' }
          ]}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setSelectedCategory(null);
          }}
        >
          <ThemedText 
            style={[ 
              styles.categoryText, 
              { color: selectedCategory === null ? '#FFFFFF' : colors.text } 
            ]}
          >
            All Courses
          </ThemedText>
        </TouchableOpacity>
        
        {categories.map((category, index) => (
          <TouchableOpacity 
            key={`category-${index}`}
            style={[ 
              styles.categoryChip, 
              { backgroundColor: selectedCategory === category 
                  ? colors.primary 
                  : theme === 'light' ? '#F0F4FF' : '#2A2D3A' }
            ]}
            onPress={() => handleCategoryPress(category)}
          >
            <ThemedText 
              style={[ 
                styles.categoryText, 
                { color: selectedCategory === category ? '#FFFFFF' : colors.text } 
              ]}
            >
              {category}
            </ThemedText>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </MotiView>
  );

  const renderCourseCard = ({ item }: { item: Course }) => {
    const completedLessons = getCompletedLessonsInCourse(item.id);
    const totalLessons = getTotalLessonsInCourse(item.id);
    const progress = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

    return (
      <TouchableOpacity 
        style={[styles.courseCard, { backgroundColor: colors.surface }]}
        onPress={() => router.push(`/course/${item.id}`)}
      >
        <Image 
          source={{ uri: item.image_url || 'https://via.placeholder.com/300x150' }}
          style={styles.courseImage}
          resizeMode="cover"
        />
        <View style={styles.courseInfo}>
          <ThemedText style={styles.courseTitle} numberOfLines={2}>
            {item.title}
          </ThemedText>
          <ThemedText style={styles.instructorName} numberOfLines={1}>
            {item.instructor}
          </ThemedText>
          <View style={styles.progressContainer}>
            <View style={[styles.progressBar, { backgroundColor: colors.border }]}>
              <View 
                style={[
                  styles.progressFill, 
                  { 
                    backgroundColor: colors.primary,
                    width: `${progress}%` 
                  }
                ]} 
              />
            </View>
            <ThemedText style={styles.progressText}>
              {progress}% Complete
            </ThemedText>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      padding: 20,
    },
    headerTitle: {
      fontSize: 24,
      fontWeight: 'bold',
      color: colors.text,
    },
    headerSubtitle: {
      fontSize: 16,
      color: colors.textSecondary,
    },
    searchContainer: {
      paddingHorizontal: 20,
      paddingTop: 10,
    },
    searchBar: {
      flexDirection: 'row',
      alignItems: 'center',
      borderRadius: 8,
      paddingHorizontal: 15,
      height: 50,
    },
    searchInput: {
      flex: 1,
      fontSize: 16,
      paddingVertical: 0,
      marginLeft: 10,
      color: colors.text,
    },
    categoriesContainer: {
      paddingHorizontal: 20,
      paddingTop: 20,
    },
    categoriesHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    categoriesTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: colors.text,
    },
    viewToggle: {
      flexDirection: 'row',
    },
    viewToggleButton: {
      marginLeft: 10,
      padding: 10,
      borderRadius: 50,
      backgroundColor: colors.surface,
    },
    categoriesContent: {
      paddingVertical: 15,
    },
    categoryChip: {
      paddingVertical: 8,
      paddingHorizontal: 15,
      borderRadius: 16,
      marginRight: 10,
      justifyContent: 'center',
      alignItems: 'center',
    },
    categoryText: {
      fontSize: 14,
      color: colors.text,
    },
    courseCard: {
      borderRadius: 12,
      overflow: 'hidden',
      marginBottom: 16,
      elevation: 2,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
    },
    courseImage: {
      width: '100%',
      height: 150,
    },
    courseInfo: {
      padding: 16,
    },
    courseTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: colors.text,
      marginBottom: 4,
    },
    instructorName: {
      fontSize: 14,
      color: colors.textSecondary,
      marginBottom: 12,
    },
    progressContainer: {
      marginTop: 8,
    },
    progressBar: {
      height: 4,
      borderRadius: 2,
      overflow: 'hidden',
      marginBottom: 4,
    },
    progressFill: {
      height: '100%',
      borderRadius: 2,
    },
    progressText: {
      fontSize: 12,
      color: colors.textSecondary,
    },
  });

  return (
    <SafeAreaView style={styles.container}>
      {loading ? (
        <ActivityIndicator size="large" color={colors.primary} />
      ) : (
        <FlatList
          data={filteredCourses}
          keyExtractor={(item) => item.id}
          renderItem={renderCourseCard}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListHeaderComponent={() => (
            <>
              {renderHeader()}
              {renderSearchBar()}
              {renderCategories()}
            </>
          )}
        />
      )}
    </SafeAreaView>
  );
}
