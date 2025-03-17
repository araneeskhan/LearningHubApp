import React, { useEffect, useState } from 'react';
import { StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity, View, Alert } from 'react-native';
import { useLocalSearchParams, router, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { supabase } from '@/lib/supabase';
import { useCourseProgress } from '@/context/CourseProgressContext';
import { Colors } from '@/constants/Colors';
import { useTheme } from '@/context/ThemeContext';
import { showToast } from '@/components/Toast';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Button } from '@/components/ui/Button';

type Quiz = {
  id: string;
  title: string;
  description: string;
  passing_score: number;
  questions: {
    id: string;
    question: string;
    options: string[];
    correct_option_index: number;
  }[];
};

export default function QuizScreen() {
  const { id, moduleId, courseId } = useLocalSearchParams();
  const { theme } = useTheme();
  const colors = Colors[theme];
  const { markLessonCompleted, isLessonCompleted } = useCourseProgress();
  
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOptions, setSelectedOptions] = useState<number[]>([]);
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [passed, setPassed] = useState(false);
  const [completed, setCompleted] = useState(false);

  useEffect(() => {
    if (id) {
      fetchQuizDetails();
      setCompleted(isLessonCompleted(id.toString()));
    }
  }, [id]);

  const fetchQuizDetails = async () => {
    if (!id) return;
    
    setLoading(true);
    try {
      // Fetch lesson with quiz
      const { data: lessonData, error: lessonError } = await supabase
        .from('lessons')
        .select('*')
        .eq('id', id)
        .single();

      if (lessonError) {
        console.error('Error fetching lesson:', lessonError);
        showToast.error('Failed to load quiz');
        return;
      }

      if (!lessonData.quiz) {
        showToast.error('No quiz found for this lesson');
        router.back();
        return;
      }

      // Initialize selected options array
      const initialSelectedOptions = Array(lessonData.quiz.questions.length).fill(-1);
      setSelectedOptions(initialSelectedOptions);
      setQuiz(lessonData.quiz);
    } catch (error) {
      console.error('Error in fetchQuizDetails:', error);
      showToast.error('Failed to load quiz');
    } finally {
      setLoading(false);
    }
  };

  const handleOptionSelect = (optionIndex: number) => {
    const newSelectedOptions = [...selectedOptions];
    newSelectedOptions[currentQuestionIndex] = optionIndex;
    setSelectedOptions(newSelectedOptions);
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < (quiz?.questions.length || 0) - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const calculateScore = () => {
    if (!quiz) return 0;
    
    let correctAnswers = 0;
    quiz.questions.forEach((question, index) => {
      if (selectedOptions[index] === question.correct_option_index) {
        correctAnswers++;
      }
    });
    
    return Math.round((correctAnswers / quiz.questions.length) * 100);
  };

  const handleSubmitQuiz = async () => {
    if (!quiz || !courseId || !moduleId || !id) return;
    
    // Check if all questions are answered
    const unansweredQuestions = selectedOptions.filter(option => option === -1).length;
    if (unansweredQuestions > 0) {
      Alert.alert(
        'Incomplete Quiz',
        `You have ${unansweredQuestions} unanswered question(s). Do you want to submit anyway?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Submit', onPress: submitQuiz }
        ]
      );
    } else {
      submitQuiz();
    }
  };

  const submitQuiz = async () => {
    if (!quiz || !courseId || !moduleId || !id) return;
    
    const calculatedScore = calculateScore();
    setScore(calculatedScore);
    
    const hasPassed = calculatedScore >= quiz.passing_score;
    setPassed(hasPassed);
    setQuizSubmitted(true);
    
    if (hasPassed) {
      try {
        await markLessonCompleted(courseId.toString(), moduleId.toString(), id.toString());
        setCompleted(true);
      } catch (error) {
        console.error('Error marking lesson as completed:', error);
      }
    }
    
    // Save quiz attempt to database
    try {
      await supabase.from('quiz_attempts').insert([
        {
          user_id: (await supabase.auth.getUser()).data.user?.id,
          lesson_id: id,
          score: calculatedScore,
          passed: hasPassed,
          answers: selectedOptions,
          created_at: new Date()
        }
      ]);
    } catch (error) {
      console.error('Error saving quiz attempt:', error);
    }
  };

  const handleRetakeQuiz = () => {
    setQuizSubmitted(false);
    setCurrentQuestionIndex(0);
    setSelectedOptions(Array(quiz?.questions.length || 0).fill(-1));
  };

  const handleContinue = () => {
    router.back();
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </SafeAreaView>
    );
  }

  if (!quiz) {
    return (
      <SafeAreaView style={styles.errorContainer}>
        <ThemedText type="title">Quiz not found</ThemedText>
        <TouchableOpacity onPress={() => router.back()}>
          <ThemedText type="link">Go back</ThemedText>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  if (quizSubmitted) {
    return (
      <SafeAreaView style={styles.container}>
        <Stack.Screen options={{ title: 'Quiz Results' }} />
        
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <ThemedView style={styles.resultsContainer}>
            <View style={styles.scoreCircle}>
              <ThemedText type="largeTitle" style={styles.scoreText}>{score}%</ThemedText>
            </View>
            
            <ThemedText type="title" style={styles.resultTitle}>
              {passed ? 'Congratulations!' : 'Try Again'}
            </ThemedText>
            
            <ThemedText style={styles.resultMessage}>
              {passed 
                ? 'You have successfully passed the quiz!' 
                : `You didn't reach the passing score of ${quiz.passing_score}%. Review the material and try again.`}
            </ThemedText>
            
            <View style={styles.resultStats}>
              <View style={styles.statItem}>
                <ThemedText style={styles.statLabel}>Passing Score</ThemedText>
                <ThemedText type="subtitle" style={styles.statValue}>{quiz.passing_score}%</ThemedText>
              </View>
              
              <View style={styles.statItem}>
                <ThemedText style={styles.statLabel}>Your Score</ThemedText>
                <ThemedText 
                  type="subtitle" 
                  style={[styles.statValue, { color: passed ? colors.success : colors.error }]}
                >
                  {score}%
                </ThemedText>
              </View>
              
              <View style={styles.statItem}>
                <ThemedText style={styles.statLabel}>Status</ThemedText>
                <View style={[
                  styles.statusBadge, 
                  { backgroundColor: passed ? colors.success + '20' : colors.error + '20' }
                ]}>
                  <ThemedText style={[
                    styles.statusText, 
                    { color: passed ? colors.success : colors.error }
                  ]}>
                    {passed ? 'PASSED' : 'FAILED'}
                  </ThemedText>
                </View>
              </View>
            </View>
            
            <View style={styles.resultActions}>
              {!passed && (
                <TouchableOpacity 
                  style={[styles.retakeButton, { backgroundColor: colors.surface }]}
                  onPress={handleRetakeQuiz}
                >
                  <IconSymbol name="arrow.counterclockwise" size={20} color={colors.text} />
                  <ThemedText style={styles.retakeButtonText}>Retake Quiz</ThemedText>
                </TouchableOpacity>
              )}
              
              <TouchableOpacity 
                style={[styles.continueButton, { backgroundColor: colors.primary }]}
                onPress={handleContinue}
              >
                <ThemedText style={styles.continueButtonText}>Continue</ThemedText>
                <IconSymbol name="arrow.right" size={20} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </ThemedView>
        </ScrollView>
      </SafeAreaView>
    );
  }

  const currentQuestion = quiz.questions[currentQuestionIndex];

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ title: quiz.title }} />
      
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <ThemedView style={styles.quizHeader}>
          <ThemedText type="title">{quiz.title}</ThemedText>
          {quiz.description && (
            <ThemedText style={styles.quizDescription}>{quiz.description}</ThemedText>
          )}
          
          <View style={styles.progressContainer}>
            <ThemedText style={styles.progressText}>
              Question {currentQuestionIndex + 1} of {quiz.questions.length}
            </ThemedText>
            <View style={[styles.progressBar, { backgroundColor: colors.border }]}>
              <View 
                style={[
                  styles.progressFill, 
                  { 
                    backgroundColor: colors.primary,
                    width: `${((currentQuestionIndex + 1) / quiz.questions.length) * 100}%` 
                  }
                ]} 
              />
            </View>
          </View>
        </ThemedView>
        
        <ThemedView style={styles.questionContainer}>
          <ThemedText type="subtitle" style={styles.questionText}>
            {currentQuestion.question}
          </ThemedText>
          
          <View style={styles.optionsContainer}>
            {currentQuestion.options.map((option, index) => (
              <TouchableOpacity 
                key={index}
                style={[
                  styles.optionItem,
                  selectedOptions[currentQuestionIndex] === index && {
                    backgroundColor: colors.primary + '20',
                    borderColor: colors.primary
                  }
                ]}
                onPress={() => handleOptionSelect(index)}
              >
                <View style={[
                  styles.optionIndicator,
                  selectedOptions[currentQuestionIndex] === index && {
                    backgroundColor: colors.primary,
                    borderColor: colors.primary
                  }
                ]}>
                  {selectedOptions[currentQuestionIndex] === index && (
                    <IconSymbol name="checkmark" size={16} color="#FFFFFF" />
                  )}
                </View>
                <ThemedText style={styles.optionText}>{option}</ThemedText>
              </TouchableOpacity>
            ))}
          </View>
        </ThemedView>
      </ScrollView>
      
      <ThemedView style={styles.navigationFooter}>
        <View style={styles.navigationButtons}>
          <TouchableOpacity 
            style={[
              styles.navButton, 
              { backgroundColor: colors.surface },
              currentQuestionIndex === 0 && styles.disabledButton
            ]}
            onPress={handlePreviousQuestion}
            disabled={currentQuestionIndex === 0}
          >
            <IconSymbol name="chevron.left" size={20} color={colors.text} />
            <ThemedText style={styles.navButtonText}>Previous</ThemedText>
          </TouchableOpacity>
          
          {currentQuestionIndex < quiz.questions.length - 1 ? (
            <TouchableOpacity 
              style={[styles.navButton, { backgroundColor: colors.surface }]}
              onPress={handleNextQuestion}
            >
              <ThemedText style={styles.navButtonText}>Next</ThemedText>
              <IconSymbol name="chevron.right" size={20} color={colors.text} />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity 
              style={[styles.submitButton, { backgroundColor: colors.primary }]}
              onPress={handleSubmitQuiz}
            >
              <ThemedText style={styles.submitButtonText}>Submit Quiz</ThemedText>
            </TouchableOpacity>
          )}
        </View>
      </ThemedView>
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
  scrollContent: {
    padding: 16,
    paddingBottom: 80,
  },
  quizHeader: {
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  quizDescription: {
    marginTop: 8,
    marginBottom: 16,
    opacity: 0.7,
  },
  progressContainer: {
    marginTop: 16,
  },
  progressText: {
    fontSize: 14,
    marginBottom: 8,
  },
  progressBar: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  questionContainer: {
    padding: 16,
    borderRadius: 8,
  },
  questionText: {
    marginBottom: 16,
  },
  optionsContainer: {
    marginTop: 8,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
    borderRadius: 8,
    marginBottom: 12,
  },
  optionIndicator: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'rgba(0, 0, 0, 0.3)',
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  optionText: {
    flex: 1,
  },
  navigationFooter: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.1)',
  },
  navigationButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  navButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  navButtonText: {
    marginHorizontal: 4,
  },
  disabledButton: {
    opacity: 0.5,
  },
  submitButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  submitButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  resultsContainer: {
    padding: 24,
    borderRadius: 8,
  },
  scoreCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    marginBottom: 24,
  },
  scoreText: {
    fontWeight: 'bold',
  },
  resultTitle: {
    marginBottom: 8,
    textAlign: 'center',
  },
  resultMessage: {
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  resultStats: {
    marginBottom: 24,
  },
  statItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.05)',
  },
  statLabel: {
    opacity: 0.7,
  },
  statValue: {
    fontWeight: 'bold',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  resultActions: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    marginTop: 16,
  },
  retakeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  retakeButtonText: {
    marginLeft: 8,
    fontWeight: 'bold',
  },
  continueButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  continueButtonText: {
    color: 'white',
    fontWeight: 'bold',
    marginRight: 8,
  },
});