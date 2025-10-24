import { useState, useRef } from 'react';
import { Calendar, Upload, X, Wallet, ArrowRight } from 'lucide-react';
import slotChainABI from '../../contractABI/SlotChainABI.json';

import {
  useAccount,
  useConnect,
  useSwitchChain,
  useWriteContract,
} from 'wagmi';
import { metaMask } from 'wagmi/connectors';

import { readContract, waitForTransactionReceipt } from '@wagmi/core';
import { CHAIN_ID, config } from '../config';
import { backendUrl } from '../utils/backend';

interface SignupProps {
  onSignupComplete: (userData: SignupData) => void;
  onBackToLogin: () => void;
  connectedWallet?: string; // ✅ optional prop
}

export interface SignupData {
  walletAddress: string;
  fullName: string;
  email: string;
  bio: string;
  profilePhoto: File | null;
  hourlyRate: string;
  currency: string;
}

export function Signup({
  onSignupComplete,
  onBackToLogin,
  connectedWallet,
}: SignupProps) {
  const [formData, setFormData] = useState<SignupData>({
    walletAddress: connectedWallet || '',
    fullName: '',
    email: '',
    bio: '',
    profilePhoto: null,
    hourlyRate: '',
    currency: 'USDT',
  });

  const contractAddress = import.meta.env.VITE_SLOCTCHAIN_CONTRACT;
  // "0xf17c27f5db09b43d7e8401ffdd37a2d3c4745034" as `0x${string}`;

  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { address, isConnected: walletConnected, chain } = useAccount();
  const { connectAsync } = useConnect();
  const { switchChainAsync } = useSwitchChain();
  const { writeContractAsync } = useWriteContract();

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData((prev) => ({ ...prev, profilePhoto: file }));
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemovePhoto = () => {
    setFormData((prev) => ({ ...prev, profilePhoto: null }));
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };
  // const handleSubmit = async (e: React.FormEvent) => {
  //   e.preventDefault();
  //   setIsSubmitting(true);

  //   try {
  //     // ✅ check if user uploaded a profile photo
  //     if (!formData.profilePhoto) {
  //       alert("Please upload a profile photo before continuing.");
  //       setIsSubmitting(false);
  //       return;
  //     }

  //     const formDataToSend = new FormData();
  //     formDataToSend.append("walletAddress", formData.walletAddress);
  //     formDataToSend.append("fullName", formData.fullName);
  //     formDataToSend.append("email", formData.email);
  //     formDataToSend.append("bio", formData.bio);
  //     formDataToSend.append("hourlyRate", formData.hourlyRate);
  //     formDataToSend.append("currency", formData.currency);

  //     if (formData.profilePhoto) {
  //       formDataToSend.append("profilePhoto", formData.profilePhoto);
  //     }

  //     const response = await fetch(backendUrl("/auth/signup"), {
  //       method: "POST",
  //       body: formDataToSend,
  //     });

  //     if (!response.ok) {
  //       throw new Error(`HTTP error! status: ${response.status}`);
  //     }

  //     const result = await response.json();

  //     if (result.status === "created" || result.status === "existing_user") {
  //       onSignupComplete(result.user);
  //     } else {
  //       alert("Something went wrong with signup.");
  //     }
  //   } catch (error) {
  //     console.error("Signup error:", error);
  //     alert("Signup failed. Please try again.");
  //   } finally {
  //     setIsSubmitting(false);
  //   }
  // };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    let signupResult: any = null;

    try {
      if (!formData.profilePhoto) {
        alert('Please upload a profile photo before continuing.');
        setIsSubmitting(false);
        return;
      }

      // ✅ Step 1: Send data to backend for IPFS upload
      const formDataToSend = new FormData();
      formDataToSend.append('walletAddress', formData.walletAddress);
      formDataToSend.append('fullName', formData.fullName);
      formDataToSend.append('email', formData.email);
      formDataToSend.append('bio', formData.bio);
      formDataToSend.append('hourlyRate', formData.hourlyRate);
      formDataToSend.append('currency', formData.currency);
      if (formData.profilePhoto) {
        formDataToSend.append('profilePhoto', formData.profilePhoto);
      }

      const response = await fetch(backendUrl('/auth/signup'), {
        method: 'POST',
        body: formDataToSend,
      });

      if (!response.ok)
        throw new Error(`HTTP error! status: ${response.status}`);

      signupResult = await response.json();

      if (
        signupResult.status !== 'created' &&
        signupResult.status !== 'existing_user'
      ) {
        alert('Something went wrong during signup.');
        setIsSubmitting(false);
        return;
      }

      const { contractData } = signupResult;
      const { metadataURI } = contractData;

      // ✅ Step 2: Connect wallet if not connected
      let userAddress = connectedWallet ?? address ?? undefined;
      if (!walletConnected) {
        const connection = await connectAsync({
          connector: metaMask(),
          chainId: CHAIN_ID,
        });
        userAddress = connection.accounts[0];
      } else if (chain?.id !== CHAIN_ID) {
        await switchChainAsync?.({ chainId: CHAIN_ID });
        userAddress = address ?? userAddress;
      }

      const scaledHourlyRate = Math.floor(
        Number(formData.hourlyRate) * 1_000_000,
      );

      const txHash = await writeContractAsync({
        address: contractAddress as `0x${string}`,
        abi: slotChainABI,
        functionName: 'createProfile',
        args: [scaledHourlyRate, metadataURI],
        chainId: CHAIN_ID,
        gas: 1_000_000n,
      });

      await waitForTransactionReceipt(config, { hash: txHash });

      // ✅ Step 5: Update UI
      onSignupComplete(signupResult.user);
      alert('Profile created successfully!');
    } catch (error) {
      console.error('Signup + Create Profile failed:', error);

      let profileExists = false;

      try {
        const contractAddress = import.meta.env
          .VITE_SLOCTCHAIN_CONTRACT as `0x${string}`;

        const response = (await readContract(config, {
          address: contractAddress,
          abi: slotChainABI,
          functionName: 'creatorsProfiles',
          args: [signupResult?.user?.walletAddress ?? formData.walletAddress],
          chainId: CHAIN_ID,
        })) as [string, bigint, string, boolean];

        profileExists = Boolean(response?.[3]);
      } catch (readError) {
        console.warn('Unable to verify on-chain profile after signup error.', {
          readError,
        });
      }

      if (profileExists && signupResult?.user) {
        onSignupComplete(signupResult.user);
        alert(
          'Profile created successfully! (Network confirmation hit an RPC hiccup.)',
        );
      } else {
        alert('Something went wrong during profile creation.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 py-12 px-6">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl"></div>

      <div className="relative max-w-2xl mx-auto">
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="w-12 h-12 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-lg flex items-center justify-center shadow-lg shadow-cyan-500/20">
            <Calendar className="w-7 h-7 text-white" />
          </div>
          <span className="text-3xl font-bold text-white">SlotChain</span>
        </div>

        <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm border border-slate-700 rounded-2xl p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">
              Create Your Account
            </h1>
            <p className="text-slate-400">
              Set up your profile to start earning crypto
            </p>
          </div>

          <div className="mb-6 p-4 bg-slate-900/50 border border-cyan-500/20 rounded-lg flex items-center gap-3">
            <Wallet className="w-5 h-5 text-cyan-400" />
            <div className="flex-1">
              <div className="text-xs text-slate-400 mb-1">
                Connected Wallet
              </div>
              <div className="text-white font-mono text-sm">
                {formData.walletAddress}
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-3">
                Profile Photo
              </label>
              <div className="flex items-center gap-6">
                <div className="relative">
                  {previewUrl ? (
                    <div className="relative w-24 h-24 rounded-full overflow-hidden border-2 border-cyan-500/50">
                      <img
                        src={previewUrl}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={handleRemovePhoto}
                        className="absolute top-1 right-1 w-6 h-6 bg-slate-900/80 rounded-full flex items-center justify-center hover:bg-red-500 transition-colors"
                      >
                        <X className="w-4 h-4 text-white" />
                      </button>
                    </div>
                  ) : (
                    <div className="w-24 h-24 rounded-full bg-slate-700 flex items-center justify-center border-2 border-slate-600">
                      <Upload className="w-8 h-8 text-slate-400" />
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="hidden"
                    id="photo-upload"
                  />
                  <label
                    htmlFor="photo-upload"
                    className="inline-block px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors cursor-pointer"
                  >
                    Choose Photo
                  </label>
                  <p className="text-sm text-slate-400 mt-2">
                    JPG, PNG or GIF. Max 2MB.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label
                  htmlFor="fullName"
                  className="block text-sm font-medium text-slate-300 mb-2"
                >
                  Full Name *
                </label>
                <input
                  type="text"
                  id="fullName"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
                  placeholder="John Doe"
                />
              </div>

              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-slate-300 mb-2"
                >
                  Email Address *
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
                  placeholder="john@example.com"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="bio"
                className="block text-sm font-medium text-slate-300 mb-2"
              >
                Bio
              </label>
              <textarea
                id="bio"
                name="bio"
                value={formData.bio}
                onChange={handleInputChange}
                rows={4}
                className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors resize-none"
                placeholder="Tell us about yourself and what you do..."
              />
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label
                  htmlFor="hourlyRate"
                  className="block text-sm font-medium text-slate-300 mb-2"
                >
                  Hourly Rate *
                </label>
                <input
                  type="number"
                  id="hourlyRate"
                  name="hourlyRate"
                  value={formData.hourlyRate}
                  onChange={handleInputChange}
                  required
                  step="0.001"
                  min="0"
                  className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
                  placeholder="0.05"
                />
              </div>

              <div>
                <label
                  htmlFor="currency"
                  className="block text-sm font-medium text-slate-300 mb-2"
                >
                  Currency *
                </label>
                <select
                  id="currency"
                  name="currency"
                  value={formData.currency}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-cyan-500 transition-colors"
                >
                  <option value="USDT">USDT - Tether</option>
                </select>
              </div>
            </div>

            <div className="pt-6 flex gap-4">
              <button
                type="button"
                onClick={onBackToLogin}
                className="px-6 py-3 bg-slate-700 text-white rounded-lg font-semibold hover:bg-slate-600 transition-all"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-lg font-semibold hover:shadow-lg hover:shadow-cyan-500/30 transition-all flex items-center justify-center gap-2 group disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Creating Account...
                  </>
                ) : (
                  <>
                    Create Account
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        <div className="mt-6 text-center">
          <p className="text-slate-400 text-sm">
            Already have an account?{' '}
            <button
              onClick={onBackToLogin}
              className="text-cyan-400 hover:text-cyan-300 font-semibold transition-colors"
            >
              Sign in
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
