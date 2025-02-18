import { http, createConfig } from "wagmi";
import { base, bscTestnet, mainnet } from "wagmi/chains";
import { metaMask, walletConnect, coinbaseWallet  } from "wagmi/connectors";
import { projectId } from "./wagmi_config";

export const config = createConfig({

  chains: [bscTestnet ,mainnet, base],
  connectors: [
    walletConnect({
      projectId : projectId,
    }),
    metaMask(),
    coinbaseWallet(),
  ],
  transports: {
    [bscTestnet.id]: http(),
    [mainnet.id]: http(),
    [base.id]: http(),
  },
});
