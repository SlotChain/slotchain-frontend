import { useState } from "react";
import { Check, Loader2 } from "lucide-react";
import { TimeSlot } from "../types";
import SlotChainABI from "../../contractABI/SlotChainABI.json";
import { waitForTransactionReceipt } from "@wagmi/core";
import { useConnect, useWriteContract } from "wagmi";
import { metaMask } from "wagmi/connectors";
import erc20ABI from "../../contractABI/erc20ABI.json";
import { useToast } from "../context/ToastContext";
import { config } from "../config";

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  slot: TimeSlot | null;
  date: string;
  userName: string;
  hourlyRate: string;
  creatorAddress: string;
  onBookingComplete: () => void;
}

export default function BookingModal({
  isOpen,
  onClose,
  slot,
  date,
  userName,
  hourlyRate,
  creatorAddress,
  onBookingComplete,
}: BookingModalProps) {
  const [isConnected, setIsConnected] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const { connectAsync } = useConnect();
  const { writeContractAsync } = useWriteContract();

  const { showToast } = useToast();

  if (!isOpen || !slot) return null;

  const handlePayAndBook = async () => {
    if (!slot) return;
    setIsProcessing(true);

    console.log("Starting booking process for slot:", slot);
    console.log("creatorAddress:", creatorAddress);
    console.log("Date:", date);

    try {
      // 1️⃣ Ensure wallet is connected
      let userAddress;
      if (!isConnected) {
        const result = await connectAsync({ connector: metaMask() });
        userAddress = result.accounts[0];
        console.log("User Address:", userAddress);
      }

      // 2️⃣ Prepare values
      const slotStart = Math.floor(
        new Date(`${date}T${slot.start}:00Z`).getTime() / 1000
      );
      const slotEnd = Math.floor(
        new Date(`${date}T${slot.end}:00Z`).getTime() / 1000
      );
      const scaledHourlyRate = BigInt(
        Math.floor(Number(hourlyRate) * 1_000_000)
      ); // USDT is 6 decimals

      console.log("SlotStart", slotStart);
      console.log("slot end", slotEnd);
      const tokenAddress = import.meta.env
        .VITE_USDT_TOKEN_ADDRESS as `0x${string}`;
      const contractAddress = import.meta.env
        .VITE_SLOCTCHAIN_CONTRACT as `0x${string}`;

      const approveTx = await writeContractAsync({
        address: tokenAddress,
        abi: erc20ABI,
        functionName: "approve",
        args: [contractAddress, scaledHourlyRate],
        chainId: 11155111, // Sepolia
        gas: 1_000_000n,
      });

      console.log("Approval transaction sent:", approveTx);
      await waitForTransactionReceipt(config, { hash: approveTx });
      console.log("✅ Approval confirmed!");

      // 4️⃣ Call bookSlot on contract
      console.log("Booking slot via contract...");
      const tx = await writeContractAsync({
        address: contractAddress,
        abi: SlotChainABI,
        functionName: "bookSlot",
        args: [creatorAddress, BigInt(slotStart), BigInt(slotEnd)],
        chainId: 11155111,
        gas: 1_000_000n,
      });

      console.log("Transaction sent:", tx);
      await waitForTransactionReceipt(config, { hash: tx });
      console.log("✅ Booking confirmed on-chain");

      // 5️⃣ Sync with backend

      const res = await fetch(
        "http://localhost:5000/api/availability/bookSlot",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            creatorAddress: creatorAddress,
            date,
            slotId: slot._id,
          }),
        }
      );

      if (!res.ok) {
        const text = await res.text();
        console.error("Response not OK:", text);
        throw new Error("Failed to book slot");
      }

      const data = await res.json();
      console.log("Backend booking response:", data);

      if (!data.success) {
        throw new Error(data.message || "Booking failed");
      }

      // 6️⃣ Update UI
      onBookingComplete();
      setIsProcessing(false);
      setIsSuccess(true);
      showToast("Slot booked successfully!", "success");

      setTimeout(() => {
        handleClose();
      }, 2000);
    } catch (err) {
      console.error("❌ Booking failed:", err);
      showToast("Booking failed", "error");
      setIsProcessing(false);
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

      <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 p-2 rounded-lg hover:bg-slate-100 transition-colors"
        >
          ✕
        </button>

        {isSuccess ? (
          <div className="p-8 text-center bg-slate-900 rounded-2xl">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-2">
              Booking Confirmed!
            </h3>
            <p className="text-slate-100">
              Your slot has been successfully booked with {userName}.
            </p>
          </div>
        ) : (
          <div className="p-8 bg-slate-900 rounded-2xl text-white space-y-6">
            <div>
              <h3 className="text-2xl font-bold mb-1">Confirm Booking</h3>
              <p className="text-slate-400">
                Review details and complete payment
              </p>
            </div>

            <div className="bg-slate-800 rounded-xl p-4 border border-slate-700 space-y-3">
              <div>
                <p className="text-sm text-slate-400">Booking with</p>
                <p className="font-medium">{userName}</p>
              </div>
              <div className="border-t border-slate-700 pt-2">
                <p className="text-sm text-slate-400">Date</p>
                <p>{formatDate(date)}</p>
              </div>
              <div className="border-t border-slate-700 pt-2">
                <p className="text-sm text-slate-400">Time</p>
                <p>{slot.time}</p>
              </div>
              <div className="border-t border-slate-700 pt-2">
                <p className="text-sm text-slate-400">Price</p>
                <p className="text-xl font-bold">{hourlyRate} ETH</p>
              </div>
            </div>

            <button
              onClick={handlePayAndBook}
              disabled={isProcessing}
              className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 rounded-xl transition-colors disabled:opacity-50"
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

            {isConnected && !isProcessing && (
              <div className="mt-4 flex items-center gap-2 text-sm text-green-600 bg-green-50 rounded-lg px-4 py-3 border border-green-200">
                {" "}
                <Check className="w-4 h-4" /> Wallet connected successfully{" "}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
