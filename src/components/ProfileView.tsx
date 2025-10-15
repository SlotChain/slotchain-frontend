import { useState, useEffect, useRef } from "react";
import { Upload, DollarSign } from "lucide-react";
import { ProfileData } from "../types";
import { useToast } from "../context/ToastContext";
import { useNavigate } from "react-router-dom";
import Cropper from "react-easy-crop";

import { Dialog } from "@headlessui/react";

import { useNotifications } from "../context/NotificationContext";

interface ProfileViewProps {
  walletAddress: string;
  onWalletChange?: (wallet: string) => void;
}

function getCroppedImg(imageSrc: string, pixelCrop: any): Promise<string> {
  const canvas = document.createElement("canvas");
  const image = new Image();
  image.src = imageSrc;

  return new Promise((resolve, reject) => {
    image.onload = () => {
      const ctx = canvas.getContext("2d")!;
      canvas.width = pixelCrop.width;
      canvas.height = pixelCrop.height;
      ctx.drawImage(
        image,
        pixelCrop.x,
        pixelCrop.y,
        pixelCrop.width,
        pixelCrop.height,
        0,
        0,
        pixelCrop.width,
        pixelCrop.height
      );
      resolve(canvas.toDataURL("image/jpeg"));
    };
    image.onerror = (err) => reject(err);
  });
}

export function ProfileView({
  walletAddress,
  onWalletChange,
}: ProfileViewProps) {
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const { showToast } = useToast();
  const { addNotification } = useNotifications();

  const [showCropper, setShowCropper] = useState(false);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);
  const [pendingProfilePhoto, setPendingProfilePhoto] = useState<string | null>(
    null
  );
  const originalWalletRef = useRef<string | null>(walletAddress || null);
  const [copied, setCopied] = useState(false);
  // don't rely on Router context — navigate via window to support non-routed render

  const [profile, setProfile] = useState<ProfileData>({
    username: "",
    email: "",
    walletAddress: walletAddress,
    hourlyRate: "",
    bio: "",
    profilePicture: "",
    bookingLink: "",
  });
  const navigate = useNavigate();

  const [walletConnected, setWalletConnected] = useState<boolean>(
    !!walletAddress
  );

  const handleCopyLink = () => {
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleVisit = () => {
    const address = profile.walletAddress || walletAddress || "";
    const url = `/book/${address}`;
    console.log("Opening in new tab:", url);
    window.open(url, "_blank"); // ✅ opens in a new tab
  };

  // listen for account changes from the injected provider (MetaMask)
  useEffect(() => {
    const eth = (window as any).ethereum;
    if (!eth || !eth.on) return;

    const handleAccountsChanged = (accounts: string[]) => {
      const acc = accounts && accounts.length ? accounts[0] : "";
      if (acc) {
        handleChange("walletAddress", acc);
        setWalletConnected(true);
        showToast("Wallet account changed", "info");
        // inform parent that wallet changed so App can persist it
        if (onWalletChange) onWalletChange(acc);
      } else {
        // no accounts -> disconnected
        handleChange("walletAddress", "");
        setWalletConnected(false);
        showToast("Wallet disconnected", "info");
        if (onWalletChange) onWalletChange("");
      }
    };

    eth.on("accountsChanged", handleAccountsChanged);
    return () => {
      try {
        eth.removeListener("accountsChanged", handleAccountsChanged);
      } catch (e) {
        /* ignore */
      }
    };
  }, []);

  // 👇 Fetch profile from backend
  useEffect(() => {
    if (!walletAddress) return;

    const fetchProfile = async () => {
      try {
        const res = await fetch(
          `http://localhost:5000/api/auth/user/${walletAddress}`
        );

        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }

        const data = await res.json();
        console.log("Fetched profile data:", data);

        if (data.status === "ok") {
          // support both shapes: { status: 'ok', user } and { status: 'ok', data: { user, ... } }
          const user = data.user ?? data.data?.user;
          if (user) {
            setProfile({
              username: user.fullName || "",
              email: user.email || "",
              walletAddress: user.walletAddress || walletAddress,
              hourlyRate: user.hourlyRate?.toString() || "",
              bio: user.bio || "",
              profilePicture: user.profilePhoto || "",
              bookingLink: user.bookingLink || "",
            });
          } else {
            showToast("Invalid response from server", "error");
          }
        } else {
          showToast("Invalid response from server", "error");
        }
      } catch (err) {
        console.error("❌ Failed to fetch profile:", err);
        showToast("Failed to load profile", "error");
        addNotification("Could not fetch profile data.");
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [walletAddress]);

  const handleChange = (field: keyof ProfileData, value: string) => {
    setProfile((prev) => ({ ...prev, [field]: value }));
  };
  const handleSave = async () => {
    setSaving(true);

    try {
      const originalWallet = originalWalletRef.current || walletAddress;
      if (!originalWallet) throw new Error("Original wallet unknown");

      const formData = new FormData();
      formData.append("fullName", profile.username);
      formData.append("email", profile.email);
      formData.append("bio", profile.bio);
      formData.append("hourlyRate", profile.hourlyRate);
      formData.append("currency", "USD");
      formData.append("walletAddress", profile.walletAddress);

      if (pendingProfilePhoto) {
        // dataURL → Blob → File
        const blob = await (await fetch(pendingProfilePhoto)).blob();
        const file = new File([blob], "profile.jpg", { type: blob.type });
        formData.append("profilePhoto", file);
      }

      const url = `http://localhost:5000/api/auth/user/${originalWallet}`;
      const res = await fetch(url, { method: "POST", body: formData });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(`HTTP ${res.status} - ${text}`);
      }

      const data = await res.json();
      if (data.status !== "updated" || !data.user) {
        throw new Error("Unexpected response from server");
      }

      const u = data.user;
      setProfile((prev) => ({
        ...prev,
        username: u.fullName ?? prev.username,
        email: u.email ?? prev.email,
        walletAddress: u.walletAddress ?? prev.walletAddress,
        hourlyRate: u.hourlyRate?.toString() ?? prev.hourlyRate,
        bio: u.bio ?? prev.bio,
        profilePicture: u.profilePhoto ?? prev.profilePicture,
      }));

      originalWalletRef.current = u.walletAddress || originalWalletRef.current;
      setPendingProfilePhoto(null);
      // propagate wallet change up to app state if provided
      if (u.walletAddress && onWalletChange) onWalletChange(u.walletAddress);
      showToast("Profile updated successfully!", "success");
      addNotification("Profile saved successfully.");
    } catch (err) {
      console.error("❌ Failed to save profile:", err);
      showToast("Failed to save profile", "error");
      addNotification("Failed to save profile.");
    } finally {
      setSaving(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setImageSrc(reader.result as string);
        setShowCropper(true);
      };
      reader.readAsDataURL(file);
    }
  };

  // cropper dialog is rendered inside the returned JSX so it mounts correctly

  if (loading) {
    return (
      <div className="text-center text-gray-500 dark:text-gray-400 py-8">
        Loading profile...
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Your Profile
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Manage your personal information and preferences
        </p>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden transition-colors">
        <div className="p-8 space-y-6">
          {/* Profile Picture */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Profile Picture
            </label>
            <div className="flex items-center gap-6">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-3xl font-bold overflow-hidden shadow-lg">
                {profile.profilePicture ? (
                  <img
                    src={profile.profilePicture}
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  profile.username.charAt(0).toUpperCase()
                )}
              </div>
              <label className="cursor-pointer px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center gap-2">
                <Upload className="w-4 h-4" />
                Upload Photo
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>
          </div>
          {/* Cropper dialog */}
          {showCropper && (
            <Dialog
              open={showCropper}
              onClose={() => setShowCropper(false)}
              className="relative z-50"
            >
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
                <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-xl max-w-md w-full">
                  <h3 className="text-lg font-semibold mb-3 text-gray-800 dark:text-gray-100">
                    Crop your profile picture
                  </h3>

                  <div className="relative w-full h-64 bg-gray-200 dark:bg-gray-700 rounded-lg overflow-hidden">
                    <Cropper
                      image={imageSrc!}
                      crop={crop}
                      zoom={zoom}
                      cropShape="round"
                      aspect={1}
                      onCropChange={setCrop}
                      onZoomChange={setZoom}
                      onCropComplete={(_, croppedAreaPixels) => {
                        setCroppedAreaPixels(croppedAreaPixels);
                      }}
                    />
                  </div>

                  <div className="flex justify-end gap-3 mt-4">
                    <button
                      onClick={() => setShowCropper(false)}
                      className="px-4 py-2 text-sm bg-gray-200 dark:bg-gray-700 rounded-lg"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={async () => {
                        if (imageSrc && croppedAreaPixels) {
                          try {
                            const croppedImage = await getCroppedImg(
                              imageSrc,
                              croppedAreaPixels
                            );
                            setProfile((prev) => ({
                              ...prev,
                              profilePicture: croppedImage,
                            }));
                            // mark pending photo so save will upload it
                            setPendingProfilePhoto(croppedImage);
                            setShowCropper(false);
                            setImageSrc(null);
                            setCroppedAreaPixels(null);
                            showToast(
                              "Profile picture cropped successfully!",
                              "success"
                            );
                          } catch (err) {
                            console.error("Failed to crop image", err);
                            showToast("Failed to crop image", "error");
                          }
                        }
                      }}
                      className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
                    >
                      Save Crop
                    </button>
                  </div>
                </div>
              </div>
            </Dialog>
          )}
          {/* Username */}
          <div>
            <label
              htmlFor="username"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              Username
            </label>
            <input
              id="username"
              type="text"
              value={profile.username}
              onChange={(e) => handleChange("username", e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
              placeholder="Enter your username"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Your Public Booking URL
            </label>
            <div className="flex items-center gap-3">
              <div className="flex-1 px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-600 dark:text-gray-400 font-mono text-sm">
                {`http://localhost:5173/book/${
                  profile.walletAddress || walletAddress
                }`}
              </div>
              <button
                onClick={handleVisit}
                className={`flex items-center gap-1 px-2 py-2 rounded-md text-sm transition-all ${
                  copied
                    ? "bg-green-600 text-white"
                    : "bg-blue-600 hover:bg-blue-700 text-white"
                }`}
              >
                Visit
                {/* {copied ? (
                  <>
                    <Check className="w-4 h-4" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    Copy
                  </>
                )} */}
              </button>
            </div>
          </div>
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              value={profile.email}
              onChange={(e) => handleChange("email", e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
              placeholder="Enter your email"
            />
          </div>
          {/* Wallet Address */}
          <div>
            <label
              htmlFor="wallet"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              Wallet Address
              <span
                className="ml-2 text-xs text-gray-500 dark:text-gray-400"
                title="To change the wallet, click the Connect Wallet button"
              >
                (To change the wallet, Select wallet in metamask)
              </span>
            </label>
            <div className="flex gap-3 items-center">
              <input
                id="wallet"
                type="text"
                value={profile.walletAddress}
                readOnly
                className="flex-1 px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-600 dark:text-gray-400 font-mono text-sm"
              />
              <button
                onClick={async () => {
                  // connect wallet via injected provider (MetaMask)
                  if (!(window as any).ethereum) {
                    showToast(
                      "No Ethereum provider found. Install MetaMask.",
                      "error"
                    );
                    addNotification("Please install a web3 wallet (MetaMask).");
                    return;
                  }

                  try {
                    const accounts: string[] = await (
                      window as any
                    ).ethereum.request({
                      method: "eth_requestAccounts",
                    });
                    const acc =
                      accounts && accounts.length ? accounts[0] : null;
                    if (acc) {
                      handleChange("walletAddress", acc);
                      setWalletConnected(true);
                      showToast("Wallet connected", "success");
                      addNotification("Wallet connected successfully.");
                    } else {
                      showToast("No accounts returned", "error");
                    }
                  } catch (err: any) {
                    console.error("Wallet connect error", err);
                    showToast(
                      err?.message || "Failed to connect wallet",
                      "error"
                    );
                    addNotification("Failed to connect wallet.");
                  }
                }}
                className={`px-4 py-2 text-sm rounded-lg font-medium ${
                  walletConnected
                    ? "bg-green-600 text-white hover:bg-green-700"
                    : "bg-blue-600 text-white hover:bg-blue-700"
                }`}
                title={
                  walletConnected
                    ? "Connected — click to change wallet"
                    : "Connect Wallet"
                }
              >
                {walletConnected ? "Connected" : "Connect Wallet"}
              </button>
            </div>
          </div>
          {/* Hourly Rate */}
          <div>
            <label
              htmlFor="hourlyRate"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              30 Minutes (USDT)
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <DollarSign className="w-5 h-5 text-gray-400" />
              </div>
              <input
                id="hourlyRate"
                type="number"
                min="0"
                step="1"
                value={profile.hourlyRate}
                onChange={(e) => handleChange("hourlyRate", e.target.value)}
                className="w-full pl-11 pr-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                placeholder="50"
              />
            </div>
          </div>
          {/* Bio */}
          <div>
            <label
              htmlFor="bio"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              Bio
            </label>
            <textarea
              id="bio"
              value={profile.bio}
              onChange={(e) => handleChange("bio", e.target.value)}
              rows={4}
              className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all resize-none"
              placeholder="Tell us about yourself..."
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="px-8 py-6 bg-gray-50 dark:bg-gray-750 border-t border-gray-200 dark:border-gray-700 flex flex-wrap items-center gap-4">
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium rounded-lg shadow-sm hover:shadow-md transition-all disabled:cursor-not-allowed"
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}
