export const MOCK_ALLOWED_ADDRESSES = [
  "0x1234abcd5678efgh",
  "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
  "0x8626f6940E2eb28930eFb4CeF49B2d1F2C9C1199",
];

export const connectWallet = async (): Promise<string> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const randomIndex =
        Math.random() > 0.5 ? 0 : Math.floor(Math.random() * 5);
      const mockAddresses = [
        ...MOCK_ALLOWED_ADDRESSES,
        "0x9999999999999999999999999999999999999999",
        "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
      ];
      resolve(mockAddresses[randomIndex]);
    }, 1500);
  });
};

export const hasMeetingAccess = async (address: string): Promise<boolean> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const hasAccess = MOCK_ALLOWED_ADDRESSES.includes(address.toLowerCase());
      resolve(hasAccess);
    }, 2000);
  });
};

export const formatAddress = (address: string): string => {
  if (!address) return "";
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};
