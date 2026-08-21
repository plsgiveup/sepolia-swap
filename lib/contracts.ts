import { parseAbi } from 'viem'

export const WETH = '0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14' as const
export const USDC = '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238' as const
export const ROUTER = '0x3bFA4769FB09eefC5a80d6E87c3B9C650f7Ae48E' as const
export const QUOTER = '0xEd1f6473345F45b75F8179591dd5bA1888cf2FB3' as const
export const FACTORY = '0x0227628f3F023bb0B980b67D528571c95c6DaC1c' as const

/** Uniswap v3 fee tiers, in basis points * 100. */
export const FEE_TIERS = [100, 500, 3000, 10000] as const
export type FeeTier = (typeof FEE_TIERS)[number]

export const feeLabel = (fee: number) => `${(fee / 10000).toFixed(2)}%`

export const routerAbi = parseAbi([
  'function exactInputSingle((address tokenIn, address tokenOut, uint24 fee, address recipient, uint256 amountIn, uint256 amountOutMinimum, uint160 sqrtPriceLimitX96)) payable returns (uint256 amountOut)',
])

export const quoterAbi = parseAbi([
  'function quoteExactInputSingle((address tokenIn, address tokenOut, uint256 amountIn, uint24 fee, uint160 sqrtPriceLimitX96)) returns (uint256 amountOut, uint160 sqrtPriceX96After, uint32 initializedTicksCrossed, uint256 gasEstimate)',
])

export const erc20Abi = parseAbi([
  'function balanceOf(address) view returns (uint256)',
  'function decimals() view returns (uint8)',
])

export const factoryAbi = parseAbi([
  'function getPool(address, address, uint24) view returns (address)',
])

export const poolAbi = parseAbi([
  'function liquidity() view returns (uint128)',
])
