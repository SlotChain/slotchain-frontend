import { createConfig, http } from "wagmi";
import { baseSepolia } from "wagmi/chains";
import { metaMask } from "wagmi/connectors";

export const TARGET_CHAIN = baseSepolia;
export const CHAIN_ID = TARGET_CHAIN.id;

export const config = createConfig({
  chains: [TARGET_CHAIN],
  connectors: [metaMask()], // ✅ Add MetaMask connector
  transports: {
    [TARGET_CHAIN.id]: http("https://sepolia.base.org"), // ✅ Base Sepolia RPC endpoint
  },
});
