"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsItem, TabsList } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Search } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

interface Block {
  index: number
  timestamp: number
  hash: string
  transactions: number
  size: number
  validator: string
}

interface Transaction {
  id: string
  timestamp: number
  from: string
  to: string
  amount: number
}

interface Validator {
  address: string
  stake: number
  blocksProduced: number
  isActive: boolean
}

interface BlockExplorerProps {
  blocks: Block[]
  transactions: Transaction[]
  validators: Validator[]
  onSearch: (query: string) => void
}

export function BlockExplorer({ blocks, transactions, validators, onSearch }: BlockExplorerProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [activeTab, setActiveTab] = useState("blocks")
  const { toast } = useToast()

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()

    if (!searchQuery.trim()) {
      toast({
        title: "Empty search",
        description: "Please enter a block, transaction, or address to search",
        variant: "destructive",
      })
      return
    }

    onSearch(searchQuery)
  }

  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)

    if (diffMins < 1) return "Just now"
    if (diffMins < 60) return `${diffMins} minutes ago`

    const diffHours = Math.floor(diffMins / 60)
    if (diffHours < 24) return `${diffHours} hours ago`

    const diffDays = Math.floor(diffHours / 24)
    return `${diffDays} days ago`
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Block Explorer</CardTitle>
        <CardDescription>Search and browse the Aurum.Gold blockchain</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <form onSubmit={handleSearch} className="flex gap-2">
          <Input
            placeholder="Search by block, transaction, or address..."
            className="flex-1"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <Button type="submit">
            <Search className="h-4 w-4" />
          </Button>
        </form>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsItem value="blocks">Blocks</TabsItem>
            <TabsItem value="transactions">Transactions</TabsItem>
            <TabsItem value="validators">Validators</TabsItem>
          </TabsList>

          <TabsContent value="blocks" className="space-y-4 mt-4">
            <div className="rounded-md border">
              <div className="p-4 bg-muted/50">
                <div className="grid grid-cols-5 text-sm font-medium">
                  <div>Block</div>
                  <div>Age</div>
                  <div>Transactions</div>
                  <div>Size</div>
                  <div>Validator</div>
                </div>
              </div>
              <div className="divide-y">
                {blocks.map((block) => (
                  <div key={block.index} className="p-4">
                    <div className="grid grid-cols-5 text-sm">
                      <div className="font-medium text-amber-600">#{block.index}</div>
                      <div>{formatTimestamp(block.timestamp)}</div>
                      <div>{block.transactions}</div>
                      <div>{block.size} KB</div>
                      <div className="truncate">{block.validator}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="transactions" className="space-y-4 mt-4">
            <div className="rounded-md border">
              <div className="p-4 bg-muted/50">
                <div className="grid grid-cols-5 text-sm font-medium">
                  <div>Transaction</div>
                  <div>Age</div>
                  <div>From</div>
                  <div>To</div>
                  <div>Amount</div>
                </div>
              </div>
              <div className="divide-y">
                {transactions.map((tx) => (
                  <div key={tx.id} className="p-4">
                    <div className="grid grid-cols-5 text-sm">
                      <div className="font-medium text-amber-600 truncate">{tx.id}</div>
                      <div>{formatTimestamp(tx.timestamp)}</div>
                      <div className="truncate">{tx.from}</div>
                      <div className="truncate">{tx.to}</div>
                      <div>{tx.amount.toFixed(2)} $AUR</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="validators" className="space-y-4 mt-4">
            <div className="rounded-md border">
              <div className="p-4 bg-muted/50">
                <div className="grid grid-cols-4 text-sm font-medium">
                  <div>Validator</div>
                  <div>Stake</div>
                  <div>Blocks Produced</div>
                  <div>Status</div>
                </div>
              </div>
              <div className="divide-y">
                {validators.map((validator, i) => (
                  <div key={i} className="p-4">
                    <div className="grid grid-cols-4 text-sm">
                      <div className="font-medium truncate">{validator.address}</div>
                      <div>{validator.stake.toFixed(2)} $AUR</div>
                      <div>{validator.blocksProduced}</div>
                      <div>
                        <Badge
                          variant="outline"
                          className={
                            validator.isActive
                              ? "bg-green-100 text-green-700 hover:bg-green-100"
                              : "bg-red-100 text-red-700 hover:bg-red-100"
                          }
                        >
                          {validator.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
