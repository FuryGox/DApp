
// config/index.tsx

import { cookieStorage, createStorage } from '@wagmi/core'
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi'
import { bscTestnet } from './chain_config'

// Get projectId from https://cloud.reown.com
export const projectId = "14f67343a5062c491fd801df1afa7cbe"

if (!projectId) {
  throw new Error('Project ID is not defined')
}

export const networks = [bscTestnet]

//Set up the Wagmi Adapter (Config)
export const wagmiAdapter = new WagmiAdapter({
  storage: createStorage({
    storage: cookieStorage
  }),
  ssr: true,
  projectId,
  networks
})

export const config = wagmiAdapter.wagmiConfig