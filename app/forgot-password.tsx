import React, { useState } from 'react';
import { StyleSheet, View, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router'; // Change to useRouter
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/ThemedText';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { Colors } from '@/constants/Colors';
import { showToast } from '@/components/Toast';

export default function ForgotPasswordScreen() {
  const { theme } = useTheme();
  const { resetPassword } = useAuth();
  const router = useRouter(); // Use the hook
  const colors = Colors[theme];
  
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [error, setError] = useState('');

  const validateEmail = () => {
    if (!email) {
      setError('Email is required');
      return false;
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      setError('Email is invalid');
      return false;
    }
    setError('');
    return true;
  };

  const handleResetPassword = async () => {
    if (!validateEmail()) return;

    setLoading(true);
    try {
      const { error } = await resetPassword(email);
      
      if (error) {
        showToast.error('Password reset failed', error.message);
        setError(error.message);
      } else {
        setEmailSent(true);
        showToast.success('Password reset email sent', 'Please check your inbox');
      }
    } catch (error) {
      showToast.error('An unexpected error occurred');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={theme === 'dark' ? 'light' : 'dark'} />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}
      >
        <View style={styles.content}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <IconSymbol 
              name="chevron.left" 
              size={24} 
              color={colors.text} 
            />
          </TouchableOpacity>
          
          <View style={styles.headerContainer}>
            <ThemedText type="title">Reset Password</ThemedText>
            <ThemedText style={styles.subtitle}>
              {emailSent 
                ? 'Check your email for a reset link' 
                : 'Enter your email to receive a password reset link'}
            </ThemedText>
          </View>
          
          {!emailSent ? (
            <View style={styles.formContainer}>
              <Input
                label="Email"
                placeholder="Enter your email"
                value={email}
                onChangeText={(text) => {
                  setEmail(text);
                  if (error) setError('');
                }}
                keyboardType="email-address"
                autoCapitalize="none"
                leftIcon="envelope.fill"
                error={error}
              />
              
              <Button
                title="Send Reset Link"
                onPress={handleResetPassword}
                loading={loading}
                fullWidth
                size="large"
                style={styles.resetButton}
              />
            </View>
          ) : (
            <View style={styles.successContainer}>
              <View style={[styles.iconContainer, { backgroundColor: colors.success + '20' }]}>
                <IconSymbol name="checkmark.circle.fill" size={48} color={colors.success} />
              </View>
              
              <ThemedText style={styles.successText}>
                We've sent a password reset link to {email}
              </ThemedText>
              
              <Button
                title="Back to Login"
                onPress={() => router.replace('/login')}
                variant="outline"
                fullWidth
                size="medium"
                style={styles.backToLoginButton}
              />
              
              <TouchableOpacity 
                onPress={handleResetPassword}
                disabled={loading}
              >
                <ThemedText style={[styles.resendLink, { color: colors.primary }]}>
                  {loading ? 'Sending...' : 'Resend email'}
                </ThemedText>
              </TouchableOpacity>
            </View>
          )}
          
          <View style={styles.footerContainer}>
            <ThemedText>Remember your password? </ThemedText>
            <TouchableOpacity onPress={() => router.push('/login')}>
              <ThemedText style={{ color: colors.primary, fontWeight: '600' }}>
                Sign In
              </ThemedText>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 24,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerContainer: {
    marginBottom: 32,
  },
  subtitle: {
    fontSize: 16,
    marginTop: 8,
  },
  formContainer: {
    width: '100%',
    marginBottom: 24,
  },
  resetButton: {
    marginTop: 16,
  },
  successContainer: {
    alignItems: 'center',
    marginVertical: 32,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  successText: {
    textAlign: 'center',
    fontSize: 16,
    marginBottom: 32,
  },
  backToLoginButton: {
    marginBottom: 16,
  },
  resendLink: {
    fontSize: 14,
    fontWeight: '500',
    marginTop: 16,
  },
  footerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 'auto',
    paddingVertical: 16,
  },
});