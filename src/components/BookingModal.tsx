import { useState } from "react";
import { X, Wallet, Check, Loader2 } from "lucide-react";
import { TimeSlot } from "../types";

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  slot: TimeSlot | null;
  date: string;
  userName: string;
  hourlyRate: string;
  onBookingComplete: () => void;
}

export default function BookingModal({
  isOpen,
  onClose,
  slot,
  date,
  userName,
  hourlyRate,
  onBookingComplete,
}: BookingModalProps) {
  const [isConnected, setIsConnected] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen || !slot) return null;

  const handleConnectWallet = () => {
    setIsProcessing(true);
    setTimeout(() => {
      setIsConnected(true);
      setIsProcessing(false);
    }, 1500);
  };

  const handlePayAndBook = () => {
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      setIsSuccess(true);
      setTimeout(() => {
        onBookingComplete();
        handleClose();
      }, 2000);
    }, 2000);
  };

  const handleClose = () => {
    setIsConnected(false);
    setIsProcessing(false);
    setIsSuccess(false);
    onClose();
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={handleClose}
      />

      <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in duration-200">
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 p-2 rounded-lg hover:bg-slate-100 transition-colors"
        >
          <X className="w-5 h-5 text-slate-100" />
        </button>

        {isSuccess ? (
          <div className="p-8 text-center bg-slate-900 rounded-2xl shadow-sm border border-slate-100">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-2xl font-bold text-slate-900 mb-2">
              Booking Confirmed!
            </h3>
            <p className="text-slate-100">
              Your slot has been successfully booked with {userName}
            </p>
          </div>
        ) : (
          <>
            <div className="bg-gradient-to-r from-slate-900 to-slate-900 px-8 py-6">
              <h3 className="text-2xl font-bold text-white mb-1">
                Confirm Booking
              </h3>
              <p className="text-slate-100">
                Review details and complete payment
              </p>
            </div>

            <div className="p-8 bg-slate-800">
              <div className="bg-slate-900 rounded-xl p-6 mb-6 border border-slate-100">
                <div className="space-y-4">
                  <div>
                    <div className="text-sm font-medium text-slate-100 mb-1">
                      Booking with
                    </div>
                    <div className="text-lg font-semibold text-slate-100">
                      {userName}
                    </div>
                  </div>
                  <div className="border-t border-slate-100 pt-4">
                    <div className="text-sm font-medium text-slate-100 mb-1">
                      Date
                    </div>
                    <div className="text-base font-medium text-slate-100">
                      {formatDate(date)}
                    </div>
                  </div>
                  <div className="border-t border-slate-100 pt-4">
                    <div className="text-sm font-medium text-slate-100 mb-1">
                      Time
                    </div>
                    <div className="text-base font-medium text-slate-100">
                      {slot.time}
                    </div>
                  </div>
                  <div className="border-t border-slate-100 pt-4">
                    <div className="text-sm font-medium text-slate-100 mb-1">
                      Price
                    </div>
                    <div className="text-2xl font-bold text-slate-100">
                      {hourlyRate}
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                {!isConnected ? (
                  <button
                    onClick={handleConnectWallet}
                    disabled={isProcessing}
                    className="w-full flex items-center justify-center gap-2 bg-slate-900 hover:bg-blue-900 text-white font-semibold py-4 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Connecting...
                      </>
                    ) : (
                      <>
                        <Wallet className="w-5 h-5" />
                        Connect Wallet
                      </>
                    )}
                  </button>
                ) : (
                  <button
                    onClick={handlePayAndBook}
                    disabled={isProcessing}
                    className="w-full flex items-center justify-center gap-2 bg-slate-900 hover:bg-blue-900 text-white font-semibold py-4 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Processing Payment...
                      </>
                    ) : (
                      <>
                        <Check className="w-5 h-5" />
                        Pay & Book
                      </>
                    )}
                  </button>
                )}

                <button
                  onClick={handleClose}
                  className="w-full text-slate-100 hover:text-slate-900 font-medium py-3 transition-colors"
                >
                  Cancel
                </button>
              </div>

              {isConnected && !isProcessing && (
                <div className="mt-4 flex items-center gap-2 text-sm text-green-600 bg-green-50 rounded-lg px-4 py-3 border border-green-200">
                  <Check className="w-4 h-4" />
                  Wallet connected successfully
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
