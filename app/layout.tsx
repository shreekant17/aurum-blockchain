import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { BlockchainProvider } from "@/contexts/blockchain-context"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Aurum.Gold Blockchain",
  description: "A custom Proof of Stake blockchain",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <BlockchainProvider>{children}</BlockchainProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}


import './globals.css'