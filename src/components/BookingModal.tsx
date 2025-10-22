import { useState } from 'react';
import { Check, Loader2, Mail } from 'lucide-react';
import { TimeSlot } from '../types';
import SlotChainABI from '../../contractABI/SlotChainABI.json';
import { waitForTransactionReceipt } from '@wagmi/core';
import { decodeEventLog } from 'viem';
import type { Abi, Hex } from 'viem';
import { useConnect, useWriteContract } from 'wagmi';
import { metaMask } from 'wagmi/connectors';
import erc20ABI from '../../contractABI/erc20ABI.json';
import { useToast } from '../context/ToastContext';
import { config } from '../config';
import moment from 'moment-timezone';

const API_BASE_URL =
  (import.meta.env.VITE_BACKEND_API_URL as string | undefined) ??
  'http://localhost:5000';

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  slot: TimeSlot | null;
  date: string;
  userName: string;
  hourlyRate: string;
  creatorAddress: string;
  onBookingComplete: () => void;
  creatorEmail: string;
  creatorName: string;
  creatorTimezone: string;
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
  creatorEmail,
  creatorName,
  creatorTimezone,
}: BookingModalProps) {
  const [isConnected, setIsConnected] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [email, setEmail] = useState('');
  const [emailTouched, setEmailTouched] = useState(false);
  const { connectAsync } = useConnect();
  const { writeContractAsync } = useWriteContract();

  const { showToast } = useToast();

  if (!isOpen || !slot || !date) return null;

  const handlePayAndBook = async () => {
    if (!slot) return;
    setIsProcessing(true);

    try {
      // 1️⃣ Ensure wallet is connected
      let userAddress;
      if (!isConnected) {
        const result = await connectAsync({ connector: metaMask() });
        userAddress = result.accounts[0];
        setIsConnected(true);
      }

      // 2️⃣ Prepare values
      const tz = creatorTimezone || 'UTC';
      const slotStartMoment = moment.tz(
        `${date} ${slot.start}`,
        'YYYY-MM-DD HH:mm',
        tz,
      );
      const slotEndMoment = moment.tz(
        `${date} ${slot.end}`,
        'YYYY-MM-DD HH:mm',
        tz,
      );

      const slotStart = Math.floor(
        slotStartMoment.clone().utc().valueOf() / 1000,
      );
      const slotEnd = Math.floor(slotEndMoment.clone().utc().valueOf() / 1000);
      const scaledHourlyRate = BigInt(
        Math.floor(Number(hourlyRate) * 1_000_000),
      ); // USDT is 6 decimals

      const tokenAddress = import.meta.env
        .VITE_USDT_TOKEN_ADDRESS as `0x${string}`;
      const contractAddress = import.meta.env
        .VITE_SLOCTCHAIN_CONTRACT as `0x${string}`;

      const approveTx = await writeContractAsync({
        address: tokenAddress,
        abi: erc20ABI,
        functionName: 'approve',
        args: [contractAddress, scaledHourlyRate],
        chainId: 11155111, // Sepolia
        gas: 1_000_000n,
      });

      await waitForTransactionReceipt(config, { hash: approveTx });

      // 4️⃣ Call bookSlot on contract

      const tx = await writeContractAsync({
        address: contractAddress,
        abi: SlotChainABI,
        functionName: 'bookSlot',
        args: [creatorAddress, BigInt(slotStart), BigInt(slotEnd)],
        chainId: 11155111,
        gas: 1_000_000n,
      });

      const receipt = await waitForTransactionReceipt(config, { hash: tx });

      let mintedTokenId: bigint | null = null;
      for (const log of receipt.logs) {
        try {
          const decoded = decodeEventLog({
            abi: SlotChainABI as Abi,
            data: log.data,
            topics: log.topics as readonly Hex[],
          });
          if (decoded.eventName === 'SlotBooked' && decoded.args) {
            const args = decoded.args as Record<string, unknown>;
            const tokenValue = args.tokenId as bigint | undefined;
            if (typeof tokenValue === 'bigint') {
              mintedTokenId = tokenValue;
              break;
            }
          }
        } catch (decodeError) {
          // Ignore logs that do not match SlotBooked
          console.debug('Log decode skipped', decodeError);
        }
      }

      if (mintedTokenId === null) {
        throw new Error('Unable to determine minted booking tokenId.');
      }

      // 5️⃣ Sync with backend

      const res = await fetch(`${API_BASE_URL}/api/availability/bookSlot`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          creatorAddress: creatorAddress,
          date,
          slotId: slot._id,
          buyerEmail: email,
          buyerName: null,
          creatorName: userName,
          tokenId: mintedTokenId.toString(),
        }),
      });

      if (!res.ok) {
        const text = await res.text();
        console.error('Response not OK:', text);
        throw new Error('Failed to book slot');
      }

      const data = await res.json();

      if (!data.success) {
        throw new Error(data.message || 'Booking failed');
      }

      // 6️⃣ Update UI
      onBookingComplete();
      setIsProcessing(false);
      setIsSuccess(true);
      showToast('Slot booked successfully!', 'success');

      setTimeout(() => {
        handleClose();
      }, 2000);
    } catch (err) {
      console.error('❌ Booking failed:', err);
      showToast('Booking failed', 'error');
      setIsProcessing(false);
    }
  };

  const handleClose = () => {
    setIsConnected(false);
    setIsProcessing(false);
    setIsSuccess(false);
    setEmail('');
    setEmailTouched(false);
    onClose();
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const emailError =
    emailTouched && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
      ? 'Enter a valid email address'
      : '';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={handleClose}
      />

      <div className="relative bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 border border-white/20 rounded-3xl shadow-[0_20px_60px_rgba(15,23,42,0.45)] max-w-lg w-full overflow-hidden">
        <button
          onClick={handleClose}
          className="absolute top-5 right-5 p-2 rounded-lg hover:bg-white/10 transition-colors text-white"
        >
          ✕
        </button>

        {isSuccess ? (
          <div className="p-10 text-center bg-gradient-to-b from-slate-900 to-slate-950 text-white">
            <div className="w-16 h-16 bg-green-500/10 border border-green-400/40 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="w-8 h-8 text-green-400" />
            </div>
            <h3 className="text-3xl font-bold mb-2">Booking Confirmed!</h3>
            <p className="text-slate-300">
              You’re all set for your session with {userName}.
            </p>
          </div>
        ) : (
          <div className="p-10 text-white space-y-7">
            <div>
              <h3 className="text-3xl font-semibold mb-2">Confirm Booking</h3>
              <p className="text-slate-400 text-sm tracking-wide uppercase">
                Review details and complete payment
              </p>
            </div>

            <div className="bg-slate-900/60 rounded-2xl p-6 border border-white/10 space-y-4 shadow-inner">
              <div>
                <p className="text-xs text-slate-400 uppercase tracking-[0.2em]">
                  Booking with
                </p>
                <p className="font-medium text-lg mt-1">{userName}</p>
              </div>
              <div className="border-t border-white/10 pt-4">
                <p className="text-xs text-slate-400 uppercase tracking-[0.2em]">
                  Date
                </p>
                <p>{formatDate(date)}</p>
              </div>
              <div className="border-t border-white/10 pt-4">
                <p className="text-xs text-slate-400 uppercase tracking-[0.2em]">
                  Time
                </p>
                <p>{slot.time}</p>
              </div>
              <div className="border-t border-white/10 pt-4">
                <p className="text-xs text-slate-400 uppercase tracking-[0.2em]">
                  Price
                </p>
                <p className="text-2xl font-bold text-white">
                  {hourlyRate} USDT
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <label
                htmlFor="booking-email"
                className="text-sm text-slate-300 font-medium"
              >
                Contact Email
              </label>
              <div className="relative">
                <input
                  id="booking-email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onBlur={() => setEmailTouched(true)}
                  className="w-full bg-white text-slate-900 rounded-xl py-3 pl-11 pr-4 border border-white/80 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/40 transition-all"
                />
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              </div>
              {emailError && (
                <p className="text-sm text-red-400">{emailError}</p>
              )}
            </div>

            <button
              onClick={handlePayAndBook}
              disabled={isProcessing || !email || !!emailError}
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 hover:from-blue-400 hover:via-indigo-400 hover:to-purple-400 text-white font-semibold py-4 rounded-2xl transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-blue-500/20"
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
              <div className="mt-4 flex items-center gap-2 text-sm text-green-500 bg-green-500/10 rounded-lg px-4 py-3 border border-green-500/30">
                <Check className="w-4 h-4" /> Wallet connected successfully
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
