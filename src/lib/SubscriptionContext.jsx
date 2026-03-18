import React, { createContext, useContext, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { hasFeatureAccess } from '@/lib/entitlements';

const SubscriptionContext = createContext(null);

export function SubscriptionProvider({ children }) {
  const { user, isAuthenticated, authState } = useAuth();

  // Only fetch if fully authenticated (not loading, not error)
  const shouldFetch = !!user?.email && isAuthenticated && authState === 'authenticated';

  const { data: subscriptions = [] } = useQuery({
    queryKey: ['subscription', user?.email],
    queryFn: () => base44.entities.Subscription.filter({ user_email: user.email }),
    enabled: shouldFetch,
    staleTime: 5 * 60 * 1000,
    gcTime: 0, // Don't keep in cache after disable
  });

  const { data: overrides = [] } = useQuery({
    queryKey: ['entitlement-overrides', user?.email],
    queryFn: () => base44.entities.EntitlementOverride.filter({ user_email: user.email }),
    enabled: shouldFetch,
    staleTime: 5 * 60 * 1000,
    gcTime: 0,
  });

  // Use the most recent active subscription
  const subscription = useMemo(() => {
    const active = subscriptions.filter(s => ['active', 'trialing'].includes(s.status));
    if (active.length === 0) return subscriptions[0] || null;
    return active.sort((a, b) => new Date(b.started_at) - new Date(a.started_at))[0];
  }, [subscriptions]);

  const can = (featureKey) => hasFeatureAccess(user, subscription, overrides, featureKey);

  // Calculate trial days remaining
  const trialDaysRemaining = useMemo(() => {
    if (!subscription || subscription.status !== 'trialing' || !subscription.trial_ends_at) return 0;
    const end = new Date(subscription.trial_ends_at + 'T23:59:59');
    const now = new Date();
    const diff = Math.ceil((end - now) / (1000 * 60 * 60 * 24));
    return Math.max(0, diff);
  }, [subscription]);

  // Check if trial is expired (status trialing but days = 0)
  const isTrialExpired = subscription?.status === 'trialing' && trialDaysRemaining === 0;

  return (
    <SubscriptionContext.Provider value={{ subscription, overrides, can, trialDaysRemaining, isTrialExpired }}>
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscription() {
  const ctx = useContext(SubscriptionContext);
  if (!ctx) throw new Error('useSubscription must be used within SubscriptionProvider');
  return ctx;
}