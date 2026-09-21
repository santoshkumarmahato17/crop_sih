import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AlertCircle } from 'lucide-react';
import { useAuth, getRoleDashboardPath } from '@/context/AuthContext';
import { LocationPermissionModal } from '@/components/common/LocationPermissionModal';

export const GoogleCallbackPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { loginWithGoogle, showLocationModal, setShowLocationModal } = useAuth();

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(true);
  const [redirectPath, setRedirectPath] = useState<string>('/farmer/dashboard');

  const extractErrorMessage = (err: any, fallback: string): string => {
    if (!err.response) {
      return 'Unable to connect to AGRI SHIELD backend server (http://localhost:8001). Please ensure the backend server is running.';
    }
    const data = err.response.data;
    if (typeof data?.detail === 'string' && data.detail.trim()) {
      return data.detail;
    }
    if (typeof data?.message === 'string' && data.message.trim() && data.message !== 'HTTP Error') {
      return data.message;
    }
    if (Array.isArray(data?.detail)) {
      return data.detail.map((e: any) => e.msg || e.message || String(e)).join(', ');
    }
    if (typeof data?.message === 'string' && data.message.trim()) {
      return data.message;
    }
    return fallback;
  };

  useEffect(() => {
    const handleGoogleCallback = async () => {
      const code = searchParams.get('code');
      const state = searchParams.get('state');
      const errorParam = searchParams.get('error');
      const errorDesc = searchParams.get('error_description');

      if (errorParam) {
        setErrorMsg(errorDesc || 'Google sign in process was cancelled or access was denied.');
        setIsProcessing(false);
        return;
      }

      if (!code && !searchParams.get('id_token')) {
        setErrorMsg('Google OAuth authorization code or ID token was not received from Google. Please initiate sign in from the login page.');
        setIsProcessing(false);
        return;
      }


      try {
        const userRole = await loginWithGoogle({
          code: code || undefined,
          state: state || undefined,
          redirect_uri: window.location.origin + '/auth/google/callback',
        });
        const path = getRoleDashboardPath(userRole);
        setRedirectPath(path);
        setIsProcessing(false);
        setShowLocationModal(true);
      } catch (err: any) {
        setErrorMsg(extractErrorMessage(err, 'Google OAuth authentication failed. Please try again.'));
        setIsProcessing(false);
      }
    };

    handleGoogleCallback();
  }, []);


  const handleModalClose = () => {
    setShowLocationModal(false);
    navigate(redirectPath, { replace: true });
  };

  return (
    <>
      <div className="w-full max-w-md p-8 sm:p-9 rounded-3xl bg-white/95 dark:bg-surface-darkCard/90 border border-agri-200/40 dark:border-agri-700/30 shadow-2xl backdrop-blur-2xl space-y-6 text-center animate-scale-in">
        {/* Brand Header */}
        <div className="space-y-2">
          <div className="inline-flex p-2 rounded-2xl bg-white dark:bg-agri-900/60 border border-agri-200/50 dark:border-agri-700/30 shadow-md">
            <img src="/kisan-sathi-logo.png" alt="Kisan Sathi Logo" className="w-16 h-12 object-contain" />
          </div>
          <h1 className="text-xl font-black tracking-tight text-agri-900 dark:text-white font-display">
            Authenticating with Google
          </h1>
          <p className="text-xs text-agri-600/70 dark:text-agri-400/60 font-medium">
            AGRI SHIELD Precision Security Verification
          </p>
        </div>

        {isProcessing && (
          <div className="py-8 space-y-3">
            <div className="animate-spin w-8 h-8 border-3 border-agri-500 border-t-transparent rounded-full mx-auto" />
            <p className="text-xs font-bold text-agri-700 dark:text-agri-300">
              Verifying Google OAuth 2.0 Identity Token...
            </p>
          </div>
        )}

        {errorMsg && (
          <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-500/30 text-rose-700 dark:text-rose-300 text-xs font-semibold space-y-3">
            <div className="flex items-center justify-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
            <button
              type="button"
              onClick={() => navigate('/login', { replace: true })}
              className="px-4 py-2 rounded-xl bg-rose-600 text-white font-bold text-xs hover:bg-rose-700 transition"
            >
              Return to Login
            </button>
          </div>
        )}
      </div>

      {/* Location Permission Modal after Google Auth */}
      <LocationPermissionModal
        isOpen={showLocationModal}
        onClose={handleModalClose}
        onSuccess={() => {
          setShowLocationModal(false);
          navigate(redirectPath, { replace: true });
        }}
      />
    </>
  );
};
