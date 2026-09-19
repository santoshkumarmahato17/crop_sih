import React, { useState } from 'react';
import { MapPin, ShieldCheck, AlertTriangle } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

interface LocationPermissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const LocationPermissionModal: React.FC<LocationPermissionModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { updateUserLocation } = useAuth();
  const [isRequesting, setIsRequesting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleAllowLocation = () => {
    setIsRequesting(true);
    setErrorMessage(null);

    if (!navigator.geolocation) {
      setErrorMessage('Geolocation is not supported by your current browser.');
      setIsRequesting(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          await updateUserLocation(latitude, longitude);
          setIsRequesting(false);
          onSuccess?.();
          onClose();
        } catch (err) {
          setIsRequesting(false);
          setErrorMessage('Could not update backend with location coordinates.');
        }
      },
      (error) => {
        setIsRequesting(false);
        switch (error.code) {
          case error.PERMISSION_DENIED:
            setErrorMessage(
              'Location permission was denied. You can enable it anytime in Account Settings.'
            );
            break;
          case error.POSITION_UNAVAILABLE:
            setErrorMessage('Location position unavailable. Please try again later.');
            break;
          case error.TIMEOUT:
            setErrorMessage('Location request timed out. Please try again.');
            break;
          default:
            setErrorMessage('An unexpected location error occurred.');
            break;
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  };

  const handleNotNow = () => {
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-transparent backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md p-6 sm:p-8 rounded-3xl bg-white dark:bg-surface-darkCard border border-agri-200/50 dark:border-agri-700/30 shadow-2xl space-y-6 text-center animate-scale-in">
        <div className="inline-flex p-3 rounded-2xl bg-agri-500/10 dark:bg-agri-500/20 text-agri-600 dark:text-accent-lime border border-agri-500/30 shadow-inner">
          <MapPin className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <h2 className="text-xl font-black tracking-tight text-agri-900 dark:text-white font-display">
            Location Permission Required
          </h2>
          <p className="text-xs text-agri-600 dark:text-agri-300 font-medium leading-relaxed">
            AGRI SHIELD needs your location to provide local crop-health alerts, weather information and farm-level recommendations.
          </p>
        </div>

        {errorMessage && (
          <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-500/30 text-rose-700 dark:text-rose-300 text-xs font-semibold flex items-center gap-2 text-left">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <div className="p-3.5 rounded-2xl bg-agri-50/70 dark:bg-agri-900/40 border border-agri-200/40 dark:border-agri-700/20 text-left flex items-start gap-2.5 text-[11px] text-agri-700 dark:text-agri-300 font-medium">
          <ShieldCheck className="w-4 h-4 text-agri-600 dark:text-accent-lime flex-shrink-0 mt-0.5" />
          <span>
            Your coordinates are used strictly for local microclimate risk forecasting and are never publicly shared.
          </span>
        </div>

        <div className="space-y-2.5 pt-2">
          <button
            type="button"
            onClick={handleAllowLocation}
            disabled={isRequesting}
            className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-agri-500 to-agri-600 hover:from-agri-600 hover:to-agri-700 active:scale-95 text-white font-black text-xs transition-all shadow-lg shadow-agri-500/25 flex items-center justify-center gap-2"
          >
            {isRequesting ? (
              <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
            ) : (
              <>
                <MapPin className="w-4 h-4" />
                <span>Allow Location</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleNotNow}
            disabled={isRequesting}
            className="w-full py-2.5 rounded-2xl bg-transparent hover:bg-agri-100/50 dark:hover:bg-agri-800/40 text-agri-600 dark:text-agri-300 font-bold text-xs transition"
          >
            Deny
          </button>
        </div>
      </div>
    </div>
  );
};
