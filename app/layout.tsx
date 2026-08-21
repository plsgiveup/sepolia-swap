import type { Metadata } from 'next'
import { Inter, IBM_Plex_Mono } from 'next/font/google'
import { Providers } from './providers'
import './globals.css'

const display = Inter({ subsets: ['latin'], weight: ['500', '600', '700'], variable: '--font-display' })
const body = Inter({ subsets: ['latin'], weight: ['400', '500'], variable: '--font-body' })
const mono = IBM_Plex_Mono({ subsets: ['latin'], weight: ['400', '500', '600'], variable: '--font-mono' })

export const metadata: Metadata = {
  title: 'Sepolia ETH → USDC',
  description: 'Swap Sepolia testnet ETH for USDC through Uniswap v3, without the routing API.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${display.variable} ${body.variable} ${mono.variable}`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
