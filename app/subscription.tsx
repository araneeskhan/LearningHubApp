import React, { useState } from 'react';
import { StyleSheet, View, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter } from 'expo-router'; // Change to useRouter

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useSubscription } from '@/context/SubscriptionContext';
import { useAuth } from '@/context/AuthContext';
import { Colors } from '@/constants/Colors';
import { useTheme } from '@/context/ThemeContext';
import { IconSymbol } from '@/components/ui/IconSymbol';

export default function SubscriptionScreen() {
  const { theme } = useTheme();
  const colors = Colors[theme];
  const { user } = useAuth();
  const router = useRouter(); // Use the hook
  const { 
    subscription, 
    hasActiveSubscription, 
    subscriptionEndsAt,
    loading, 
    startSubscription, 
    cancelSubscription 
  } = useSubscription();
  
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'annual'>('monthly');
  const [processingAction, setProcessingAction] = useState(false);

  const handleSubscribe = async () => {
    if (!user) {
      router.push('/login');
      return;
    }
    
    setProcessingAction(true);
    try {
      await startSubscription(selectedPlan);
    } finally {
      setProcessingAction(false);
    }
  };

  const handleCancel = async () => {
    setProcessingAction(true);
    try {
      await cancelSubscription();
    } finally {
      setProcessingAction(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <Stack.Screen options={{ title: 'Subscription' }} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen options={{ title: 'Subscription' }} />
      
      <ThemedView style={styles.content}>
        <ThemedText type="title" style={styles.title}>
          Learning Hub Premium
        </ThemedText>
        
        <ThemedText style={styles.description}>
          Unlock all premium courses and features with a Learning Hub subscription.
        </ThemedText>
        
        {hasActiveSubscription ? (
          <View style={styles.activeSubscriptionContainer}>
            <View style={[styles.statusBadge, { backgroundColor: colors.success }]}>
              <ThemedText style={[styles.statusText, { color: '#fff' }]}>
                Active
              </ThemedText>
            </View>
            
            <ThemedText style={styles.subscriptionInfo}>
              You have an active {subscription?.planId} subscription.
            </ThemedText>
            
            {subscriptionEndsAt && (
              <ThemedText style={styles.subscriptionDate}>
                Your subscription is valid until {formatDate(subscriptionEndsAt)}.
              </ThemedText>
            )}
            
            <TouchableOpacity
              style={[styles.cancelButton, { borderColor: colors.error }]}
              onPress={handleCancel}
              disabled={processingAction}
            >
              {processingAction ? (
                <ActivityIndicator size="small" color={colors.error} />
              ) : (
                <ThemedText style={{ color: colors.error }}>
                  Cancel Subscription
                </ThemedText>
              )}
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <View style={styles.plansContainer}>
              <TouchableOpacity
                style={[
                  styles.planCard,
                  selectedPlan === 'monthly' && { borderColor: colors.primary, borderWidth: 2 },
                  { backgroundColor: colors.card }
                ]}
                onPress={() => setSelectedPlan('monthly')}
              >
                <View style={styles.planHeader}>
                  <ThemedText type="subtitle">Monthly</ThemedText>
                  {selectedPlan === 'monthly' && (
                    <IconSymbol name="checkmark.circle.fill" size={24} color={colors.primary} />
                  )}
                </View>
                
                <ThemedText type="title" style={styles.planPrice}>
                  $9.99
                </ThemedText>
                
                <ThemedText style={styles.planPeriod}>per month</ThemedText>
                
                <View style={styles.planFeatures}>
                  <View style={styles.featureItem}>
                    <IconSymbol name="checkmark" size={16} color={colors.success} />
                    <ThemedText style={styles.featureText}>
                      Access to all premium courses
                    </ThemedText>
                  </View>
                  <View style={styles.featureItem}>
                    <IconSymbol name="checkmark" size={16} color={colors.success} />
                    <ThemedText style={styles.featureText}>
                      Download lessons for offline viewing
                    </ThemedText>
                  </View>
                  <View style={styles.featureItem}>
                    <IconSymbol name="checkmark" size={16} color={colors.success} />
                    <ThemedText style={styles.featureText}>
                      Cancel anytime
                    </ThemedText>
                  </View>
                </View>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.planCard,
                  selectedPlan === 'annual' && { borderColor: colors.primary, borderWidth: 2 },
                  { backgroundColor: colors.card }
                ]}
                onPress={() => setSelectedPlan('annual')}
              >
                <View style={[styles.savingBadge, { backgroundColor: colors.success }]}>
                  <ThemedText style={[styles.savingText, { color: '#fff' }]}>
                    Save 20%
                  </ThemedText>
                </View>
                
                <View style={styles.planHeader}>
                  <ThemedText type="subtitle">Annual</ThemedText>
                  {selectedPlan === 'annual' && (
                    <IconSymbol name="checkmark.circle.fill" size={24} color={colors.primary} />
                  )}
                </View>
                
                <ThemedText type="title" style={styles.planPrice}>
                  $95.88
                </ThemedText>
                
                <ThemedText style={styles.planPeriod}>per year</ThemedText>
                
                <View style={styles.planFeatures}>
                  <View style={styles.featureItem}>
                    <IconSymbol name="checkmark" size={16} color={colors.success} />
                    <ThemedText style={styles.featureText}>
                      All monthly plan features
                    </ThemedText>
                  </View>
                  <View style={styles.featureItem}>
                    <IconSymbol name="checkmark" size={16} color={colors.success} />
                    <ThemedText style={styles.featureText}>
                      Priority support
                    </ThemedText>
                  </View>
                  <View style={styles.featureItem}>
                    <IconSymbol name="checkmark" size={16} color={colors.success} />
                    <ThemedText style={styles.featureText}>
                      Early access to new courses
                    </ThemedText>
                  </View>
                </View>
              </TouchableOpacity>
            </View>
            
            <TouchableOpacity
              style={[styles.subscribeButton, { backgroundColor: colors.primary }]}
              onPress={handleSubscribe}
              disabled={processingAction}
            >
              {processingAction ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <ThemedText style={styles.subscribeButtonText}>
                  Subscribe Now
                </ThemedText>
              )}
            </TouchableOpacity>
          </>
        )}
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
  content: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  description: {
    textAlign: 'center',
    marginBottom: 24,
    opacity: 0.8,
  },
  plansContainer: {
    flexDirection: 'column',
    gap: 16,
    marginBottom: 24,
  },
  planCard: {
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
    position: 'relative',
    overflow: 'hidden',
  },
  savingBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  savingText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  planPrice: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  planPeriod: {
    opacity: 0.7,
    marginBottom: 16,
  },
  planFeatures: {
    marginTop: 12,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  featureText: {
    marginLeft: 8,
  },
  subscribeButton: {
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  subscribeButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  activeSubscriptionContainer: {
    alignItems: 'center',
    padding: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginBottom: 16,
  },
  statusText: {
    fontWeight: 'bold',
  },
  subscriptionInfo: {
    fontSize: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  subscriptionDate: {
    opacity: 0.7,
    marginBottom: 24,
    textAlign: 'center',
  },
  cancelButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    borderWidth: 1,
  },
});