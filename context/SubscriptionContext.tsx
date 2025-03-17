import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from './AuthContext';
import { showToast } from '@/components/Toast';

type Subscription = {
  id: string;
  userId: string;
  planId: 'monthly' | 'annual';
  status: 'active' | 'canceled' | 'expired';
  startDate: string;
  endDate: string;
  createdAt: string;
};

type SubscriptionContextType = {
  subscription: Subscription | null;
  hasActiveSubscription: boolean;
  subscriptionEndsAt: string | null;
  loading: boolean;
  startSubscription: (planId: 'monthly' | 'annual') => Promise<void>;
  cancelSubscription: () => Promise<void>;
  canAccessPremiumContent: (courseId?: string) => boolean;
};

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

export function SubscriptionProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchSubscription();
    } else {
      setSubscription(null);
      setLoading(false);
    }
  }, [user]);

  const fetchSubscription = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching subscription:', error);
        return;
      }

      if (data) {
        setSubscription({
          id: data.id,
          userId: data.user_id,
          planId: data.plan_id,
          status: data.status,
          startDate: data.start_date,
          endDate: data.end_date,
          createdAt: data.created_at,
        });
      } else {
        setSubscription(null);
      }
    } catch (error) {
      console.error('Error in fetchSubscription:', error);
    } finally {
      setLoading(false);
    }
  };

  const startSubscription = async (planId: 'monthly' | 'annual') => {
    if (!user) {
      showToast.error('You must be logged in to subscribe');
      return;
    }

    try {
      // Calculate end date based on plan
      const startDate = new Date();
      const endDate = new Date(startDate);
      
      if (planId === 'monthly') {
        endDate.setMonth(endDate.getMonth() + 1);
      } else {
        endDate.setFullYear(endDate.getFullYear() + 1);
      }

      // In a real app, you would integrate with a payment provider here
      // For this demo, we'll just create a subscription record

      const { data, error } = await supabase.from('subscriptions').insert([
        {
          user_id: user.id,
          plan_id: planId,
          status: 'active',
          start_date: startDate.toISOString(),
          end_date: endDate.toISOString(),
        },
      ]).select().single();

      if (error) {
        console.error('Error creating subscription:', error);
        showToast.error('Failed to create subscription');
        return;
      }

      setSubscription({
        id: data.id,
        userId: data.user_id,
        planId: data.plan_id,
        status: data.status,
        startDate: data.start_date,
        endDate: data.end_date,
        createdAt: data.created_at,
      });

      showToast.success('Subscription started successfully');
    } catch (error) {
      console.error('Error in startSubscription:', error);
      showToast.error('An unexpected error occurred');
    }
  };

  const cancelSubscription = async () => {
    if (!user || !subscription) {
      showToast.error('No active subscription to cancel');
      return;
    }

    try {
      const { error } = await supabase
        .from('subscriptions')
        .update({ status: 'canceled' })
        .eq('id', subscription.id);

      if (error) {
        console.error('Error canceling subscription:', error);
        showToast.error('Failed to cancel subscription');
        return;
      }

      // Update local state
      setSubscription({
        ...subscription,
        status: 'canceled',
      });

      showToast.success('Subscription canceled successfully');
    } catch (error) {
      console.error('Error in cancelSubscription:', error);
      showToast.error('An unexpected error occurred');
    }
  };

  const hasActiveSubscription = !!subscription && 
    subscription.status === 'active' && 
    new Date(subscription.endDate) > new Date();

  const subscriptionEndsAt = hasActiveSubscription ? subscription?.endDate : null;

  const canAccessPremiumContent = (courseId?: string): boolean => {
    // If no courseId provided, just check if user has an active subscription
    if (!courseId) return hasActiveSubscription;

    // In a real app, you might check if this specific course is included in the user's subscription
    // For this demo, we'll just check if they have any active subscription
    return hasActiveSubscription;
  };

  return (
    <SubscriptionContext.Provider
      value={{
        subscription,
        hasActiveSubscription,
        subscriptionEndsAt,
        loading,
        startSubscription,
        cancelSubscription,
        canAccessPremiumContent,
      }}
    >
      {children}
    </SubscriptionContext.Provider>
  );
}

export const useSubscription = () => {
  const context = useContext(SubscriptionContext);
  if (context === undefined) {
    throw new Error('useSubscription must be used within a SubscriptionProvider');
  }
  return context;
};