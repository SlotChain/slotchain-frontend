import { useState, useEffect, useCallback } from 'react';
import { LogOut, Video, Users, Calendar, Loader2 } from 'lucide-react';
import { useAccount, useSignMessage } from 'wagmi';
import { readContract } from '@wagmi/core';
import SlotChainABI from '../../contractABI/SlotChainABI.json';
import { config } from '../config';
import { formatAddress } from '../utils/mockWeb3';
import { backendUrl } from '../utils/backend';

interface MeetingProps {
  onLeave: () => void;
}

const SLOTCHAIN_CONTRACT_ADDRESS = (import.meta.env.VITE_SLOCTCHAIN_CONTRACT ??
  '') as `0x${string}`;

export default function Meeting({ onLeave }: MeetingProps) {
  const { address, isConnected } = useAccount();
  const { signMessageAsync } = useSignMessage();

  const [meetingDuration, setMeetingDuration] = useState(0);
  const [meetingLink, setMeetingLink] = useState<string | null>(null);
  const [selectedTokenId, setSelectedTokenId] = useState<bigint | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchMeetingLink = useCallback(
    async (account: `0x${string}`, tokenId: bigint) => {
      if (!signMessageAsync) {
        throw new Error('Wallet signing is not available.');
      }

      const buildError = async (response: Response, fallback: string) => {
        let detail: string | undefined;
        try {
          const parsed = await response.clone().json();
          detail = parsed?.message || parsed?.error;
        } catch {
          try {
            detail = await response.clone().text();
          } catch {
            detail = undefined;
          }
        }
        const errorToThrow = new Error(detail || fallback || 'Request failed.');
        (errorToThrow as Error & { status?: number }).status = response.status;
        return errorToThrow;
      };

      const nonceResponse = await fetch(backendUrl('/meetings/nonce'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          walletAddress: account,
          tokenId: tokenId.toString(),
        }),
      });

      if (!nonceResponse.ok) {
        throw await buildError(
          nonceResponse,
          'Failed to retrieve verification challenge (nonce).',
        );
      }

      const noncePayload = (await nonceResponse.json()) as { nonce: string };

      if (!noncePayload.nonce) {
        throw new Error('Nonce response did not include a nonce value.');
      }

      const signature = await signMessageAsync({ message: noncePayload.nonce });

      const accessResponse = await fetch(backendUrl('/meetings/access'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          walletAddress: account,
          tokenId: tokenId.toString(),
          signature,
        }),
      });

      if (!accessResponse.ok) {
        throw await buildError(
          accessResponse,
          'Failed to retrieve meeting access.',
        );
      }

      const accessPayload = (await accessResponse.json()) as {
        joinUrl?: string;
      };

      if (!accessPayload.joinUrl) {
        throw new Error('Meeting access response missing joinUrl.');
      }

      return accessPayload.joinUrl;
    },
    [signMessageAsync],
  );

  const loadActiveBooking = useCallback(async () => {
    if (!SLOTCHAIN_CONTRACT_ADDRESS) {
      setError('SlotChain contract address is not configured.');
      return;
    }

    if (!address || !isConnected) {
      return;
    }

    setIsLoading(true);
    setError(null);
    setMeetingLink(null);
    setSelectedTokenId(null);
    setMeetingDuration(0);

    try {
      const normalizedAccount = address as `0x${string}`;
      const activeTokenId = (await readContract(config, {
        address: SLOTCHAIN_CONTRACT_ADDRESS,
        abi: SlotChainABI,
        functionName: 'activeBookingOf',
        account: normalizedAccount,
      })) as bigint;

      if (!activeTokenId || activeTokenId === 0n) {
        setError('No active booking found for this wallet.');
        return;
      }

      setSelectedTokenId(activeTokenId);
      const link = await fetchMeetingLink(normalizedAccount, activeTokenId);
      setMeetingLink(link);
    } catch (loadError) {
      console.error('Failed to load meeting details:', loadError);
      setError(
        loadError instanceof Error
          ? loadError.message
          : 'Unable to load meeting details.',
      );
    } finally {
      setIsLoading(false);
    }
  }, [address, fetchMeetingLink, isConnected]);

  useEffect(() => {
    if (isConnected && address) {
      void loadActiveBooking();
    } else {
      setMeetingLink(null);
      setSelectedTokenId(null);
      setMeetingDuration(0);
    }
  }, [address, isConnected, loadActiveBooking]);

  useEffect(() => {
    if (!meetingLink) return;

    const timer = setInterval(() => {
      setMeetingDuration((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [meetingLink]);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs
      .toString()
      .padStart(2, '0')}`;
  };

  const displayAddress = address ? formatAddress(address) : 'Not connected';
  const meetingStatus = meetingLink
    ? 'Meeting in progress'
    : isLoading
      ? 'Checking booking...'
      : error
        ? 'Access not verified'
        : isConnected
          ? 'Waiting for meeting link'
          : 'Wallet not connected';

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col">
      <header className="bg-slate-800 border-b border-slate-700 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
                <Calendar className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold text-white">SlotChain</span>
            </div>

            <div className="h-8 w-px bg-slate-600"></div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-slate-300">
                <Video
                  className={`w-5 h-5 ${meetingLink ? 'text-green-400' : 'text-slate-400'}`}
                />
                <span className="text-sm font-medium">{meetingStatus}</span>
              </div>
              <div className="flex items-center gap-2 text-slate-400">
                <Users className="w-4 h-4" />
                <span className="text-sm">3 participants</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="bg-slate-700 rounded-lg px-4 py-2 flex items-center gap-3">
              <div
                className={`w-2 h-2 rounded-full ${meetingLink ? 'bg-green-400 animate-pulse' : 'bg-slate-500'}`}
              ></div>
              <span className="text-white font-mono text-sm">
                {displayAddress}
              </span>
            </div>

            <div className="bg-slate-700 rounded-lg px-4 py-2 text-slate-300 font-mono text-sm">
              {formatDuration(meetingDuration)}
            </div>

            <button
              onClick={onLeave}
              className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white font-semibold px-5 py-2.5 rounded-lg transition-colors disabled:opacity-50"
              disabled={!isConnected}
            >
              <LogOut className="w-4 h-4" />
              Leave Meeting
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 p-6 bg-slate-900">
        <div className="max-w-7xl mx-auto h-full">
          <div className="bg-slate-800 rounded-2xl overflow-hidden shadow-2xl h-full border border-slate-700 relative">
            <iframe
              src={meetingLink ?? 'about:blank'}
              className="w-full h-full rounded-2xl"
              allow="camera; microphone; display-capture"
              title="Meeting Room"
            />

            {!meetingLink && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/85 text-center gap-4 px-6">
                {isLoading ? (
                  <>
                    <Loader2 className="w-10 h-10 text-blue-400 animate-spin" />
                    <p className="text-slate-300 text-sm sm:text-base">
                      Verifying your booking on-chain...
                    </p>
                  </>
                ) : error ? (
                  <>
                    <p className="text-slate-100 text-base font-medium">
                      {error}
                    </p>
                    {isConnected && (
                      <button
                        onClick={() => void loadActiveBooking()}
                        className="bg-blue-600 hover:bg-blue-500 text-white font-semibold px-5 py-2.5 rounded-lg transition-colors"
                      >
                        Retry
                      </button>
                    )}
                  </>
                ) : !isConnected ? (
                  <p className="text-slate-100 text-base font-medium">
                    Connect your wallet to join the meeting.
                  </p>
                ) : (
                  <p className="text-slate-300 text-base">
                    Waiting for your meeting to start. We&apos;ll load the join
                    link as soon as it becomes active.
                  </p>
                )}
              </div>
            )}

            {meetingLink && (
              <div className="absolute top-0 left-0 right-0 p-6 bg-gradient-to-b from-black/50 to-transparent pointer-events-none">
                <div className="flex items-center justify-between">
                  <div className="bg-black/40 backdrop-blur-sm rounded-lg px-4 py-2 border border-white/10">
                    <p className="text-white text-sm font-medium">
                      Token #{selectedTokenId?.toString() ?? '-'}
                    </p>
                  </div>
                  <div className="bg-red-600/90 backdrop-blur-sm rounded-lg px-3 py-1.5 flex items-center gap-2">
                    <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                    <span className="text-white text-xs font-semibold">
                      LIVE
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      <footer className="bg-slate-800 border-t border-slate-700 px-6 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-center">
          <p className="text-slate-400 text-sm">
            Secured by blockchain • Access verified on-chain
          </p>
        </div>
      </footer>
    </div>
  );
}
