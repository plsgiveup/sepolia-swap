import { SwapCard } from '@/components/SwapCard'
import { WalletBar } from '@/components/WalletBar'
import { USDC } from '@/lib/contracts'

export default function Page() {
  return (
    <main className="shell">
      <WalletBar />
      <p className="eyebrow">Ethereum Sepolia · Uniswap v3</p>
      <h1 className="title">
        Testnet ETH,<br />turned into <em>USDC</em>.
      </h1>
      <p className="lede">
        The Uniswap app usually refuses this swap on Sepolia — its routing service
        does not index testnets properly. This calls the router contract directly instead.
        Connect a wallet, pick an amount, sign once.
      </p>

      <SwapCard />

      <footer className="foot">
        <div>
          Need USDC and not the practice? <a href="https://faucet.circle.com" target="_blank" rel="noreferrer">Circle&apos;s faucet</a> hands out 20 every two hours, free.
        </div>
        <div>
          USDC <span>{USDC}</span>
        </div>
        <div>
          Testnet only. These tokens are worth nothing and the prices here mean nothing.
        </div>
        <div>
          Build <span>{process.env.NEXT_PUBLIC_BUILD ?? 'bridge-modal-6'}</span>
        </div>
      </footer>
    </main>
  )
}
