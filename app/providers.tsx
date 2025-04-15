"use client"

import { ThemeProvider } from "@/components/theme-provider"
import { BlockchainProvider } from "@/contexts/blockchain-context"

export function Providers({ children }: { children: React.ReactNode }) {
    return (
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
            <BlockchainProvider>{children}</BlockchainProvider>
        </ThemeProvider>
    )
} 