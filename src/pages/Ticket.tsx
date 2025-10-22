import { useCallback, useEffect, useRef, useState } from 'react';
import { Wallet, Calendar, Shield, ChevronRight } from 'lucide-react';
import { useAccount, useConnect, useSignMessage } from 'wagmi';
import { readContract } from '@wagmi/core';
import SlotChainABI from '../../contractABI/SlotChainABI.json';
import { config } from '../config';
import AccessVerificationModal from '../components/AccessVerificationModal';

interface TicketProps {
  onAccessGranted: () => void;
  onLaunchApp?: () => void;
}

const SLOTCHAIN_CONTRACT_ADDRESS = (import.meta.env.VITE_SLOCTCHAIN_CONTRACT ??
  '') as `0x${string}`;
const SEPOLIA_CHAIN_ID = 11155111;

const logTicket = (...args: unknown[]) => {};

const logTicketError = (...args: unknown[]) => {
  // eslint-disable-next-line no-console
  console.error('[Ticket]', ...args);
};

export function Ticket({ onAccessGranted }: TicketProps) {
  const { address, isConnected } = useAccount();
  const { connectAsync, connectors, isPending: isConnecting } = useConnect();
  const { signMessageAsync } = useSignMessage();

  const [connectedAddress, setConnectedAddress] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [meetingLink, setMeetingLink] = useState<string | null>(null);
  const [selectedTokenId, setSelectedTokenId] = useState<bigint | null>(null);
  const [accessError, setAccessError] = useState<string | null>(null);
  const autoCheckedAddressRef = useRef<string | null>(null);

  const fetchMeetingLink = useCallback(
    async (account: `0x${string}`, tokenId: bigint) => {
      logTicket('fetchMeetingLink:start', {
        account,
        tokenId: tokenId.toString(),
      });
      if (!signMessageAsync) {
        throw new Error('Wallet signing is not available.');
      }

      const apiBase =
        (import.meta.env.VITE_MEETING_API_URL as string | undefined) ??
        'http://localhost:5000';

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
        const error = new Error(detail || fallback || 'Request failed.');
        (error as Error & { status?: number }).status = response.status;
        return error;
      };

      logTicket('fetchMeetingLink:requestNonce', { apiBase });
      const nonceResponse = await fetch(`${apiBase}/api/meetings/nonce`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          walletAddress: account,
          tokenId: tokenId.toString(),
        }),
      });

      if (!nonceResponse.ok) {
        logTicketError('fetchMeetingLink:nonceFailed', nonceResponse.status);
        throw await buildError(
          nonceResponse,
          'Failed to retrieve verification challenge (nonce).',
        );
      }

      const noncePayload = (await nonceResponse.json()) as {
        nonce: string;
      };

      logTicket('fetchMeetingLink:nonceReceived', noncePayload);

      if (!noncePayload.nonce) {
        throw new Error('Nonce response did not include a nonce value.');
      }

      const signature = await signMessageAsync({
        message: noncePayload.nonce,
      });

      logTicket('fetchMeetingLink:signatureGenerated');

      const accessResponse = await fetch(`${apiBase}/api/meetings/access`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          walletAddress: account,
          tokenId: tokenId.toString(),
          signature,
        }),
      });

      if (!accessResponse.ok) {
        logTicketError('fetchMeetingLink:accessFailed', accessResponse.status);
        throw await buildError(
          accessResponse,
          'Failed to retrieve meeting access.',
        );
      }

      const accessPayload = (await accessResponse.json()) as {
        joinUrl?: string;
      };

      logTicket('fetchMeetingLink:accessPayload', accessPayload);

      if (!accessPayload.joinUrl) {
        throw new Error('Meeting access response missing joinUrl.');
      }

      logTicket('fetchMeetingLink:success');
      return accessPayload.joinUrl;
    },
    [signMessageAsync],
  );

  const verifyAccess = useCallback(
    async (account: string) => {
      logTicket('verifyAccess:start', { account });
      if (!SLOTCHAIN_CONTRACT_ADDRESS) {
        logTicketError('verifyAccess:noContractAddress');
        setShowModal(true);
        setHasAccess(false);
        return;
      }

      setShowModal(true);
      setIsVerifying(true);
      setHasAccess(null);
      setMeetingLink(null);
      setAccessError(null);
      setSelectedTokenId(null);

      try {
        const normalizedAccount = account as `0x${string}`;
        logTicket('verifyAccess:readActiveBooking:start', {
          normalizedAccount,
        });
        const tokenId = (await readContract(config, {
          address: SLOTCHAIN_CONTRACT_ADDRESS,
          abi: SlotChainABI,
          functionName: 'activeBookingOf',
          args: [normalizedAccount],
          account: normalizedAccount,
        })) as bigint;

        logTicket('verifyAccess:readActiveBooking:result', tokenId.toString());

        logTicket('verifyAccess:tokenCandidate', tokenId.toString());

        const nowSeconds = BigInt(Math.floor(Date.now() / 1000));

        const booking = (await readContract(config, {
          address: SLOTCHAIN_CONTRACT_ADDRESS,
          abi: SlotChainABI,
          functionName: 'bookings',
          args: [tokenId],
        })) as
          | {
              creator: `0x${string}`;
              startsAt: bigint;
              expiresAt: bigint;
              amount: bigint;
            }
          | readonly [string, bigint, bigint, bigint];

        const startsAt =
          typeof booking === 'object' && 'startsAt' in booking
            ? booking.startsAt
            : Array.isArray(booking)
              ? (booking[1] as bigint)
              : 0n;
        const expiresAt =
          typeof booking === 'object' && 'expiresAt' in booking
            ? booking.expiresAt
            : Array.isArray(booking)
              ? (booking[2] as bigint)
              : 0n;

        if (expiresAt === 0n || expiresAt <= nowSeconds) {
          logTicket('verifyAccess:bookingExpiredOrMissing', {
            tokenId: tokenId.toString(),
            startsAt: startsAt.toString(),
            expiresAt: expiresAt.toString(),
            nowSeconds: nowSeconds.toString(),
          });
          setHasAccess(false);
          return;
        }

        try {
          const owner = (await readContract(config, {
            address: SLOTCHAIN_CONTRACT_ADDRESS,
            abi: SlotChainABI,
            functionName: 'ownerOf',
            args: [tokenId],
          })) as `0x${string}`;

          if (owner.toLowerCase() !== normalizedAccount.toLowerCase()) {
            logTicket('verifyAccess:tokenNotOwnedByAccount', {
              tokenId: tokenId.toString(),
              owner,
              account: normalizedAccount,
            });
            setHasAccess(false);
            return;
          }
        } catch (ownershipError) {
          logTicketError('verifyAccess:ownerLookupFailed', ownershipError);
          setHasAccess(false);
          return;
        }

        setSelectedTokenId(tokenId);

        try {
          logTicket('verifyAccess:fetchMeetingLink:start');
          const link = await fetchMeetingLink(normalizedAccount, tokenId);
          logTicket('verifyAccess:fetchMeetingLink:success', { link });
          setMeetingLink(link);
          setHasAccess(true);
        } catch (linkError) {
          logTicketError('verifyAccess:fetchMeetingLink:error', linkError);
          const message =
            linkError instanceof Error ? linkError.message : undefined;
          setAccessError(message || 'Unable to retrieve meeting link.');
          setHasAccess(false);
        }
      } catch (error) {
        logTicketError('verifyAccess:error', error);
        setAccessError(
          error instanceof Error
            ? error.message
            : 'Unable to verify access. Please try again.',
        );
        setHasAccess(false);
      } finally {
        setIsVerifying(false);
      }
    },
    [fetchMeetingLink],
  );

  useEffect(() => {
    if (!isConnected || !address) {
      setConnectedAddress(null);
      autoCheckedAddressRef.current = null;
      return;
    }

    setConnectedAddress(address);
  }, [isConnected, address]);

  const handleConnectWallet = async () => {
    try {
      if (isConnected && address) {
        logTicket('handleConnectWallet:alreadyConnected', { address });
        autoCheckedAddressRef.current = address;
        await verifyAccess(address);
        return;
      }

      const connector =
        connectors.find((item) => item.id === 'metaMask') ?? connectors[0];

      if (!connector) {
        logTicketError('handleConnectWallet:noConnector');
        throw new Error('No wallet connector available.');
      }

      logTicket('handleConnectWallet:connecting', {
        connectorId: connector.id,
        chainId: SEPOLIA_CHAIN_ID,
      });
      const result = await connectAsync({
        connector,
        chainId: SEPOLIA_CHAIN_ID,
      });

      logTicket('handleConnectWallet:connectResult', result);

      const nextAddress = result?.accounts?.[0];
      if (nextAddress) {
        logTicket('handleConnectWallet:newAddress', { nextAddress });
        setConnectedAddress(nextAddress);
        autoCheckedAddressRef.current = null;
        await verifyAccess(nextAddress);
      }
    } catch (error) {
      logTicketError('handleConnectWallet:error', error);
      setShowModal(false);
      setIsVerifying(false);
    }
  };

  const handleRetry = () => {
    setShowModal(false);
    setHasAccess(null);
    setIsVerifying(false);
    setMeetingLink(null);
    setAccessError(null);
    setSelectedTokenId(null);
  };

  const handleLaunchMeeting = useCallback(() => {
    if (meetingLink) {
      window.open(meetingLink, '_blank', 'noopener,noreferrer');
    }
    onAccessGranted();
  }, [meetingLink, onAccessGranted]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 relative overflow-hidden">
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDM0djItaDJ2LTJoLTJ6bTAtNHYyaDJ2LTJoLTJ6bTAgNHYyaDJ2LTJoLTJ6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-40"></div>

      <div className="relative max-w-6xl mx-auto px-4 py-12">
        <div className="flex items-center justify-center min-h-[10vh]">
          <div className="text-center max-w-3xl">
            <div className="flex items-center justify-center gap-3 mb-6">
              <div className="w-16 h-16 bg-blue-500 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/50">
                <Calendar className="w-9 h-9 text-white" />
              </div>
              <h1 className="text-5xl font-bold text-white">SlotChain</h1>
            </div>

            <p className="text-2xl text-yellow-100 mb-4 mt-100">
              Already have a Ticket?
            </p>
            <p className="text-lg text-slate-300 mb-12 max-w-2xl mx-auto">
              Connect your wallet to verify and access your meeting.
            </p>

            <button
              onClick={handleConnectWallet}
              disabled={isConnecting || isVerifying}
              className="group relative inline-flex items-center gap-3 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-semibold px-8 py-4 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-xl shadow-blue-500/30 hover:shadow-blue-500/50 hover:scale-105"
            >
              {isConnecting || isVerifying ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  {isConnecting
                    ? 'Connecting Wallet...'
                    : 'Verifying Access...'}
                </>
              ) : (
                <>
                  <Wallet className="w-6 h-6" />
                  Connect Wallet
                  <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>

            <div className="mt-16 grid md:grid-cols-3 gap-6">
              <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-colors">
                <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center mb-4 mx-auto">
                  <Shield className="w-6 h-6 text-blue-400" />
                </div>
                <h3 className="text-white font-semibold mb-2">Secure Access</h3>
                <p className="text-slate-400 text-sm">
                  On-chain verification ensures only authorized participants can
                  join
                </p>
              </div>

              <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-colors">
                <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center mb-4 mx-auto">
                  <Wallet className="w-6 h-6 text-blue-400" />
                </div>
                <h3 className="text-white font-semibold mb-2">Web3 Native</h3>
                <p className="text-slate-400 text-sm">Connect with MetaMask</p>
              </div>

              <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-colors">
                <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center mb-4 mx-auto">
                  <Calendar className="w-6 h-6 text-blue-400" />
                </div>
                <h3 className="text-white font-semibold mb-2">Instant Join</h3>
                <p className="text-slate-400 text-sm">
                  Seamless meeting access after wallet verification
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <AccessVerificationModal
        isOpen={showModal}
        isVerifying={isVerifying}
        hasAccess={hasAccess}
        meetingLink={meetingLink}
        tokenId={selectedTokenId}
        errorMessage={accessError}
        onRetry={handleRetry}
        onJoinMeeting={handleLaunchMeeting}
      />
    </div>
  );
}
