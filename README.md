# Sepolia ETH → USDC

A one-page swap tool for Ethereum Sepolia. Calls Uniswap v3's `SwapRouter02`
directly, because the Uniswap web app's routing service does not index testnets
and usually refuses the trade.

No approval step: the router takes native ETH as `msg.value` and wraps it
internally.

## Run it

```bash
npm install
npm run dev
```

## Deploy

Push to GitHub, import the repo on Vercel, deploy. Nothing else to configure —
there is no backend and no database.

## Environment

| Variable | Required | Why |
|---|---|---|
| `NEXT_PUBLIC_SEPOLIA_RPC` | Recommended | The app quotes four fee tiers on every keystroke. The default public endpoint is rate limited and will start dropping quotes. Point this at Alchemy or Infura. |

Set it in Vercel under Settings → Environment Variables.

## Contracts

| What | Address |
|---|---|
| SwapRouter02 | `0x3bFA4769FB09eefC5a80d6E87c3B9C650f7Ae48E` |
| QuoterV2 | `0xEd1f6473345F45b75F8179591dd5bA1888cf2FB3` |
| WETH9 | `0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14` |
| USDC | `0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238` |

## How the quote works

Sepolia pools are seeded by hand, so the fee tier holding liquidity is not
predictable — 0.3% is usually the live one, but not always. The app quotes all
four tiers in parallel through `QuoterV2` and swaps through whichever pays out
most. If all four come back empty, no pool has liquidity and the app says so
rather than letting the transaction revert.

`amountOutMinimum` is set to 95% of the quote. Testnet pools are thin enough
that the price can move between quoting and mining.
