'use client'

import { useCallback, useEffect, useState } from 'react'
import { useAccount } from 'wagmi'

export const SEPOLIA_ID = 11155111
export const SEPOLIA_HEX = '0xaa36a7'

type Eip1193 = {
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>
  on?: (event: string, handler: (...args: never[]) => void) => void
  removeListener?: (event: string, handler: (...args: never[]) => void) => void
}

const SEPOLIA_PARAMS = {
  chainId: SEPOLIA_HEX,
  chainName: 'Sepolia',
  nativeCurrency: { name: 'Sepolia Ether', symbol: 'ETH', decimals: 18 },
  rpcUrls: [
    process.env.NEXT_PUBLIC_SEPOLIA_RPC || 'https://ethereum-sepolia-rpc.publicnode.com',
  ],
  blockExplorerUrls: ['https://sepolia.etherscan.io'],
}

/**
 * The wallet's chain, read from the provider itself rather than from wagmi's
 * cached connection state. wagmi's copy can lag behind the wallet, and a stale
 * value here means the swap button unlocks on the wrong network — so this asks
 * the source of truth, listens for chainChanged, and re-checks on focus.
 */
export function useWalletChain() {
  const { connector, isConnected } = useAccount()
  const [provider, setProvider] = useState<Eip1193 | null>(null)
  const [chainId, setChainId] = useState<number | null>(null)

  useEffect(() => {
    let cancelled = false
    if (!isConnected || !connector?.getProvider) {
      setProvider(null)
      setChainId(null)
      return
    }
    connector.getProvider().then((p) => {
      if (!cancelled) setProvider((p as Eip1193) ?? null)
    })
    return () => {
      cancelled = true
    }
  }, [connector, isConnected])

  const read = useCallback(async () => {
    if (!provider) return null
    try {
      const hex = (await provider.request({ method: 'eth_chainId' })) as string
      const id = Number.parseInt(hex, 16)
      setChainId(Number.isFinite(id) ? id : null)
      return id
    } catch {
      setChainId(null)
      return null
    }
  }, [provider])

  useEffect(() => {
    if (!provider) return
    void read()

    const onChainChanged = () => void read()
    provider.on?.('chainChanged', onChainChanged)
    window.addEventListener('focus', onChainChanged)
    const timer = setInterval(onChainChanged, 3000)

    return () => {
      provider.removeListener?.('chainChanged', onChainChanged)
      window.removeEventListener('focus', onChainChanged)
      clearInterval(timer)
    }
  }, [provider, read])

  /**
   * Asks the wallet to move to Sepolia, adding the network first if the wallet
   * doesn't have it. Resolves to the chain id the wallet ended up on.
   */
  const ensureSepolia = useCallback(async () => {
    if (!provider) return null
    try {
      await provider.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: SEPOLIA_HEX }],
      })
    } catch (err) {
      const code = (err as { code?: number })?.code
      // 4902: chain unknown to the wallet. Some wallets report it nested, and
      // MetaMask has historically returned -32603 wrapping the same thing.
      const unknownChain =
        code === 4902 ||
        code === -32603 ||
        /unrecognized|unknown chain|add.*chain/i.test(String((err as Error)?.message ?? ''))

      if (!unknownChain) return read()

      try {
        await provider.request({
          method: 'wallet_addEthereumChain',
          params: [SEPOLIA_PARAMS],
        })
      } catch {
        return read()
      }
    }
    return read()
  }, [provider, read])

  return { chainId, onSepolia: chainId === SEPOLIA_ID, ensureSepolia, refresh: read, ready: Boolean(provider) }
}
