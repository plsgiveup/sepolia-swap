'use client'

import { useMemo, useState } from 'react'
import { formatUnits, parseEther } from 'viem'
import {
  useAccount, useBalance, useChainId, useConnect, useReadContract,
  useSwitchChain, useWaitForTransactionReceipt, useWriteContract,
} from 'wagmi'
import { sepolia } from 'wagmi/chains'
import { ROUTER, USDC, WETH, erc20Abi, feeLabel, routerAbi } from '@/lib/contracts'
import { useBestQuote } from '@/lib/useBestQuote'

const ZERO = '0x0000000000000000000000000000000000000000'
const short = (a: string) => `${a.slice(0, 6)}…${a.slice(-4)}`

export function SwapCard() {
  const [raw, setRaw] = useState('')
  const { address, isConnected } = useAccount()
  const chainId = useChainId()
  const { connect, connectors, isPending: connecting } = useConnect()
  const { switchChain, isPending: switching } = useSwitchChain()

  const onSepolia = chainId === sepolia.id

  const { data: ethBalance } = useBalance({ address })
  const { data: usdcBalance, refetch: refetchUsdc } = useReadContract({
    address: USDC,
    abi: erc20Abi,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: { enabled: Boolean(address) },
  })

  const amountIn = useMemo(() => {
    if (!raw.trim()) return null
    try {
      const v = parseEther(raw.trim())
      return v > 0n ? v : null
    } catch {
      return null
    }
  }, [raw])

  const quote = useBestQuote(amountIn)

  const { writeContract, data: hash, isPending: signing, error: writeError, reset } = useWriteContract()
  const { isLoading: mining, isSuccess: mined } = useWaitForTransactionReceipt({
    hash,
    query: { enabled: Boolean(hash) },
  })

  if (mined && usdcBalance !== undefined) void refetchUsdc()

  const insufficient = Boolean(
    amountIn && ethBalance && amountIn > ethBalance.value
  )

  const canSwap = Boolean(
    isConnected && onSepolia && amountIn && quote.best && !insufficient && !signing && !mining
  )

  function swap() {
    if (!amountIn || !quote.best || !address) return
    reset()
    // amountOutMinimum at 95% of quote. Testnet pools are thin enough that
    // the price can move between quoting and mining.
    const floor = (quote.best.amountOut * 95n) / 100n
    writeContract({
      address: ROUTER,
      abi: routerAbi,
      functionName: 'exactInputSingle',
      value: amountIn,
      args: [{
        tokenIn: WETH,
        tokenOut: USDC,
        fee: quote.best.fee,
        recipient: address,
        amountIn,
        amountOutMinimum: floor,
        sqrtPriceLimitX96: 0n,
      }],
    })
  }

  const out = quote.best ? formatUnits(quote.best.amountOut, 6) : null
  const rate = quote.best && amountIn
    ? Number(formatUnits(quote.best.amountOut, 6)) / Number(formatUnits(amountIn, 18))
    : null

  return (
    <div className="columns">
      <section className="panel">
        <div className="panel-head">
          <span>Swap</span>
          <span>{onSepolia ? 'Sepolia' : 'Wrong network'}</span>
        </div>

        <div className="panel-body">
          <div className="field-label">
            <span>You pay</span>
            {ethBalance && (
              <button
                type="button"
                onClick={() => {
                  // Leave a little behind for gas.
                  const spare = ethBalance.value > parseEther('0.01')
                    ? ethBalance.value - parseEther('0.01')
                    : 0n
                  setRaw(formatUnits(spare, 18))
                }}
              >
                Balance {Number(formatUnits(ethBalance.value, 18)).toFixed(4)}
              </button>
            )}
          </div>

          <div className="amount-row">
            <input
              inputMode="decimal"
              placeholder="0.0"
              value={raw}
              onChange={(e) => setRaw(e.target.value.replace(/[^0-9.]/g, ''))}
              aria-label="Amount of ETH to swap"
            />
            <span className="ticker">ETH</span>
          </div>

          <div className="arrow" aria-hidden>↓</div>

          <div className="field-label">
            <span>You receive</span>
            {usdcBalance !== undefined && (
              <span>Balance {Number(formatUnits(usdcBalance, 6)).toFixed(2)}</span>
            )}
          </div>

          <div className="readout">
            <span className={`value ${out ? '' : 'idle'}`}>
              {quote.loading ? '···' : out ? Number(out).toLocaleString('en-US', { maximumFractionDigits: 2 }) : '0.0'}
            </span>
            <span className="ticker">USDC</span>
          </div>

          {quote.best && (
            <div className="route">
              <span>Fee tier <b>{feeLabel(quote.best.fee)}</b></span>
              {rate && <span>Rate <b>{rate.toLocaleString('en-US', { maximumFractionDigits: 0 })}</b> USDC/ETH</span>}
              {quote.best.ticksCrossed > 3 && (
                <span>Ticks crossed <b>{quote.best.ticksCrossed}</b> — try a smaller amount</span>
              )}
            </div>
          )}

          {!isConnected ? (
            <button
              className="action"
              disabled={connecting || !connectors.length}
              onClick={() => connect({ connector: connectors[0] })}
            >
              {connecting ? 'Connecting' : 'Connect wallet'}
            </button>
          ) : !onSepolia ? (
            <button
              className="action"
              disabled={switching}
              onClick={() => switchChain({ chainId: sepolia.id })}
            >
              {switching ? 'Switching' : 'Switch to Sepolia'}
            </button>
          ) : (
            <button className="action" disabled={!canSwap} onClick={swap}>
              {signing ? 'Confirm in wallet' : mining ? 'Swapping' : insufficient ? 'Not enough ETH' : 'Swap'}
            </button>
          )}

          {quote.error && amountIn && (
            <div className="status bad">
              {quote.error} All four fee tiers came back empty — someone needs to seed
              the pool before this pair can trade.
            </div>
          )}

          {writeError && (
            <div className="status bad">
              {(writeError as { shortMessage?: string }).shortMessage ?? writeError.message}
            </div>
          )}

          {hash && (
            <div className="status">
              {mined ? 'Swapped. ' : 'Submitted. '}
              <a href={`https://sepolia.etherscan.io/tx/${hash}`} target="_blank" rel="noreferrer">
                View on Etherscan
              </a>
              {mined && (
                <>
                  <br />
                  Add {short(USDC)} to your wallet as a custom token to see the balance.
                </>
              )}
            </div>
          )}
        </div>
      </section>

      <section className="panel">
        <div className="panel-head">
          <span>The call being made</span>
          <span>SwapRouter02</span>
        </div>

        <div className="panel-body">
          <div className="call">
            <Row k="to" v={ROUTER} />
            <Row k="function" v="exactInputSingle" accent />
            <Row k="msg.value" v={amountIn ? `${raw} ETH` : '—'} dim={!amountIn} />
            <Row k="tokenIn" v={`${short(WETH)}  WETH`} />
            <Row k="tokenOut" v={`${short(USDC)}  USDC`} />
            <Row k="fee" v={quote.best ? String(quote.best.fee) : '—'} dim={!quote.best} />
            <Row k="recipient" v={address ? short(address) : '—'} dim={!address} />
            <Row k="amountIn" v={amountIn ? amountIn.toString() : '—'} dim={!amountIn} />
            <Row
              k="amountOutMinimum"
              v={quote.best ? ((quote.best.amountOut * 95n) / 100n).toString() : '—'}
              dim={!quote.best}
            />
            <Row k="sqrtPriceLimitX96" v="0" />
          </div>

          <p className="note">
            No approval step. The router accepts native ETH as <code>msg.value</code> and
            wraps it to WETH internally, so there is nothing to authorize first.
          </p>
          <p className="note">
            Every tier is quoted before each swap and the best one wins. Sepolia pools are
            seeded by hand, so the tier holding liquidity moves around.
          </p>
        </div>
      </section>
    </div>
  )
}

function Row({ k, v, dim, accent }: { k: string; v: string; dim?: boolean; accent?: boolean }) {
  return (
    <div className="call-row">
      <span className="call-key">{k}</span>
      <span className={`call-val${dim ? ' dim' : ''}`}>{accent ? <em>{v}</em> : v}</span>
    </div>
  )
}

export { ZERO }
