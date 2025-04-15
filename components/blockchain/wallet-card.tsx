"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { ArrowRightLeft, Copy, Wallet } from "lucide-react"
import { TransactionForm } from "./transaction-form"
import { useToast } from "@/components/ui/use-toast"

interface Transaction {
  id: string
  type: "sent" | "received"
  amount: string
  from?: string
  to?: string
  time: string
}

interface WalletCardProps {
  address: string
  balance: number
  transactions: Transaction[]
  onSendTransaction: (to: string, amount: number, fee: number) => void
}

export function WalletCard({ address, balance, transactions, onSendTransaction }: WalletCardProps) {
  const [activeTab, setActiveTab] = useState("send")
  const { toast } = useToast()

  const handleCopyAddress = () => {
    navigator.clipboard.writeText(address)
    toast({
      title: "Address copied",
      description: "Wallet address copied to clipboard",
    })
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Wallet Overview</CardTitle>
        <CardDescription>Manage your Aurum.Gold wallet and transactions</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="text-sm font-medium text-muted-foreground">Total Balance</div>
            <div className="text-3xl font-bold">{balance.toFixed(2)} $AUR</div>
            <div className="text-sm text-muted-foreground">≈ ${(balance * 0.0842).toFixed(2)} USD</div>
          </div>
          <div className="flex gap-2">
            <Button
              className={`${activeTab === "send" ? "bg-amber-500 hover:bg-amber-600" : "bg-muted hover:bg-muted/80"}`}
              onClick={() => setActiveTab("send")}
            >
              <ArrowRightLeft className="mr-2 h-4 w-4" />
              Send
            </Button>
            <Button
              variant={activeTab === "receive" ? "default" : "outline"}
              className={activeTab === "receive" ? "bg-amber-500 hover:bg-amber-600" : ""}
              onClick={() => setActiveTab("receive")}
            >
              <Wallet className="mr-2 h-4 w-4" />
              Receive
            </Button>
          </div>
        </div>

        <div className="flex items-center justify-between p-3 bg-muted/50 rounded-md">
          <div className="text-sm truncate flex-1">
            <span className="text-muted-foreground mr-2">Address:</span>
            <span className="font-mono">{address}</span>
          </div>
          <Button variant="ghost" size="sm" onClick={handleCopyAddress}>
            <Copy className="h-4 w-4" />
          </Button>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsContent value="send" className="space-y-4 mt-4">
            <TransactionForm balance={balance} onSubmit={onSendTransaction} />
          </TabsContent>

          <TabsContent value="receive" className="space-y-4 mt-4">
            <div className="flex flex-col items-center justify-center p-6 border rounded-md">
              <div className="w-48 h-48 bg-white flex items-center justify-center mb-4 border">
                {/* QR code would be rendered here */}
                <div className="text-center p-4 border-2 border-dashed border-muted-foreground">
                  QR Code for
                  <br />
                  {address.substring(0, 8)}...
                </div>
              </div>
              <p className="text-sm text-center text-muted-foreground">
                Scan this QR code or share your address to receive $AUR
              </p>
              <Button variant="outline" className="mt-4" onClick={handleCopyAddress}>
                <Copy className="mr-2 h-4 w-4" />
                Copy Address
              </Button>
            </div>
          </TabsContent>
        </Tabs>

        <Separator />

        <div>
          <div className="font-medium mb-2">Recent Transactions</div>
          {transactions.length > 0 ? (
            <div className="space-y-2">
              {transactions.map((tx, i) => (
                <div key={i} className="flex items-center justify-between p-2 rounded-md border">
                  <div className="flex items-center gap-2">
                    <div
                      className={`p-1 rounded-full ${tx.type === "received" ? "bg-green-100 text-green-600" : "bg-amber-100 text-amber-600"}`}
                    >
                      {tx.type === "received" ? (
                        <ArrowRightLeft className="h-4 w-4 rotate-90" />
                      ) : (
                        <ArrowRightLeft className="h-4 w-4 -rotate-90" />
                      )}
                    </div>
                    <div>
                      <div className="font-medium">
                        {tx.type === "received" ? "Received" : "Sent"} {tx.amount} $AUR
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {tx.type === "received" ? `From: ${tx.from}` : `To: ${tx.to}`}
                      </div>
                    </div>
                  </div>
                  <div className="text-sm text-muted-foreground">{tx.time}</div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center p-4 text-muted-foreground">No transactions yet</div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
