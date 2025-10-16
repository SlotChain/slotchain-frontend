import { createConfig, http } from "wagmi";
import { sepolia } from "wagmi/chains";
import { metaMask } from "wagmi/connectors";

export const config = createConfig({
  chains: [sepolia],
  connectors: [metaMask()], // ✅ Add MetaMask connector
  transports: {
    [sepolia.id]: http(
      "https://sepolia.infura.io/v3/af80bcb2f25c4c0d850b20f2a3605386"
    ), // ✅ Use Infura or Alchemy endpoint
  },
});
