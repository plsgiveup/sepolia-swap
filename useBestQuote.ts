'use client'

import { useEffect, useState } from 'react'
import { usePublicClient } from 'wagmi'
import { FEE_TIERS, QUOTER, USDC, WETH, quoterAbi } from './contracts'

export type Quote = {
  fee: number
  amountOut: bigint
  ticksCrossed: number
}

export type QuoteState = {
  best: Quote | null
  alternatives: Quote[]
  loading: boolean
  /** Set when every tier failed — usually means no pool has liquidity. */
  error: string | null
}

const EMPTY: QuoteState = { best: null, alternatives: [], loading: false, error: null }

/**
 * Quotes the swap across all four fee tiers and returns the one paying out most.
 * Sepolia pools are seeded arbitrarily, so the tier with liquidity varies —
 * checking all of them is cheaper than guessing wrong and reverting.
 */
export function useBestQuote(amountIn: bigint | null): QuoteState {
  const client = usePublicClient()
  const [state, setState] = useState<QuoteState>(EMPTY)

  useEffect(() => {
    if (!client || !amountIn || amountIn <= 0n) {
      setState(EMPTY)
      return
    }

    let cancelled = false
    setState((s) => ({ ...s, loading: true, error: null }))

    const timer = setTimeout(async () => {
      const settled = await Promise.allSettled(
        FEE_TIERS.map(async (fee) => {
          const { result } = await client.simulateContract({
            address: QUOTER,
            abi: quoterAbi,
            functionName: 'quoteExactInputSingle',
            args: [
              {
                tokenIn: WETH,
                tokenOut: USDC,
                amountIn,
                fee,
                sqrtPriceLimitX96: 0n,
              },
            ],
          })
          return { fee, amountOut: result[0], ticksCrossed: Number(result[2]) }
        })
      )

      if (cancelled) return

      const quotes: Quote[] = settled
        .flatMap((r) => (r.status === 'fulfilled' ? [r.value as Quote] : []))
        .filter((q) => q.amountOut > 0n)
        .sort((a, b) => (b.amountOut > a.amountOut ? 1 : -1))

      setState({
        best: quotes[0] ?? null,
        alternatives: quotes.slice(1),
        loading: false,
        error: quotes.length ? null : 'No pool has liquidity for this pair right now.',
      })
    }, 350)

    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [client, amountIn])

  return state
}
