import type { Metadata } from 'next'
import { Space_Grotesk, IBM_Plex_Sans, IBM_Plex_Mono } from 'next/font/google'
import { Providers } from './providers'
import './globals.css'

const display = Space_Grotesk({ subsets: ['latin'], variable: '--font-display' })
const body = IBM_Plex_Sans({ subsets: ['latin'], weight: ['400', '500'], variable: '--font-body' })
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
