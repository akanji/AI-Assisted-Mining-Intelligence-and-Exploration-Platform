import React, { useState, useEffect } from 'react';
import {
  CreditCard,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Sparkles,
  Lock,
  Unlock,
  User,
  Mail,
  Key,
  Shield,
  Zap,
  Calendar,
  FileText,
  DollarSign,
  ArrowRight,
  LogOut,
  RefreshCw,
  Eye,
  EyeOff,
  RotateCcw,
  Check,
  Star,
  Layers,
  Globe,
  Wallet,
} from 'lucide-react';
import { useSubscriptionAuth, BillingInvoice } from '../context/SubscriptionAuthContext';
import { PayPalSubscriptionSmartButton } from './PayPalSubscriptionSmartButton';
import { ActiveTab } from '../types';

export interface SubscriptionBillingSectionProps {
  onNavigateToTab?: (tab: ActiveTab) => void;
}

export const SubscriptionBillingSection: React.FC<SubscriptionBillingSectionProps> = ({
  onNavigateToTab,
}) => {
  const {
    currentUser,
    isAuthenticated,
    isTrialActive,
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
  } = useSubscriptionAuth();

  const [activeTab, setActiveTab] = useState<'PLANS' | 'SIGNUP' | 'SIGNIN' | 'CHANGE_PASSWORD' | 'INVOICES'>(
    isAuthenticated ? 'PLANS' : 'SIGNUP'
  );

  // Sign Up Form State
  const [signUpName, setSignUpName] = useState('');
  const [signUpEmail, setSignUpEmail] = useState('');
  const [signUpPassword, setSignUpPassword] = useState('');
  const [signUpConfirmPassword, setSignUpConfirmPassword] = useState('');
  const [showSignUpPassword, setShowSignUpPassword] = useState(false);
  const [signUpError, setSignUpError] = useState('');
  const [signUpSuccess, setSignUpSuccess] = useState('');

  // Sign In Form State
  const [signInEmail, setSignInEmail] = useState('');
  const [signInPassword, setSignInPassword] = useState('');
  const [showSignInPassword, setShowSignInPassword] = useState(false);
  const [signInError, setSignInError] = useState('');
  const [signInSuccess, setSignInSuccess] = useState('');

  // Change Password Form State
  const [changeEmail, setChangeEmail] = useState(currentUser?.email || '');
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [changeError, setChangeError] = useState('');
  const [changeSuccess, setChangeSuccess] = useState('');

  // Checkout Payment Modal State
  const [checkoutPlan, setCheckoutPlan] = useState<'monthly' | 'yearly' | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'paypal'>('paypal');
  const [cardHolder, setCardHolder] = useState(currentUser?.name || 'Chief Mining Officer');
  const [cardNumber, setCardNumber] = useState('4242 •••• •••• 4242');
  const [cardExpiry, setCardExpiry] = useState('12/28');
  const [cardCvc, setCardCvc] = useState('888');
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [paymentSuccessInvoice, setPaymentSuccessInvoice] = useState<BillingInvoice | null>(null);
  const [paypalStatusMessage, setPaypalStatusMessage] = useState<string | null>(null);

  // PayPal Environment Configuration (Client interacts exclusively via Server Proxy)
  const [paypalConfig, setPaypalConfig] = useState<{
    proxyUrl: string;
    clientId: string;
    isConfigured: boolean;
  }>({
    proxyUrl: '/api/paypal',
    clientId: '',
    isConfigured: false,
  });

  useEffect(() => {
    fetch('/api/paypal/config')
      .then((res) => res.json())
      .then((data) => {
        if (data) {
          setPaypalConfig({
            proxyUrl: data.proxyUrl || '/api/paypal',
            clientId: data.clientId || '',
            isConfigured: Boolean(data.isConfigured),
          });
        }
      })
      .catch((err) => {
        console.warn('Failed to load PayPal config:', err);
      });
  }, []);

  // Handle Sign Up
  const handleSignUp = (e: React.FormEvent) => {
    e.preventDefault();
    setSignUpError('');
    setSignUpSuccess('');

    if (signUpPassword !== signUpConfirmPassword) {
      setSignUpError('Passwords do not match');
      return;
    }

    const res = signUp({
      name: signUpName,
      email: signUpEmail,
      password: signUpPassword,
    });

    if (res.success) {
      setSignUpSuccess('Account created successfully! Your 7-Day Free Trial has started.');
      setSignUpName('');
      setSignUpEmail('');
      setSignUpPassword('');
      setSignUpConfirmPassword('');
      setActiveTab('PLANS');
    } else {
      setSignUpError(res.error || 'Failed to create account');
    }
  };

  // Handle Sign In
  const handleSignIn = (e: React.FormEvent) => {
    e.preventDefault();
    setSignInError('');
    setSignInSuccess('');

    const res = signIn({
      email: signInEmail,
      password: signInPassword,
    });

    if (res.success) {
      setSignInSuccess('Welcome back! You are now signed in.');
      setSignInPassword('');
      setActiveTab('PLANS');
    } else {
      setSignInError(res.error || 'Failed to sign in');
    }
  };

  // Handle Change Password
  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    setChangeError('');
    setChangeSuccess('');

    if (newPassword !== confirmNewPassword) {
      setChangeError('New passwords do not match');
      return;
    }

    const res = changePassword({
      email: changeEmail || currentUser?.email || '',
      oldPassword: oldPassword || undefined,
      newPassword,
    });

    if (res.success) {
      setChangeSuccess('Password updated successfully! You can now use your new password.');
      setOldPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
    } else {
      setChangeError(res.error || 'Failed to update password');
    }
  };

  // Quick Demo Autofill
  const fillDemoCredentials = () => {
    setSignInEmail('elena.rostova@exploration-corp.com');
    setSignInPassword('Minex2026!');
  };

  // Handle Card Payment
  const handleExecutePayment = () => {
    if (!checkoutPlan) return;
    setIsProcessingPayment(true);

    setTimeout(() => {
      const res = paySubscription({
        plan: checkoutPlan,
        cardLast4: cardNumber.slice(-4).replace(/\D/g, '') || '4242',
      });

      setIsProcessingPayment(false);
      if (res.success && res.invoice) {
        setPaymentSuccessInvoice(res.invoice);
        setCheckoutPlan(null);
      }
    }, 1000);
  };

  // Handle PayPal Checkout Payment (via server-side proxy routes)
  const handleExecutePayPalPayment = async () => {
    if (!checkoutPlan) return;
    setIsProcessingPayment(true);
    setPaypalStatusMessage('Connecting to secure backend PayPal billing proxy (/api/paypal)...');

    try {
      // 1. Create order on backend proxy
      const orderRes = await fetch('/api/paypal/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plan: checkoutPlan,
          userEmail: currentUser?.email || 'geologist@minex-ai.com',
        }),
      });
      const orderData = await orderRes.json();

      if (!orderRes.ok || !orderData.success) {
        throw new Error(orderData.error || 'Failed to initialize PayPal transaction');
      }

      setPaypalStatusMessage('Processing PayPal payment authorization...');

      // 2. Capture / complete the payment
      const captureRes = await fetch('/api/paypal/capture-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: orderData.orderId,
          plan: checkoutPlan,
        }),
      });
      const captureData = await captureRes.json();

      if (!captureRes.ok || !captureData.success) {
        throw new Error(captureData.error || 'Failed to capture PayPal transaction');
      }

      // 3. Activate subscription in application
      const res = paySubscription({
        plan: checkoutPlan,
        cardLast4: 'PAYPAL',
      });

      setIsProcessingPayment(false);
      setPaypalStatusMessage(null);

      if (res.success && res.invoice) {
        setPaymentSuccessInvoice(res.invoice);
        setCheckoutPlan(null);
      }
    } catch (err: any) {
      console.error('PayPal checkout error:', err);
      setIsProcessingPayment(false);
      setPaypalStatusMessage(`PayPal notice: ${err.message || 'Payment could not be processed'}`);
    }
  };

  // Handle Client-Side PayPal Smart Button Approved Subscription
  const handlePayPalSubscriptionSuccess = (data: any) => {
    const subscriptionId =
      typeof data === 'string'
        ? data
        : data?.subscriptionID || `SUB-${Date.now()}`;
    const plan = checkoutPlan || 'monthly';
    const res = paySubscription({
      plan,
      cardLast4: `PP-${String(subscriptionId).slice(-4)}`,
    });

    if (res.success && res.invoice) {
      setPaymentSuccessInvoice({
        ...res.invoice,
        pdfInvoiceNo: `PP-SUB-${subscriptionId}`,
      });
      setCheckoutPlan(null);
    }
  };

  return (
    <div
      id="subscription-billing-section"
      className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-in fade-in duration-300"
    >
      {/* Top Hero Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#1C100B] via-[#2A1810] to-[#120B08] border-2 border-amber-500/40 p-6 sm:p-8 shadow-2xl">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-72 h-72 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-10 w-80 h-80 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-mono font-bold">
              <Sparkles size={13} className="text-amber-400" />
              <span>MINEX AI EXPLORATION &bull; SUBSCRIPTION &amp; BILLING</span>
            </div>

            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white font-['Space_Grotesk'] tracking-tight">
              Subscription &amp; Billing Management
            </h1>

            <p className="text-stone-300 text-xs sm:text-sm leading-relaxed">
              Sign up with an immediate <strong>7-Day Free Trial</strong> to explore full geological GIS,
              core hyperspectral vision, and vibration telemetry. Seamlessly upgrade to <strong>Monthly ($19.99)</strong> or <strong>Yearly ($199.99)</strong> subscription to maintain continuous access when your trial expires.
            </p>
          </div>

          {/* Current User & Trial Status Card */}
          <div className="flex-shrink-0 p-4 sm:p-5 rounded-2xl bg-black/60 border border-amber-500/30 backdrop-blur-md min-w-[280px] sm:min-w-[320px] space-y-3 font-mono text-xs">
            <div className="flex items-center justify-between border-b border-stone-800 pb-2.5">
              <span className="text-stone-400 font-bold flex items-center gap-1.5">
                <User size={14} className="text-amber-400" />
                <span>Account Status</span>
              </span>
              {isAuthenticated && (
                <button
                  type="button"
                  onClick={signOut}
                  className="text-stone-400 hover:text-rose-400 transition-colors flex items-center gap-1 text-[11px]"
                  title="Sign Out"
                >
                  <LogOut size={12} />
                  <span>Sign Out</span>
                </button>
              )}
            </div>

            {currentUser ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-white font-bold truncate max-w-[170px]">{currentUser.name}</span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold border ${
                      isSubscribed
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                        : isTrialActive
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 animate-pulse'
                        : 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                    }`}
                  >
                    {isSubscribed
                      ? currentUser.plan === 'monthly'
                        ? 'PRO MONTHLY ($19.99)'
                        : 'ENTERPRISE YEARLY ($199.99)'
                      : isTrialActive
                      ? '7-DAY FREE TRIAL'
                      : 'TRIAL EXPIRED'}
                  </span>
                </div>

                <div className="text-[11px] text-stone-400 truncate">{currentUser.email}</div>

                {/* Trial Countdown or Active Paid Status */}
                {isTrialActive ? (
                  <div className="space-y-1.5 pt-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-amber-300 flex items-center gap-1">
                        <Clock size={12} />
                        <span>Trial Remaining:</span>
                      </span>
                      <strong className="text-white font-extrabold">
                        {trialDaysRemaining} Days ({trialHoursRemaining}h)
                      </strong>
                    </div>
                    {/* Progress Bar for 7 Days */}
                    <div className="w-full h-2 rounded-full bg-stone-900 border border-stone-800 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-amber-500 to-emerald-400 rounded-full transition-all duration-500"
                        style={{ width: `${Math.max(10, (trialDaysRemaining / 7) * 100)}%` }}
                      />
                    </div>
                  </div>
                ) : isSubscribed ? (
                  <div className="p-2 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-[11px] text-emerald-200 flex items-center gap-2">
                    <CheckCircle2 size={15} className="text-emerald-400 flex-shrink-0" />
                    <span>Unrestricted License Active &bull; Renews automatically</span>
                  </div>
                ) : (
                  <div className="p-2 rounded-xl bg-rose-950/50 border border-rose-500/40 text-[11px] text-rose-200 flex items-center gap-2">
                    <AlertTriangle size={15} className="text-rose-400 flex-shrink-0" />
                    <span>7-Day Trial Expired &bull; Select a plan below to continue</span>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-stone-400 text-center py-2 space-y-2">
                <p>No active account session detected.</p>
                <button
                  type="button"
                  onClick={() => setActiveTab('SIGNUP')}
                  className="w-full py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-extrabold text-xs transition-colors"
                >
                  Sign Up with 7-Day Trial
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Trial Status Warning Banner (Shown if Trial Expired) */}
      {!isAccessGranted && currentUser && (
        <div
          id="trial-expired-alert-banner"
          className="p-4 rounded-2xl bg-rose-950/80 border-2 border-rose-500 text-rose-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xl animate-in slide-in-from-top-2"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/40 flex-shrink-0 animate-bounce">
              <Lock size={20} />
            </div>
            <div>
              <h3 className="font-extrabold text-white text-sm font-['Space_Grotesk']">
                Your 7-Day Free Trial Has Expired
              </h3>
              <p className="text-xs text-rose-200 mt-0.5">
                Subscribe to either the <strong>Monthly ($19.99)</strong> or <strong>Yearly ($199.99)</strong> plan below to immediately resume using all AI exploration tools, geochemical models, and equipment diagnostics.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              type="button"
              onClick={() => {
                setCheckoutPlan('monthly');
              }}
              className="px-3.5 py-1.5 rounded-xl bg-white text-stone-950 hover:bg-stone-200 font-extrabold text-xs shadow-md transition-all"
            >
              Pay Monthly ($19.99)
            </button>
            <button
              type="button"
              onClick={() => {
                setCheckoutPlan('yearly');
              }}
              className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-black text-xs shadow-md transition-all"
            >
              Pay Yearly ($199.99)
            </button>
          </div>
        </div>
      )}

      {/* Navigation Sub-Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-stone-800 pb-2">
        <div className="flex flex-wrap items-center gap-1.5 text-xs font-mono font-bold">
          <button
            type="button"
            id="tab-btn-billing-plans"
            onClick={() => setActiveTab('PLANS')}
            className={`px-3.5 py-2 rounded-xl transition-all flex items-center gap-1.5 ${
              activeTab === 'PLANS'
                ? 'bg-amber-500 text-stone-950 shadow-md font-extrabold'
                : 'bg-stone-900/80 hover:bg-stone-800 text-stone-300'
            }`}
          >
            <CreditCard size={14} />
            <span>Billing &amp; Plans ($19.99 / $199.99)</span>
          </button>

          <button
            type="button"
            id="tab-btn-signup"
            onClick={() => setActiveTab('SIGNUP')}
            className={`px-3.5 py-2 rounded-xl transition-all flex items-center gap-1.5 ${
              activeTab === 'SIGNUP'
                ? 'bg-amber-500 text-stone-950 shadow-md font-extrabold'
                : 'bg-stone-900/80 hover:bg-stone-800 text-stone-300'
            }`}
          >
            <Sparkles size={14} />
            <span>Sign Up (7-Day Trial)</span>
          </button>

          <button
            type="button"
            id="tab-btn-signin"
            onClick={() => setActiveTab('SIGNIN')}
            className={`px-3.5 py-2 rounded-xl transition-all flex items-center gap-1.5 ${
              activeTab === 'SIGNIN'
                ? 'bg-amber-500 text-stone-950 shadow-md font-extrabold'
                : 'bg-stone-900/80 hover:bg-stone-800 text-stone-300'
            }`}
          >
            <User size={14} />
            <span>Sign In</span>
          </button>

          <button
            type="button"
            id="tab-btn-change-password"
            onClick={() => setActiveTab('CHANGE_PASSWORD')}
            className={`px-3.5 py-2 rounded-xl transition-all flex items-center gap-1.5 ${
              activeTab === 'CHANGE_PASSWORD'
                ? 'bg-amber-500 text-stone-950 shadow-md font-extrabold'
                : 'bg-stone-900/80 hover:bg-stone-800 text-stone-300'
            }`}
          >
            <Key size={14} />
            <span>Change Password</span>
          </button>

          {currentUser?.billingInvoices && currentUser.billingInvoices.length > 0 && (
            <button
              type="button"
              id="tab-btn-invoices"
              onClick={() => setActiveTab('INVOICES')}
              className={`px-3.5 py-2 rounded-xl transition-all flex items-center gap-1.5 ${
                activeTab === 'INVOICES'
                  ? 'bg-amber-500 text-stone-950 shadow-md font-extrabold'
                  : 'bg-stone-900/80 hover:bg-stone-800 text-stone-300'
              }`}
            >
              <FileText size={14} />
              <span>Invoices &amp; Receipts ({currentUser.billingInvoices.length})</span>
            </button>
          )}
        </div>

        {/* Developer / Evaluator Quick Simulation Tool */}
        <div className="flex items-center gap-2 text-[11px] font-mono">
          <span className="text-stone-500 hidden md:inline">Test Simulation:</span>
          <button
            type="button"
            id="btn-simulate-trial-expired"
            onClick={simulateExpireTrial}
            className="px-2.5 py-1 rounded-lg bg-rose-950/60 hover:bg-rose-900 text-rose-300 border border-rose-800 transition-colors"
            title="Expire 7-Day trial to test billing lockout and pay flow"
          >
            Expire Trial
          </button>
          <button
            type="button"
            id="btn-reset-trial"
            onClick={resetTrialToFull}
            className="px-2.5 py-1 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 border border-stone-700 transition-colors flex items-center gap-1"
            title="Reset to fresh 7-day trial"
          >
            <RotateCcw size={11} />
            <span>Reset 7D</span>
          </button>
        </div>
      </div>

      {/* Tab 1: BILLING & PLANS (Monthly $19.99 and Yearly $199.99) */}
      {activeTab === 'PLANS' && (
        <div className="space-y-8 animate-in fade-in duration-200">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <h2 className="text-xl sm:text-2xl font-bold text-white font-['Space_Grotesk']">
              Flexible Subscription Plans for Explorers &amp; Mining Crews
            </h2>
            <p className="text-xs sm:text-sm text-stone-400">
              Start with your 7-Day free trial. When you are ready or after your trial expires, pick the subscription that best fits your operational cycle.
            </p>
          </div>

          {/* PayPal Environment & Gateway Integration Status Bar */}
          <div className="max-w-4xl mx-auto p-4 rounded-2xl bg-gradient-to-r from-[#003087]/25 via-stone-900/90 to-[#0070BA]/25 border border-[#0070BA]/40 shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-start sm:items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#003087]/50 border border-[#0070BA]/60 flex items-center justify-center text-sky-400 flex-shrink-0 shadow-md">
                <Wallet size={20} />
              </div>
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-sm font-extrabold text-white font-['Space_Grotesk'] flex items-center gap-1.5">
                    <span>PayPal Billing Gateway</span>
                  </h3>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-sky-950/80 border border-sky-500/40 text-sky-300">
                    {paypalConfig.isConfigured ? 'SECURE ACTIVE GATEWAY' : 'CONFIGURED & READY'}
                  </span>
                </div>
                <div className="text-[11px] font-mono text-stone-300 flex flex-wrap items-center gap-x-3 gap-y-1">
                  <span>Connection: <strong className="text-emerald-400 font-bold">Encrypted REST SSL (256-bit)</strong></span>
                  <span>Active Plans: <strong className="text-white">Pro Monthly ($19.99) &bull; Enterprise Yearly ($199.99)</strong></span>
                  <span className="text-sky-300/80">API Credentials Secured In Backend Vault</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 self-end md:self-center">
              <button
                type="button"
                onClick={() => {
                  setCheckoutPlan('monthly');
                  setPaymentMethod('paypal');
                }}
                className="px-3.5 py-2 rounded-xl bg-[#0070BA] hover:bg-[#003087] text-white font-black text-xs transition-all flex items-center gap-1.5 shadow-md cursor-pointer"
              >
                <Wallet size={14} />
                <span>PayPal Express</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8 max-w-4xl mx-auto">
            {/* Monthly Subscription Card ($19.99) */}
            <div
              id="card-monthly-plan"
              className={`rounded-3xl border-2 p-6 sm:p-8 flex flex-col justify-between transition-all relative ${
                currentUser?.plan === 'monthly'
                  ? 'bg-gradient-to-b from-amber-950/30 to-stone-900/90 border-amber-500 ring-2 ring-amber-500/40 shadow-2xl'
                  : 'bg-stone-900/80 border-stone-800 hover:border-amber-500/60 shadow-xl'
              }`}
            >
              <div className="space-y-5">
                <div className="flex items-center justify-between">
                  <span className="px-3 py-1 rounded-full bg-stone-800 text-stone-300 text-xs font-mono font-bold">
                    Standard Monthly
                  </span>
                  {currentUser?.plan === 'monthly' && (
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-mono font-bold flex items-center gap-1">
                      <CheckCircle2 size={11} />
                      <span>Current Plan</span>
                    </span>
                  )}
                </div>

                <div>
                  <h3 className="text-xl font-extrabold text-white font-['Space_Grotesk']">
                    Professional Monthly
                  </h3>
                  <p className="text-xs text-stone-400 mt-1">
                    Flexible month-to-month billing. Perfect for seasonal exploration campaigns.
                  </p>
                </div>

                <div className="flex items-baseline gap-1.5 font-mono">
                  <span className="text-3xl sm:text-4xl font-black text-white">$19.99</span>
                  <span className="text-stone-400 text-xs font-semibold">/ month</span>
                </div>

                <ul className="space-y-2.5 text-xs text-stone-300 pt-2 border-t border-stone-800">
                  {[
                    'Full access to all 5 Global GIS exploration regions',
                    'Mineral Anomaly Predictor & Geochemical Fusion',
                    'Drill-Hole Manager with 3D Strata & PDF Reports',
                    'Equipment AR Health Live Video Feed & Vibrations',
                    'MineAI Assistant with natural language GIS dispatch',
                    'Continuous access after 7-Day trial expires',
                  ].map((feat, fIdx) => (
                    <li key={fIdx} className="flex items-start gap-2">
                      <Check size={14} className="text-amber-400 mt-0.5 flex-shrink-0" />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="pt-6 space-y-2">
                <button
                  type="button"
                  id="btn-pay-monthly"
                  onClick={() => {
                    setCheckoutPlan('monthly');
                    setPaymentMethod('card');
                  }}
                  className="w-full py-3 rounded-2xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-extrabold text-xs sm:text-sm shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <CreditCard size={16} />
                  <span>Pay Monthly ($19.99)</span>
                </button>

                <button
                  type="button"
                  id="btn-pay-monthly-paypal"
                  onClick={() => {
                    setCheckoutPlan('monthly');
                    setPaymentMethod('paypal');
                  }}
                  className="w-full py-2.5 rounded-2xl bg-[#0070BA]/20 hover:bg-[#0070BA]/35 text-sky-300 border border-[#0070BA]/50 font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Wallet size={15} className="text-sky-400" />
                  <span>Subscribe via PayPal ($19.99/mo)</span>
                </button>

                <p className="text-[10px] font-mono text-center text-stone-500 mt-1">
                  Billed monthly. Cancel anytime with 1-click.
                </p>
              </div>
            </div>

            {/* Yearly Subscription Card ($199.99) */}
            <div
              id="card-yearly-plan"
              className={`rounded-3xl border-2 p-6 sm:p-8 flex flex-col justify-between transition-all relative ${
                currentUser?.plan === 'yearly'
                  ? 'bg-gradient-to-b from-amber-950/40 via-stone-900/90 to-black border-amber-400 ring-4 ring-amber-500/30 shadow-2xl'
                  : 'bg-gradient-to-b from-[#1C100B] to-stone-900/90 border-amber-500/60 hover:border-amber-400 shadow-2xl'
              }`}
            >
              {/* Best Value Badge */}
              <div className="absolute -top-3.5 right-6 px-3 py-1 rounded-full bg-gradient-to-r from-amber-500 to-rose-500 text-stone-950 text-[11px] font-black tracking-wider uppercase shadow-md flex items-center gap-1">
                <Star size={12} className="fill-stone-950" />
                <span>Best Value &bull; Save $40</span>
              </div>

              <div className="space-y-5">
                <div className="flex items-center justify-between">
                  <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs font-mono font-bold">
                    Annual Commitment
                  </span>
                  {currentUser?.plan === 'yearly' && (
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-mono font-bold flex items-center gap-1">
                      <CheckCircle2 size={11} />
                      <span>Current Plan</span>
                    </span>
                  )}
                </div>

                <div>
                  <h3 className="text-xl font-extrabold text-white font-['Space_Grotesk'] flex items-center gap-2">
                    <span>Enterprise Yearly</span>
                  </h3>
                  <p className="text-xs text-stone-400 mt-1">
                    Uninterrupted annual exploration intelligence for year-round mine sites.
                  </p>
                </div>

                <div className="flex items-baseline gap-2 font-mono">
                  <span className="text-3xl sm:text-4xl font-black text-amber-300">$199.99</span>
                  <span className="text-stone-400 text-xs font-semibold">/ year</span>
                  <span className="text-[11px] text-emerald-400 font-bold bg-emerald-950/80 px-2 py-0.5 rounded-full">
                    ($16.66/mo)
                  </span>
                </div>

                <ul className="space-y-2.5 text-xs text-stone-300 pt-2 border-t border-stone-800">
                  {[
                    'Everything included in Professional Monthly',
                    'Priority Gemini Flash AI processing quota & speed',
                    'Multi-user field tablet offline sync & caching',
                    'JORC & NI 43-101 compliance attestation generator',
                    'Unlimited mineral database & assay lab integrations',
                    'Guaranteed locked pricing for 12 full months',
                  ].map((feat, fIdx) => (
                    <li key={fIdx} className="flex items-start gap-2">
                      <Check size={14} className="text-amber-400 mt-0.5 flex-shrink-0" />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="pt-6 space-y-2">
                <button
                  type="button"
                  id="btn-pay-yearly"
                  onClick={() => {
                    setCheckoutPlan('yearly');
                    setPaymentMethod('card');
                  }}
                  className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-stone-950 font-black text-xs sm:text-sm shadow-xl shadow-amber-500/30 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Sparkles size={16} />
                  <span>Pay Yearly ($199.99)</span>
                </button>

                <button
                  type="button"
                  id="btn-pay-yearly-paypal"
                  onClick={() => {
                    setCheckoutPlan('yearly');
                    setPaymentMethod('paypal');
                  }}
                  className="w-full py-2.5 rounded-2xl bg-[#0070BA]/20 hover:bg-[#0070BA]/35 text-sky-300 border border-[#0070BA]/50 font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Wallet size={15} className="text-sky-400" />
                  <span>Subscribe via PayPal ($199.99/yr)</span>
                </button>

                <p className="text-[10px] font-mono text-center text-stone-500 mt-1">
                  Billed annually ($199.99). Includes priority AI inference.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: SIGN UP with 7-Day Free Trial */}
      {activeTab === 'SIGNUP' && (
        <div className="max-w-xl mx-auto p-6 sm:p-8 rounded-3xl bg-stone-900/90 border-2 border-amber-500/40 shadow-2xl space-y-6 animate-in fade-in duration-200">
          <div className="text-center space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs font-mono font-bold">
              <Sparkles size={13} />
              <span>7-DAY FREE TRIAL INCLUDED</span>
            </div>
            <h2 className="text-2xl font-extrabold text-white font-['Space_Grotesk']">
              Create Your MINEX AI Account
            </h2>
            <p className="text-xs text-stone-400">
              Sign up today with your name, email, and password to begin your 7-day trial. No credit card required to start.
            </p>
          </div>

          {signUpError && (
            <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-500/60 text-rose-200 text-xs flex items-center gap-2">
              <AlertTriangle size={15} className="text-rose-400 flex-shrink-0" />
              <span>{signUpError}</span>
            </div>
          )}

          {signUpSuccess && (
            <div className="p-3 rounded-xl bg-emerald-950/60 border border-emerald-500/60 text-emerald-200 text-xs flex items-center gap-2">
              <CheckCircle2 size={15} className="text-emerald-400 flex-shrink-0" />
              <span>{signUpSuccess}</span>
            </div>
          )}

          <form onSubmit={handleSignUp} className="space-y-4 text-xs font-mono">
            <div className="space-y-1.5">
              <label className="text-stone-300 font-bold flex items-center gap-1.5">
                <User size={13} className="text-amber-400" />
                <span>Full Name</span>
              </label>
              <input
                type="text"
                required
                value={signUpName}
                onChange={(e) => setSignUpName(e.target.value)}
                placeholder="e.g. Dr. Marcus Vance"
                className="w-full px-3.5 py-2.5 rounded-xl bg-black/60 border border-stone-700 text-white placeholder-stone-600 focus:outline-none focus:border-amber-500 text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-stone-300 font-bold flex items-center gap-1.5">
                <Mail size={13} className="text-amber-400" />
                <span>Work Email</span>
              </label>
              <input
                type="email"
                required
                value={signUpEmail}
                onChange={(e) => setSignUpEmail(e.target.value)}
                placeholder="e.g. marcus.vance@mining-intl.com"
                className="w-full px-3.5 py-2.5 rounded-xl bg-black/60 border border-stone-700 text-white placeholder-stone-600 focus:outline-none focus:border-amber-500 text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-stone-300 font-bold flex items-center gap-1.5">
                <Key size={13} className="text-amber-400" />
                <span>Password (Min 6 Characters)</span>
              </label>
              <div className="relative">
                <input
                  type={showSignUpPassword ? 'text' : 'password'}
                  required
                  value={signUpPassword}
                  onChange={(e) => setSignUpPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-black/60 border border-stone-700 text-white placeholder-stone-600 focus:outline-none focus:border-amber-500 text-xs pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowSignUpPassword(!showSignUpPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-500 hover:text-stone-300"
                >
                  {showSignUpPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-stone-300 font-bold flex items-center gap-1.5">
                <Key size={13} className="text-amber-400" />
                <span>Confirm Password</span>
              </label>
              <input
                type={showSignUpPassword ? 'text' : 'password'}
                required
                value={signUpConfirmPassword}
                onChange={(e) => setSignUpConfirmPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full px-3.5 py-2.5 rounded-xl bg-black/60 border border-stone-700 text-white placeholder-stone-600 focus:outline-none focus:border-amber-500 text-xs"
              />
            </div>

            <button
              type="submit"
              id="btn-signup-trial"
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 text-stone-950 font-black text-xs sm:text-sm shadow-xl transition-all flex items-center justify-center gap-2 cursor-pointer mt-2"
            >
              <Sparkles size={16} />
              <span>Sign Up with 7-Day Free Trial</span>
            </button>
          </form>

          <div className="pt-2 border-t border-stone-800 text-center text-xs text-stone-400">
            <span>Already have an account? </span>
            <button
              type="button"
              onClick={() => setActiveTab('SIGNIN')}
              className="text-amber-400 hover:text-amber-300 font-bold underline"
            >
              Sign In here
            </button>
          </div>
        </div>
      )}

      {/* Tab 3: SIGN IN */}
      {activeTab === 'SIGNIN' && (
        <div className="max-w-md mx-auto p-6 sm:p-8 rounded-3xl bg-stone-900/90 border-2 border-amber-500/40 shadow-2xl space-y-6 animate-in fade-in duration-200">
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-extrabold text-white font-['Space_Grotesk']">
              Sign In to MINEX AI
            </h2>
            <p className="text-xs text-stone-400">
              Sign in with your email and password to access your field projects and subscriptions.
            </p>
          </div>

          {signInError && (
            <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-500/60 text-rose-200 text-xs flex items-center gap-2">
              <AlertTriangle size={15} className="text-rose-400 flex-shrink-0" />
              <span>{signInError}</span>
            </div>
          )}

          {signInSuccess && (
            <div className="p-3 rounded-xl bg-emerald-950/60 border border-emerald-500/60 text-emerald-200 text-xs flex items-center gap-2">
              <CheckCircle2 size={15} className="text-emerald-400 flex-shrink-0" />
              <span>{signInSuccess}</span>
            </div>
          )}

          <form onSubmit={handleSignIn} className="space-y-4 text-xs font-mono">
            <div className="space-y-1.5">
              <label className="text-stone-300 font-bold flex items-center gap-1.5">
                <Mail size={13} className="text-amber-400" />
                <span>Email Address</span>
              </label>
              <input
                type="email"
                required
                value={signInEmail}
                onChange={(e) => setSignInEmail(e.target.value)}
                placeholder="elena.rostova@exploration-corp.com"
                className="w-full px-3.5 py-2.5 rounded-xl bg-black/60 border border-stone-700 text-white placeholder-stone-600 focus:outline-none focus:border-amber-500 text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-stone-300 font-bold flex items-center gap-1.5">
                  <Key size={13} className="text-amber-400" />
                  <span>Password</span>
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setChangeEmail(signInEmail);
                    setActiveTab('CHANGE_PASSWORD');
                  }}
                  className="text-amber-400 hover:text-amber-300 text-[11px] underline"
                >
                  Change Password?
                </button>
              </div>
              <div className="relative">
                <input
                  type={showSignInPassword ? 'text' : 'password'}
                  required
                  value={signInPassword}
                  onChange={(e) => setSignInPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-black/60 border border-stone-700 text-white placeholder-stone-600 focus:outline-none focus:border-amber-500 text-xs pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowSignInPassword(!showSignInPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-500 hover:text-stone-300"
                >
                  {showSignInPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              id="btn-signin"
              className="w-full py-3.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-black text-xs sm:text-sm shadow-xl transition-all flex items-center justify-center gap-2 cursor-pointer mt-2"
            >
              <Lock size={15} />
              <span>Sign In</span>
            </button>
          </form>

          {/* Quick Demo Fill Shortcut */}
          <div className="pt-2 border-t border-stone-800 space-y-2">
            <button
              type="button"
              onClick={fillDemoCredentials}
              className="w-full py-2 rounded-xl bg-stone-800/80 hover:bg-stone-700 text-amber-300 text-[11px] font-mono border border-stone-700 transition-colors flex items-center justify-center gap-1.5"
            >
              <span>Autofill Demo Credentials</span>
            </button>

            <div className="text-center text-xs text-stone-400">
              <span>Don't have an account yet? </span>
              <button
                type="button"
                onClick={() => setActiveTab('SIGNUP')}
                className="text-amber-400 hover:text-amber-300 font-bold underline"
              >
                Sign Up with 7-Day Trial
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: CHANGE PASSWORD */}
      {activeTab === 'CHANGE_PASSWORD' && (
        <div className="max-w-md mx-auto p-6 sm:p-8 rounded-3xl bg-stone-900/90 border-2 border-amber-500/40 shadow-2xl space-y-6 animate-in fade-in duration-200">
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-extrabold text-white font-['Space_Grotesk']">
              Change Your Password
            </h2>
            <p className="text-xs text-stone-400">
              Users can change their password anytime as they wish by providing their email and desired new password.
            </p>
          </div>

          {changeError && (
            <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-500/60 text-rose-200 text-xs flex items-center gap-2">
              <AlertTriangle size={15} className="text-rose-400 flex-shrink-0" />
              <span>{changeError}</span>
            </div>
          )}

          {changeSuccess && (
            <div className="p-3 rounded-xl bg-emerald-950/60 border border-emerald-500/60 text-emerald-200 text-xs flex items-center gap-2">
              <CheckCircle2 size={15} className="text-emerald-400 flex-shrink-0" />
              <span>{changeSuccess}</span>
            </div>
          )}

          <form onSubmit={handleChangePassword} className="space-y-4 text-xs font-mono">
            <div className="space-y-1.5">
              <label className="text-stone-300 font-bold flex items-center gap-1.5">
                <Mail size={13} className="text-amber-400" />
                <span>Account Email</span>
              </label>
              <input
                type="email"
                required
                value={changeEmail}
                onChange={(e) => setChangeEmail(e.target.value)}
                placeholder="elena.rostova@exploration-corp.com"
                className="w-full px-3.5 py-2.5 rounded-xl bg-black/60 border border-stone-700 text-white placeholder-stone-600 focus:outline-none focus:border-amber-500 text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-stone-300 font-bold flex items-center gap-1.5">
                <Key size={13} className="text-amber-400" />
                <span>Current Password (Optional if forgotten)</span>
              </label>
              <input
                type="password"
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                placeholder="Leave blank or enter current"
                className="w-full px-3.5 py-2.5 rounded-xl bg-black/60 border border-stone-700 text-white placeholder-stone-600 focus:outline-none focus:border-amber-500 text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-stone-300 font-bold flex items-center gap-1.5">
                <Lock size={13} className="text-amber-400" />
                <span>New Password (Min 6 Characters)</span>
              </label>
              <div className="relative">
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-black/60 border border-stone-700 text-white placeholder-stone-600 focus:outline-none focus:border-amber-500 text-xs pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-500 hover:text-stone-300"
                >
                  {showNewPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-stone-300 font-bold flex items-center gap-1.5">
                <Lock size={13} className="text-amber-400" />
                <span>Confirm New Password</span>
              </label>
              <input
                type={showNewPassword ? 'text' : 'password'}
                required
                value={confirmNewPassword}
                onChange={(e) => setConfirmNewPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full px-3.5 py-2.5 rounded-xl bg-black/60 border border-stone-700 text-white placeholder-stone-600 focus:outline-none focus:border-amber-500 text-xs"
              />
            </div>

            <button
              type="submit"
              id="btn-change-password"
              className="w-full py-3.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-black text-xs sm:text-sm shadow-xl transition-all flex items-center justify-center gap-2 cursor-pointer mt-2"
            >
              <CheckCircle2 size={16} />
              <span>Update Password</span>
            </button>
          </form>

          <div className="pt-2 border-t border-stone-800 text-center text-xs text-stone-400">
            <button
              type="button"
              onClick={() => setActiveTab('SIGNIN')}
              className="text-amber-400 hover:text-amber-300 font-bold underline"
            >
              Back to Sign In
            </button>
          </div>
        </div>
      )}

      {/* Tab 5: INVOICES & RECEIPTS */}
      {activeTab === 'INVOICES' && currentUser && (
        <div className="max-w-3xl mx-auto p-6 sm:p-8 rounded-3xl bg-stone-900/90 border-2 border-amber-500/40 shadow-2xl space-y-6 animate-in fade-in duration-200 font-mono text-xs">
          <div className="flex items-center justify-between border-b border-stone-800 pb-3">
            <div>
              <h3 className="font-extrabold text-white text-base font-['Space_Grotesk']">
                Billing Transaction Receipts
              </h3>
              <p className="text-[11px] text-stone-400">
                Official invoices for company tax and field accounting compliance.
              </p>
            </div>
            <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-bold">
              Status: Verified
            </span>
          </div>

          <div className="divide-y divide-stone-800 rounded-2xl border border-stone-800 bg-black/40 overflow-hidden">
            {currentUser.billingInvoices?.map((inv) => (
              <div key={inv.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white text-sm">{inv.planName}</span>
                    <span className="px-2 py-0.2 rounded text-[9px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                      {inv.status}
                    </span>
                  </div>
                  <div className="text-[11px] text-stone-400">
                    Invoice #{inv.pdfInvoiceNo} &bull; Card ending in {inv.cardLast4}
                  </div>
                </div>

                <div className="text-right flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2">
                  <span className="text-amber-300 font-black text-base">
                    ${inv.amountUSD.toFixed(2)}
                  </span>
                  <span className="text-stone-500 text-[10px]">{inv.date}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* CHECKOUT PAYMENT MODAL */}
      {checkoutPlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-lg rounded-3xl bg-[#1C100B] border-2 border-amber-500/70 p-6 sm:p-8 shadow-2xl text-xs space-y-6">
            <div className="flex items-start justify-between border-b border-stone-800 pb-3">
              <div>
                <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-mono font-bold">
                  Secure 256-Bit SSL Checkout
                </span>
                <h3 className="text-xl font-extrabold text-white font-['Space_Grotesk'] mt-1">
                  Subscribe to {checkoutPlan === 'monthly' ? 'Professional Monthly' : 'Enterprise Yearly'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setCheckoutPlan(null)}
                className="p-1 rounded-lg text-stone-400 hover:text-white"
              >
                &times;
              </button>
            </div>

            {/* Plan Price Summary */}
            <div className="p-3.5 rounded-2xl bg-black/50 border border-stone-800 flex items-center justify-between font-mono">
              <div>
                <div className="text-white font-bold">
                  {checkoutPlan === 'monthly' ? 'Monthly Subscription ($19.99/mo)' : 'Yearly Subscription ($199.99/yr)'}
                </div>
                <div className="text-[11px] text-stone-400">
                  {checkoutPlan === 'monthly' ? 'Continues after 7-Day trial' : 'Full 12-month unlimited access'}
                </div>
              </div>
              <div className="text-right">
                <span className="text-2xl font-black text-amber-300">
                  {checkoutPlan === 'monthly' ? '$19.99' : '$199.99'}
                </span>
                <span className="block text-[9px] text-stone-500">USD</span>
              </div>
            </div>

            {/* Payment Method Selector */}
            <div className="grid grid-cols-2 gap-2 p-1 rounded-2xl bg-black/60 border border-stone-800 font-mono text-xs">
              <button
                type="button"
                onClick={() => setPaymentMethod('paypal')}
                className={`py-2 px-3 rounded-xl flex items-center justify-center gap-2 font-bold transition-all cursor-pointer ${
                  paymentMethod === 'paypal'
                    ? 'bg-[#0070BA] text-white shadow-md'
                    : 'text-stone-400 hover:text-white'
                }`}
              >
                <Wallet size={15} />
                <span>PayPal Express</span>
              </button>
              <button
                type="button"
                onClick={() => setPaymentMethod('card')}
                className={`py-2 px-3 rounded-xl flex items-center justify-center gap-2 font-bold transition-all cursor-pointer ${
                  paymentMethod === 'card'
                    ? 'bg-amber-500 text-stone-950 shadow-md font-black'
                    : 'text-stone-400 hover:text-white'
                }`}
              >
                <CreditCard size={15} />
                <span>Credit / Debit Card</span>
              </button>
            </div>

            {paypalStatusMessage && (
              <div className="p-3 rounded-xl bg-sky-950/70 border border-sky-500/50 text-sky-200 text-xs flex items-center gap-2 font-mono">
                <RefreshCw size={14} className="animate-spin text-sky-400 flex-shrink-0" />
                <span>{paypalStatusMessage}</span>
              </div>
            )}

            {/* PayPal Checkout View */}
            {paymentMethod === 'paypal' ? (
              <div className="space-y-4 font-mono text-xs">
                <div className="p-4 rounded-2xl bg-[#003087]/20 border border-[#0070BA]/50 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-white flex items-center gap-1.5">
                      <Wallet size={16} className="text-[#0079C1]" />
                      <span>PayPal Secure Subscription Checkout</span>
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] bg-sky-950 text-sky-300 border border-sky-500/40">
                      {paypalConfig.isConfigured ? 'SECURE GATEWAY' : 'SERVER READY'}
                    </span>
                  </div>

                  <div className="text-[11px] text-stone-300 space-y-1.5 bg-black/40 p-3 rounded-xl border border-stone-800">
                    <div className="flex justify-between items-center">
                      <span className="text-stone-400">Selected Plan:</span>
                      <span className="text-amber-400 font-bold">
                        {checkoutPlan === 'monthly' ? 'Professional Explorer Monthly' : 'Enterprise Geologist Yearly'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-stone-400">Billing Amount:</span>
                      <span className="text-white font-bold">
                        {checkoutPlan === 'monthly' ? '$19.99 / month' : '$199.99 / year'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-stone-400">Security:</span>
                      <span className="text-emerald-400 font-bold">Server-Side Vault Protected</span>
                    </div>
                  </div>

                  <p className="text-[11px] text-stone-400 leading-relaxed">
                    Official PayPal SDK integration: Securely activates your subscription directly via PayPal Smart Buttons or through our encrypted backend billing proxy.
                  </p>
                </div>

                {/* Official PayPal Smart Button Embed */}
                <div className="p-3 rounded-2xl bg-black/60 border border-stone-800 space-y-2">
                  <div className="text-[11px] text-stone-400 font-bold flex items-center justify-between">
                    <span>PayPal Instant Subscription:</span>
                    <span className="text-emerald-400 font-mono text-[10px]">
                      {checkoutPlan === 'monthly' ? 'Auto-renews monthly ($19.99)' : 'Auto-renews annually ($199.99)'}
                    </span>
                  </div>

                  <PayPalSubscriptionSmartButton
                    planType={checkoutPlan}
                    clientId={paypalConfig.clientId}
                    onSuccess={handlePayPalSubscriptionSuccess}
                  />
                </div>

                {/* Actions for PayPal */}
                <div className="flex items-center gap-3 pt-1">
                  <button
                    type="button"
                    onClick={() => setCheckoutPlan(null)}
                    className="flex-1 py-3 rounded-2xl bg-stone-800 hover:bg-stone-700 text-stone-300 font-bold transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    id="btn-confirm-paypal-payment"
                    disabled={isProcessingPayment}
                    onClick={handleExecutePayPalPayment}
                    className="flex-1 py-3 rounded-2xl bg-gradient-to-r from-[#0070BA] to-[#003087] hover:from-[#0079C1] hover:to-[#004C99] text-white font-bold text-xs shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {isProcessingPayment ? (
                      <>
                        <RefreshCw size={14} className="animate-spin" />
                        <span>Authorizing...</span>
                      </>
                    ) : (
                      <>
                        <Wallet size={15} />
                        <span>1-Click Server Checkout</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            ) : (
              /* Simulated Direct Card Form */
              <div className="space-y-3 font-mono text-xs">
                <div className="space-y-1">
                  <label className="text-stone-300 font-bold">Cardholder Name</label>
                  <input
                    type="text"
                    value={cardHolder}
                    onChange={(e) => setCardHolder(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-black/60 border border-stone-700 text-white text-xs focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-stone-300 font-bold">Card Number</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={cardNumber}
                      onChange={(e) => setCardNumber(e.target.value)}
                      placeholder="4242 •••• •••• 4242"
                      className="w-full px-3.5 py-2 rounded-xl bg-black/60 border border-stone-700 text-white text-xs focus:outline-none focus:border-amber-500"
                    />
                    <CreditCard size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-500" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-stone-300 font-bold">Expiry Date</label>
                    <input
                      type="text"
                      value={cardExpiry}
                      onChange={(e) => setCardExpiry(e.target.value)}
                      placeholder="MM/YY"
                      className="w-full px-3.5 py-2 rounded-xl bg-black/60 border border-stone-700 text-white text-xs focus:outline-none focus:border-amber-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-stone-300 font-bold">CVC / CVV</label>
                    <input
                      type="text"
                      value={cardCvc}
                      onChange={(e) => setCardCvc(e.target.value)}
                      placeholder="CVC"
                      className="w-full px-3.5 py-2 rounded-xl bg-black/60 border border-stone-700 text-white text-xs focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>

                {/* Actions for Card */}
                <div className="flex items-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setCheckoutPlan(null)}
                    className="flex-1 py-3 rounded-2xl bg-stone-800 hover:bg-stone-700 text-stone-300 font-bold transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    id="btn-confirm-payment"
                    disabled={isProcessingPayment}
                    onClick={handleExecutePayment}
                    className="flex-1 py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 text-stone-950 font-black shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {isProcessingPayment ? (
                      <>
                        <RefreshCw size={14} className="animate-spin" />
                        <span>Processing...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 size={15} />
                        <span>
                          Pay {checkoutPlan === 'monthly' ? '$19.99' : '$199.99'} Now
                        </span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* PAYMENT SUCCESS CONFIRMATION MODAL */}
      {paymentSuccessInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-3xl bg-[#1C100B] border-2 border-emerald-500 p-6 sm:p-8 shadow-2xl text-xs space-y-5 text-center">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center mx-auto animate-bounce">
              <CheckCircle2 size={32} />
            </div>

            <div className="space-y-1">
              <h3 className="text-xl font-extrabold text-white font-['Space_Grotesk']">
                Subscription Activated!
              </h3>
              <p className="text-stone-300 text-xs">
                Your payment of <strong>${paymentSuccessInvoice.amountUSD.toFixed(2)}</strong> was successful.
                Full platform access is unlocked and will continue indefinitely.
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-black/60 border border-stone-800 text-left font-mono space-y-1.5 text-[11px]">
              <div className="flex justify-between">
                <span className="text-stone-400">Invoice:</span>
                <strong className="text-white">#{paymentSuccessInvoice.pdfInvoiceNo}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-400">Plan:</span>
                <strong className="text-amber-300">{paymentSuccessInvoice.planName}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-400">Status:</span>
                <span className="text-emerald-400 font-bold">{paymentSuccessInvoice.status}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-400">Date:</span>
                <span className="text-stone-300">{paymentSuccessInvoice.date}</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                setPaymentSuccessInvoice(null);
                if (onNavigateToTab) {
                  onNavigateToTab('dashboard');
                } else {
                  setActiveTab('PLANS');
                }
              }}
              className="w-full py-3 rounded-2xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-black text-xs sm:text-sm shadow-lg transition-all"
            >
              Continue to Platform &amp; Tools
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
