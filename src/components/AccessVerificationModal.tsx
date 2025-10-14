import { useEffect, useState } from "react";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";

interface AccessVerificationModalProps {
  isOpen: boolean;
  isVerifying: boolean;
  hasAccess: boolean | null;
  onRedirect: () => void;
  onRetry: () => void;
}

export default function AccessVerificationModal({
  isOpen,
  isVerifying,
  hasAccess,
  onRedirect,
  onRetry,
}: AccessVerificationModalProps) {
  const [countdown, setCountdown] = useState(3);

  useEffect(() => {
    if (hasAccess === true) {
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            onRedirect();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [hasAccess, onRedirect]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      {/* bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden transition-colors */}

      <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="p-8 text-center">
          {isVerifying && (
            <>
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
              </div>
              <h3 className="text-2xl font-bold text-slate-100 mb-2">
                Verifying Access
              </h3>
              <p className="text-slate-100">
                Checking your wallet permissions on-chain...
              </p>
            </>
          )}

          {!isVerifying && hasAccess === true && (
            <>
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-2xl font-bold text-slate-100 mb-2">
                Access Verified!
              </h3>
              <p className="text-slate-100 mb-4">
                You will be redirected to your meeting...
              </p>
              <div className="text-4xl font-bold text-blue-600">
                {countdown}
              </div>
            </>
          )}

          {!isVerifying && hasAccess === false && (
            <>
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <XCircle className="w-8 h-8 text-red-600" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-2">
                Access Denied
              </h3>
              <p className="text-slate-100 mb-6">
                You do not have access to this meeting. Please check your wallet
                or contact the meeting organizer.
              </p>
              <div className="space-y-3">
                <button
                  onClick={onRetry}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-xl transition-colors"
                >
                  Try Again
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
