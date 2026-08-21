import { http, createConfig } from 'wagmi'
import { sepolia } from 'wagmi/chains'

// NEXT_PUBLIC_SEPOLIA_RPC — set your own for reliable quoting.
// The default public endpoint is rate limited and will drop quotes under load.
const rpc = process.env.NEXT_PUBLIC_SEPOLIA_RPC

// No connector imports on purpose. wagmi discovers installed wallets through
// EIP-6963 announcements, which picks up MetaMask, Rabby, Frame and the rest
// without pulling in the @wagmi/connectors barrel (it drags along a broken
// Coinbase SDK dependency chain that fails to build).
export const config = createConfig({
  chains: [sepolia],
  multiInjectedProviderDiscovery: true,
  transports: {
    [sepolia.id]: http(rpc || undefined),
  },
  ssr: true,
})

declare module 'wagmi' {
  interface Register {
    config: typeof config
  }
}
