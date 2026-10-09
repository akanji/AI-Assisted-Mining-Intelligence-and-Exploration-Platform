import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { db } from '../firebase';
import { doc, onSnapshot } from 'firebase/firestore';

export interface BillingInvoice {
  id: string;
  date: string;
  plan: 'monthly' | 'yearly';
  planName: string;
  amountUSD: number;
  status: 'PAID' | 'PENDING';
  cardLast4: string;
  pdfInvoiceNo: string;
}

export interface UserAccount {
  id: string;
  name: string;
  email: string;
  passwordHash: string; // Plain/hashed for client demo auth
  createdAt: string;
  trialStartDate: string;
  trialEndDate: string;
  subscriptionStatus: 'trial' | 'active_monthly' | 'active_yearly' | 'expired';
  plan: 'none' | 'monthly' | 'yearly';
  paidUntil: string | null;
  lastBilledDate: string | null;
  lastPaymentAmountUSD: number | null;
  billingInvoices: BillingInvoice[];
}

interface SubscriptionAuthContextType {
  currentUser: UserAccount | null;
  isAuthenticated: boolean;
  isTrialActive: boolean;
  isTrialExpiringSoon: boolean;
  trialDaysRemaining: number;
  trialHoursRemaining: number;
  isSubscribed: boolean;
  isAccessGranted: boolean;
  signUp: (params: { name: string; email: string; password: string }) => { success: boolean; error?: string };
  signIn: (params: { email: string; password: string }) => { success: boolean; error?: string };
  changePassword: (params: { email: string; oldPassword?: string; newPassword: string }) => { success: boolean; error?: string };
  signOut: () => void;
  paySubscription: (params: { plan: 'monthly' | 'yearly'; cardLast4?: string }) => { success: boolean; invoice?: BillingInvoice; error?: string };
  simulateExpireTrial: () => void;
  resetTrialToFull: () => void;
  allRegisteredUsers: UserAccount[];
}

const STORAGE_KEY = 'minex_subscription_auth_v1';

// Helper for default initial demo user with 7-Day trial active
export const getDefaultInitialUser = (): UserAccount => ({
  id: 'usr-demo-01',
  name: 'Elena Rostova',
  email: 'elena.rostova@exploration-corp.com',
  passwordHash: 'Minex2026!',
  createdAt: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString(),
  trialStartDate: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString(),
  trialEndDate: new Date(Date.now() + 5 * 24 * 3600 * 1000).toISOString(),
  subscriptionStatus: 'trial',
  plan: 'none',
  paidUntil: null,
  lastBilledDate: null,
  lastPaymentAmountUSD: null,
  billingInvoices: [],
});

const SubscriptionAuthContext = createContext<SubscriptionAuthContextType | undefined>(undefined);

export const SubscriptionAuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [users, setUsers] = useState<UserAccount[]>(() => {
    try {
      const stored = localStorage.getItem(`${STORAGE_KEY}_users`);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // If the demo user has an expired trial date from a past session, refresh it so the demo operates smoothly
          return parsed.map((u: UserAccount) => {
            if (u.id === 'usr-demo-01' && u.subscriptionStatus === 'trial') {
              const remaining = new Date(u.trialEndDate).getTime() - Date.now();
              if (remaining <= 0) {
                return getDefaultInitialUser();
              }
            }
            return u;
          });
        }
      }
    } catch (_err) {
      // fallback
    }
    return [getDefaultInitialUser()];
  });

  const [currentUserId, setCurrentUserId] = useState<string | null>(() => {
    try {
      const stored = localStorage.getItem(`${STORAGE_KEY}_session`);
      if (stored) return stored;
    } catch (_err) {}
    return 'usr-demo-01';
  });

  // Sync users to storage
  useEffect(() => {
    try {
      localStorage.setItem(`${STORAGE_KEY}_users`, JSON.stringify(users));
    } catch (_err) {}
  }, [users]);

  // Sync session to storage
  useEffect(() => {
    try {
      if (currentUserId) {
        localStorage.setItem(`${STORAGE_KEY}_session`, currentUserId);
      } else {
        localStorage.removeItem(`${STORAGE_KEY}_session`);
      }
    } catch (_err) {}
  }, [currentUserId]);

  // Reactive clock to update remaining time and trigger expiry events
  const [currentTime, setCurrentTime] = useState<number>(Date.now());
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(Date.now());
    }, 10000); // 10 second refresh
    return () => clearInterval(timer);
  }, []);

  const currentUser = users.find((u) => u.id === currentUserId) || null;

  // Calculate dynamic trial remaining time
  const trialEndMs = currentUser ? new Date(currentUser.trialEndDate).getTime() : 0;
  const msRemaining = Math.max(0, trialEndMs - currentTime);
  const trialDaysRemaining = Math.ceil(msRemaining / (24 * 3600 * 1000));
  const trialHoursRemaining = Math.ceil(msRemaining / (3600 * 1000));

  const isTrialActive = Boolean(
    currentUser &&
      (currentUser.subscriptionStatus === 'trial' || currentUser.subscriptionStatus === undefined) &&
      msRemaining > 0
  );

  // Notify when trial is in its last 48 hours
  const isTrialExpiringSoon = Boolean(
    isTrialActive && trialHoursRemaining > 0 && trialHoursRemaining <= 48
  );

  // Auto-mark expired in users array if time ran out
  useEffect(() => {
    if (
      currentUser &&
      currentUser.subscriptionStatus === 'trial' &&
      trialEndMs > 0 &&
      currentTime >= trialEndMs
    ) {
      setUsers((prev) =>
        prev.map((u) =>
          u.id === currentUser.id && u.subscriptionStatus === 'trial'
            ? { ...u, subscriptionStatus: 'expired' }
            : u
        )
      );
    }
  }, [currentUser, trialEndMs, currentTime]);

  // Synchronize with Firestore when PayPal Webhook Cloud Function updates subscription
  useEffect(() => {
    if (!currentUser) return;

    let unsub: (() => void) | null = null;
    try {
      unsub = onSnapshot(
        doc(db, 'subscriptions', currentUser.id),
        (snap) => {
          if (snap.exists()) {
            const data = snap.data();
            if (data.subscriptionStatus) {
              setUsers((prev) =>
                prev.map((u) =>
                  u.id === currentUser.id
                    ? {
                        ...u,
                        subscriptionStatus: data.subscriptionStatus,
                        plan: data.plan || u.plan,
                        paidUntil: data.paidUntil || u.paidUntil,
                        lastBilledDate: data.lastBilledDate || u.lastBilledDate,
                        lastPaymentAmountUSD: data.lastPaymentAmountUSD || u.lastPaymentAmountUSD,
                      }
                    : u
                )
              );
            }
          }
        },
        (err) => {
          // Non-blocking log for offline or initial empty state
          console.debug('[Firestore Sync] Subscription listener notice:', err.message);
        }
      );
    } catch (_err) {
      // Ignored
    }

    return () => {
      if (unsub) unsub();
    };
  }, [currentUser?.id]);

  const isSubscribed = Boolean(
    currentUser &&
      (currentUser.subscriptionStatus === 'active_monthly' ||
        currentUser.subscriptionStatus === 'active_yearly')
  );

  // User can access if trial is active OR if subscribed
  const isAccessGranted = isTrialActive || isSubscribed;

  // Sign Up with 7-Day Free Trial
  const signUp = ({ name, email, password }: { name: string; email: string; password: string }) => {
    if (!name.trim()) return { success: false, error: 'Name is required' };
    if (!email.trim() || !email.includes('@')) return { success: false, error: 'Valid email is required' };
    if (!password || password.length < 6) return { success: false, error: 'Password must be at least 6 characters' };

    const normalizedEmail = email.trim().toLowerCase();
    const existing = users.find((u) => u.email.toLowerCase() === normalizedEmail);
    if (existing) {
      return { success: false, error: 'An account with this email already exists. Please Sign In.' };
    }

    const trialStart = new Date();
    const trialEnd = new Date(trialStart.getTime() + 7 * 24 * 3600 * 1000); // exactly 7 days

    const newUser: UserAccount = {
      id: `usr-${Date.now()}`,
      name: name.trim(),
      email: normalizedEmail,
      passwordHash: password,
      createdAt: trialStart.toISOString(),
      trialStartDate: trialStart.toISOString(),
      trialEndDate: trialEnd.toISOString(),
      subscriptionStatus: 'trial',
      plan: 'none',
      paidUntil: null,
      lastBilledDate: null,
      lastPaymentAmountUSD: null,
      billingInvoices: [],
    };

    setUsers((prev) => [...prev, newUser]);
    setCurrentUserId(newUser.id);
    return { success: true };
  };

  // Sign In with email and password
  const signIn = ({ email, password }: { email: string; password: string }) => {
    if (!email.trim() || !password) {
      return { success: false, error: 'Email and password are required' };
    }

    const normalizedEmail = email.trim().toLowerCase();
    const user = users.find((u) => u.email.toLowerCase() === normalizedEmail);
    if (!user) {
      return { success: false, error: 'No account found with this email. Please Sign Up.' };
    }

    if (user.passwordHash !== password) {
      return { success: false, error: 'Invalid password. Check credentials or use Change Password.' };
    }

    setCurrentUserId(user.id);
    return { success: true };
  };

  // Change Password
  const changePassword = ({
    email,
    oldPassword,
    newPassword,
  }: {
    email: string;
    oldPassword?: string;
    newPassword: string;
  }) => {
    if (!newPassword || newPassword.length < 6) {
      return { success: false, error: 'New password must be at least 6 characters' };
    }

    const normalizedEmail = email.trim().toLowerCase();
    const user = users.find((u) => u.email.toLowerCase() === normalizedEmail);
    if (!user) {
      return { success: false, error: 'Account not found for password change' };
    }

    if (oldPassword && user.passwordHash !== oldPassword) {
      return { success: false, error: 'Current password does not match' };
    }

    setUsers((prev) =>
      prev.map((u) => (u.id === user.id ? { ...u, passwordHash: newPassword } : u))
    );
    return { success: true };
  };

  // Sign Out
  const signOut = () => {
    setCurrentUserId(null);
  };

  // Pay Subscription (Monthly $19.99 or Yearly $199.99)
  const paySubscription = ({
    plan,
    cardLast4 = '4242',
  }: {
    plan: 'monthly' | 'yearly';
    cardLast4?: string;
  }) => {
    if (!currentUser) {
      return { success: false, error: 'Please sign up or sign in before processing billing.' };
    }

    const amount = plan === 'monthly' ? 19.99 : 199.99;
    const daysToAdd = plan === 'monthly' ? 30 : 365;
    const paidUntilDate = new Date(Date.now() + daysToAdd * 24 * 3600 * 1000).toISOString();
    const nowIso = new Date().toISOString();

    const invoice: BillingInvoice = {
      id: `INV-${Date.now()}`,
      date: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }),
      plan,
      planName: plan === 'monthly' ? 'Professional Monthly ($19.99/mo)' : 'Enterprise Yearly ($199.99/yr)',
      amountUSD: amount,
      status: 'PAID',
      cardLast4,
      pdfInvoiceNo: `MNX-BILL-${Math.floor(100000 + Math.random() * 900000)}`,
    };

    setUsers((prev) =>
      prev.map((u) => {
        if (u.id === currentUser.id) {
          return {
            ...u,
            subscriptionStatus: plan === 'monthly' ? 'active_monthly' : 'active_yearly',
            plan,
            paidUntil: paidUntilDate,
            lastBilledDate: nowIso,
            lastPaymentAmountUSD: amount,
            billingInvoices: [invoice, ...(u.billingInvoices || [])],
          };
        }
        return u;
      })
    );

    return { success: true, invoice };
  };

  // Simulate Expired Trial (for testing pay flow after 7-Day trial expires)
  const simulateExpireTrial = () => {
    if (!currentUser) return;
    const pastDate = new Date(Date.now() - 1000).toISOString();
    setUsers((prev) =>
      prev.map((u) =>
        u.id === currentUser.id
          ? {
              ...u,
              trialEndDate: pastDate,
              subscriptionStatus: 'expired',
              plan: 'none',
              paidUntil: null,
            }
          : u
      )
    );
  };

  // Reset Trial to Full 7 Days
  const resetTrialToFull = () => {
    if (!currentUser) return;
    const now = new Date();
    const trialEnd = new Date(now.getTime() + 7 * 24 * 3600 * 1000);
    setUsers((prev) =>
      prev.map((u) =>
        u.id === currentUser.id
          ? {
              ...u,
              trialStartDate: now.toISOString(),
              trialEndDate: trialEnd.toISOString(),
              subscriptionStatus: 'trial',
              plan: 'none',
            }
          : u
      )
    );
  };

  return (
    <SubscriptionAuthContext.Provider
      value={{
        currentUser,
        isAuthenticated: Boolean(currentUser),
        isTrialActive,
        isTrialExpiringSoon,
        trialDaysRemaining,
        trialHoursRemaining,
        isSubscribed,
        isAccessGranted,
        signUp,
        signIn,
        changePassword,
        signOut,
        paySubscription,
        simulateExpireTrial,
        resetTrialToFull,
        allRegisteredUsers: users,
      }}
    >
      {children}
    </SubscriptionAuthContext.Provider>
  );
};

export const useSubscriptionAuth = (): SubscriptionAuthContextType => {
  const context = useContext(SubscriptionAuthContext);
  if (!context) {
    throw new Error('useSubscriptionAuth must be used within a SubscriptionAuthProvider');
  }
  return context;
};
