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
        // Fallback for development if no code present in URL params
        try {
          const userRole = await loginWithGoogle({
            state: state || undefined,
            redirect_uri: window.location.origin + '/auth/google/callback',
          });
          const path = getRoleDashboardPath(userRole);
          setRedirectPath(path);
          setIsProcessing(false);
          setShowLocationModal(true);
        } catch (err: any) {
          setErrorMsg(err?.response?.data?.detail || err?.response?.data?.message || 'Google sign in process was cancelled or failed.');
          setIsProcessing(false);
        }
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
        setErrorMsg(
          err?.response?.data?.message ||
            err?.response?.data?.detail ||
            'Google OAuth authentication failed. Please try again.'
        );
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
            <img src="/agri-logo.png" alt="AgriShield Logo" className="w-16 h-12 object-contain" />
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
