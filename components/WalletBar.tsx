'use client'

import { useAccount, useConnect, useDisconnect } from 'wagmi'

const short = (a: string) => `${a.slice(0, 6)}…${a.slice(-4)}`

export function WalletBar() {
  const { address, isConnected, connector } = useAccount()
  const { connect, connectors, isPending, error } = useConnect()
  const { disconnect } = useDisconnect()

  if (isConnected && address) {
    return (
      <div className="wallet-bar">
        <span className="wallet-id">
          <span className="dot" aria-hidden />
          {connector?.name ? `${connector.name} · ` : ''}
          {short(address)}
        </span>
        <button className="link-btn" onClick={() => disconnect()}>
          Disconnect
        </button>
      </div>
    )
  }

  // Wallets announce themselves over EIP-6963. Anything modern shows up here;
  // an empty list means nothing is installed rather than nothing is supported.
  if (!connectors.length) {
    return (
      <div className="wallet-bar">
        <span className="wallet-id muted">No wallet detected</span>
        <a className="link-btn" href="https://metamask.io/download/" target="_blank" rel="noreferrer">
          Install one
        </a>
      </div>
    )
  }

  return (
    <div className="wallet-bar">
      <span className="wallet-id muted">Not connected</span>
      <span className="wallet-choices">
        {connectors.map((c) => (
          <button
            key={c.uid}
            className="link-btn"
            disabled={isPending}
            onClick={() => connect({ connector: c })}
          >
            {isPending ? 'Connecting' : `Connect ${c.name}`}
          </button>
        ))}
      </span>
      {error && <span className="wallet-err">{error.message}</span>}
    </div>
  )
}
