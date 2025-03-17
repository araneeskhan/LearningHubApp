import React from 'react';
import { StyleSheet, View } from 'react-native';
import Toast, { BaseToast, ErrorToast, ToastConfig } from 'react-native-toast-message';
import { Colors } from '@/constants/Colors';
import { useTheme } from '@/context/ThemeContext';
import { Platform } from 'react-native';

export function ToastProvider() {
  const { theme } = useTheme();
  
  const toastConfig: ToastConfig = {
    success: (props) => (
      <BaseToast
        {...props}
        style={{
          borderLeftColor: Colors[theme].success,
          backgroundColor: Colors[theme].surface,
        }}
        contentContainerStyle={{ paddingHorizontal: 15 }}
        text1Style={{
          fontSize: 16,
          fontWeight: '600',
          color: Colors[theme].text,
        }}
        text2Style={{
          fontSize: 14,
          color: Colors[theme].textSecondary,
        }}
      />
    ),
    error: (props) => (
      <ErrorToast
        {...props}
        style={{
          borderLeftColor: Colors[theme].error,
          backgroundColor: Colors[theme].surface,
        }}
        contentContainerStyle={{ paddingHorizontal: 15 }}
        text1Style={{
          fontSize: 16,
          fontWeight: '600',
          color: Colors[theme].text,
        }}
        text2Style={{
          fontSize: 14,
          color: Colors[theme].textSecondary,
        }}
      />
    ),
    info: (props) => (
      <BaseToast
        {...props}
        style={{
          borderLeftColor: Colors[theme].info,
          backgroundColor: Colors[theme].surface,
        }}
        contentContainerStyle={{ paddingHorizontal: 15 }}
        text1Style={{
          fontSize: 16,
          fontWeight: '600',
          color: Colors[theme].text,
        }}
        text2Style={{
          fontSize: 14,
          color: Colors[theme].textSecondary,
        }}
      />
    ),
  };

  return <Toast config={toastConfig} />;
}

export const showToast = {
  success: (title: string, message?: string) => {
    Toast.show({
      type: 'success',
      text1: title,
      text2: message,
      position: 'bottom',
      visibilityTime: 4000,
    });
  },
  error: (title: string, message?: string) => {
    Toast.show({
      type: 'error',
      text1: title,
      text2: message,
      position: 'bottom',
      visibilityTime: 4000,
    });
  },
  info: (message: string, description?: string) => {
    Toast.show({
      type: 'info',
      text1: message,
      text2: description,
      position: 'bottom',
      visibilityTime: 3000,
    });
  }
};