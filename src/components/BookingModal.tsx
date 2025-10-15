import { useState } from "react";
import { X, Wallet, Check, Loader2 } from "lucide-react";
import { TimeSlot } from "../types";
import { SlotChainABI } from "../../contractABI/SlotChainABI.json";

import {
  useAccount,
  useConnect,
  useWriteContract,
  useWaitForTransaction,
} from "wagmi";
import { metaMask } from "wagmi/connectors";
import { parseEther } from "viem";

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  slot: TimeSlot | null;
  date: string;
  userName: string;
  hourlyRate: string;
  walletAddress: string;
  onBookingComplete: () => void;
}

export default function BookingModal({
  isOpen,
  onClose,
  slot,
  date,
  userName,
  hourlyRate,
  walletAddress,
  onBookingComplete,
}: BookingModalProps) {
  const [isConnected, setIsConnected] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const { connectAsync } = useConnect();
  const { writeContractAsync } = useWriteContract();
  const { waitForTransaction } = useWaitForTransaction();

  if (!isOpen || !slot) return null;

  const handleConnectWallet = async () => {
    try {
      setIsProcessing(true);

      // Connect with MetaMask (wagmi v2 style)
      const result = await connectAsync({ connector: metaMask() });
      console.log("Connected account:", result.accounts[0]);
    } catch (error) {
      console.error("Error connecting wallet:", error);
      alert("Failed to connect wallet. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePayAndBook = async () => {
    if (!slot) return;
    setIsProcessing(true);

    console.log("Starting booking process for slot:", slot);
    console.log("Wallet address:", walletAddress);
    console.log("Date:", date);

    try {
      // 1️⃣ Connect wallet if not connected
      if (!isConnected) {
        const result = await connectAsync({ connector: metaMask() });
        console.log("Connected account:", result.accounts[0]);
      }

      // 2️⃣ Send payment transaction to contract
      const tx = await writeContractAsync({
        address: contractAddress as `0x${string}`,
        abi: SlotChainABI,
        functionName: "bookSlot", // adjust to your contract’s method
        args: [slot._id, date], // adjust params to match your contract
        value: parseEther(hourlyRate.toString()), // if it's a payable function
      });

      console.log("Transaction sent:", tx);

      // 3️⃣ Wait for transaction confirmation (optional but recommended)
      const receipt = await waitForTransaction({ hash: tx.hash });
      console.log("Transaction confirmed:", receipt);

      // 4️⃣ Call backend API to store booking in DB
      const res = await fetch(
        "http://localhost:5000/api/availability/bookSlot",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            walletAddress: address, // from wagmi
            date,
            slotId: slot._id, // make sure to use _id
          }),
        }
      );

      if (!res.ok) {
        const text = await res.text();
        console.error("Response not OK:", text);
        throw new Error("Failed to book slot");
      }

      const data = await res.json();
      console.log("Parsed response data:", data);

      if (!data.success) {
        throw new Error(data.message || "Booking failed");
      }

      // 5️⃣ Update UI state
      onBookingComplete();
      setIsProcessing(false);
      setIsSuccess(true);

      setTimeout(() => {
        handleClose();
      }, 2000);
    } catch (err) {
      console.error("Booking failed:", err);
      setIsProcessing(false);
      // optionally show a toast error
    }
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
          <X className="w-5 h-5 text-slate-900" />
        </button>

        {isSuccess ? (
          <div className="p-8 text-center bg-slate-900 rounded-2xl shadow-sm border border-slate-100">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-2">
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
                  {" "}
                  <Check className="w-4 h-4" /> Wallet connected successfully{" "}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
