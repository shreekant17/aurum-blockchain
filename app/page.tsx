"use client"

import { useBlockchain } from "@/contexts/blockchain-context"
import { Tabs, TabsContent, TabsItem, TabsList } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Activity, ArrowRightLeft, Blocks, Coins, RefreshCw, Shield } from "lucide-react"
import { useEffect, useState } from "react"
import { WalletCard } from "@/components/blockchain/wallet-card"
import { BlockExplorer } from "@/components/blockchain/block-explorer"
import { NodeStatus } from "@/components/blockchain/node-status"
import { useToast } from "@/components/ui/use-toast"

export default function Home() {
  const { blockchainInfo, latestBlocks, nodeStatus, currentWallet, refreshData, createTransaction, isLoading, error } =
    useBlockchain()

  const [activeTab, setActiveTab] = useState("overview")
  const { toast } = useToast()

  // Show error toast if there's an error
  useEffect(() => {
    if (error) {
      toast({
        title: "Error",
        description: error,
        variant: "destructive",
      })
    }
  }, [error, toast])

  // Handle refresh button click
  const handleRefresh = async () => {
    await refreshData()
    toast({
      title: "Refreshed",
      description: "Blockchain data has been refreshed",
    })
  }

  // Handle transaction submission
  const handleSendTransaction = async (to: string, amount: number, fee: number) => {
    if (!currentWallet) {
      toast({
        title: "No wallet selected",
        description: "Please select a wallet first",
        variant: "destructive",
      })
      return
    }

    // Prompt for password (in a real app, use a modal)
    const password = prompt("Enter your wallet password:")
    if (!password) return

    const result = await createTransaction(currentWallet.address, to, amount, fee, password)

    if (result) {
      toast({
        title: "Transaction sent",
        description: `Transaction ID: ${result.id}`,
      })
    }
  }

  // Mock data for components that need it
  const mockTransactions = [
    { id: "tx1", type: "received", amount: "12.5", from: "aur1q6j...", time: "2 hours ago" },
    { id: "tx2", type: "sent", amount: "5.0", to: "aur1q7k...", time: "1 day ago" },
    { id: "tx3", type: "received", amount: "20.0", from: "aur1q8l...", time: "3 days ago" },
  ]

  const mockBlocks =
    latestBlocks.length > 0
      ? latestBlocks
      : Array(5)
          .fill(0)
          .map((_, i) => ({
            index: 1248901 - i,
            timestamp: Date.now() - i * 120000,
            hash: `0x${Array(8)
              .fill(0)
              .map(() => Math.floor(Math.random() * 16).toString(16))
              .join("")}...`,
            transactions: Math.floor(Math.random() * 50) + 10,
            size: Math.floor(Math.random() * 100) + 50,
            validator: `aur1val${i}...`,
          }))

  const mockTransactionList = Array(5)
    .fill(0)
    .map((_, i) => ({
      id: `0x${Array(8)
        .fill(0)
        .map(() => Math.floor(Math.random() * 16).toString(16))
        .join("")}...`,
      timestamp: Date.now() - i * 300000,
      from: `aur1q${i}...`,
      to: `aur1q${i + 5}...`,
      amount: Number.parseFloat((Math.random() * 10).toFixed(2)),
    }))

  const mockValidators = Array(5)
    .fill(0)
    .map((_, i) => ({
      address: `aur1val${i}...`,
      stake: Number.parseFloat((Math.random() * 100000).toFixed(2)),
      blocksProduced: Math.floor(Math.random() * 10000),
      isActive: true,
    }))

  const mockPeers = Array(5)
    .fill(0)
    .map((_, i) => ({
      id: `node${i}${Array(8)
        .fill(0)
        .map(() => Math.floor(Math.random() * 16).toString(16))
        .join("")}`,
      ip: `192.168.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
      client: "Aurum Core v0.1.0",
      latency: Math.floor(Math.random() * 100),
      connectedSince: `${Math.floor(Math.random() * 24) + 1} hours ago`,
    }))

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-br from-amber-50 to-amber-100 dark:from-zinc-900 dark:to-zinc-800">
      <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center">
          <div className="flex items-center gap-2 font-bold text-xl">
            <Coins className="h-6 w-6 text-amber-500" />
            <span>Aurum.Gold</span>
            <Badge variant="outline" className="ml-2 font-mono text-xs">
              $AUR
            </Badge>
          </div>
          <div className="flex flex-1 items-center justify-end space-x-4">
            <nav className="flex items-center space-x-2">
              <Button variant="ghost" size="sm">
                Network
              </Button>
              <Button variant="ghost" size="sm">
                Wallet
              </Button>
              <Button variant="ghost" size="sm">
                Explorer
              </Button>
              <Button variant="ghost" size="sm">
                Docs
              </Button>
            </nav>
            <Button
              variant="default"
              className="bg-amber-500 hover:bg-amber-600"
              onClick={handleRefresh}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Loading...
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Refresh
                </>
              )}
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1 container py-6">
        <div className="grid gap-6 md:grid-cols-2">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Aurum.Gold Dashboard</h1>
            <p className="text-muted-foreground mt-2">Manage your $AUR blockchain node, wallet, and network status</p>
          </div>
          <div className="flex items-center justify-end gap-2">
            <div className="flex items-center gap-2">
              <div
                className={`h-2 w-2 rounded-full ${nodeStatus?.syncStatus === "synchronized" ? "bg-green-500" : "bg-amber-500"}`}
              ></div>
              <span className="text-sm">
                {nodeStatus?.syncStatus === "synchronized" ? "Node Connected" : "Node Syncing"}
              </span>
            </div>
            <Separator orientation="vertical" className="h-6" />
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                <Blocks className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">Block: {nodeStatus?.currentBlock?.toLocaleString() || "1,248,901"}</span>
              </div>
            </div>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-6">
          <TabsList>
            <TabsItem value="overview">Overview</TabsItem>
            <TabsItem value="wallet">Wallet</TabsItem>
            <TabsItem value="explorer">Explorer</TabsItem>
            <TabsItem value="network">Network</TabsItem>
            <TabsItem value="settings">Settings</TabsItem>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">$AUR Price</CardTitle>
                  <Coins className="h-4 w-4 text-amber-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">$0.0842</div>
                  <p className="text-xs text-muted-foreground">
                    <span className="text-green-500">+2.5%</span> from yesterday
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Network Hashrate</CardTitle>
                  <Activity className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">1.24 TH/s</div>
                  <p className="text-xs text-muted-foreground">
                    <span className="text-green-500">+5.1%</span> from last week
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Active Validators</CardTitle>
                  <Shield className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{blockchainInfo?.validators || 1248}</div>
                  <p className="text-xs text-muted-foreground">
                    <span className="text-green-500">+12</span> new this month
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Transactions (24h)</CardTitle>
                  <ArrowRightLeft className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">24,521</div>
                  <p className="text-xs text-muted-foreground">
                    <span className="text-green-500">+18.2%</span> from yesterday
                  </p>
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
              <Card className="col-span-4">
                <CardHeader>
                  <CardTitle>Network Activity</CardTitle>
                  <CardDescription>Transaction volume and network activity over time</CardDescription>
                </CardHeader>
                <CardContent className="h-[300px] flex items-center justify-center">
                  <div className="text-muted-foreground">Network activity chart will render here</div>
                </CardContent>
              </Card>

              <Card className="col-span-3">
                <CardHeader>
                  <CardTitle>Latest Blocks</CardTitle>
                  <CardDescription>Most recently mined blocks on the Aurum.Gold blockchain</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {mockBlocks.slice(0, 5).map((block, i) => (
                      <div key={i} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Blocks className="h-5 w-5 text-amber-500" />
                          <div>
                            <div className="font-medium">Block #{block.index}</div>
                            <div className="text-xs text-muted-foreground">
                              {new Date(block.timestamp).toLocaleTimeString()}
                            </div>
                          </div>
                        </div>
                        <div className="text-sm">{block.transactions} txns</div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="wallet" className="space-y-4">
            <WalletCard
              address={currentWallet?.address || "aur1q6jf7..."}
              balance={currentWallet ? 1245.82 : 0}
              transactions={mockTransactions}
              onSendTransaction={handleSendTransaction}
            />
          </TabsContent>

          <TabsContent value="explorer" className="space-y-4">
            <BlockExplorer
              blocks={mockBlocks}
              transactions={mockTransactionList}
              validators={mockValidators}
              onSearch={(query) => console.log("Searching for:", query)}
            />
          </TabsContent>

          <TabsContent value="network" className="space-y-4">
            <NodeStatus
              version={nodeStatus?.version || "Aurum Core v0.1.0"}
              protocol={nodeStatus?.networkId || "1.0"}
              networkId={nodeStatus?.networkId || "aurum-mainnet"}
              uptime={nodeStatus ? formatUptime(Date.now() - nodeStatus.startTime) : "3d 12h 45m"}
              currentBlock={nodeStatus?.currentBlock || 1248901}
              highestBlock={nodeStatus?.highestBlock || 1248901}
              syncStatus={nodeStatus?.syncStatus || "Synchronized"}
              lastSync={nodeStatus ? formatTimeSince(Date.now() - 120000) : "2 minutes ago"}
              peers={mockPeers}
              onRefresh={handleRefresh}
              onAddPeer={() => {
                const ip = prompt("Enter peer IP address:")
                const port = prompt("Enter peer port:")
                if (ip && port) {
                  toast({
                    title: "Peer added",
                    description: `Connected to ${ip}:${port}`,
                  })
                }
              }}
            />
          </TabsContent>

          <TabsContent value="settings" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Node Settings</CardTitle>
                <CardDescription>Configure your Aurum.Gold node settings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="font-medium">Network Configuration</div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="grid gap-2">
                      <Label htmlFor="rpc-port">RPC Port</Label>
                      <Input id="rpc-port" defaultValue={nodeStatus?.rpcPort || "8545"} />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="p2p-port">P2P Port</Label>
                      <Input id="p2p-port" defaultValue={nodeStatus?.p2pPort || "30303"} />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="max-peers">Max Peers</Label>
                      <Input id="max-peers" defaultValue="50" type="number" />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="network-id">Network ID</Label>
                      <Input id="network-id" defaultValue={nodeStatus?.networkId || "aurum-mainnet"} />
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="space-y-2">
                  <div className="font-medium">Blockchain Settings</div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="grid gap-2">
                      <Label htmlFor="data-dir">Data Directory</Label>
                      <Input id="data-dir" defaultValue="/var/lib/aurum" />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="log-level">Log Level</Label>
                      <Input id="log-level" defaultValue={process.env.LOG_LEVEL || "info"} />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="min-stake">Minimum Stake (for validators)</Label>
                      <Input id="min-stake" defaultValue="1000" type="number" />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="block-time">Target Block Time (seconds)</Label>
                      <Input id="block-time" defaultValue="15" type="number" />
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="space-y-2">
                  <div className="font-medium">Security Settings</div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="grid gap-2">
                      <Label htmlFor="keystore">Keystore Location</Label>
                      <Input id="keystore" defaultValue="/var/lib/aurum/keystore" />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="unlock-account">Unlock Account</Label>
                      <Input id="unlock-account" placeholder="Account address to unlock" />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-2">
                  <Button variant="outline">Reset to Defaults</Button>
                  <Button className="bg-amber-500 hover:bg-amber-600">Save Settings</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}

// Helper function to format uptime
function formatUptime(ms: number): string {
  const seconds = Math.floor(ms / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  return `${days}d ${hours % 24}h ${minutes % 60}m`
}

// Helper function to format time since
function formatTimeSince(ms: number): string {
  const seconds = Math.floor(ms / 1000)

  if (seconds < 60) return `${seconds} seconds ago`

  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes} minutes ago`

  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} hours ago`

  const days = Math.floor(hours / 24)
  return `${days} days ago`
}
