"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Network, RefreshCw } from "lucide-react"

interface Peer {
  id: string
  ip: string
  client: string
  latency: number
  connectedSince: string
}

interface NodeStatusProps {
  version: string
  protocol: string
  networkId: string
  uptime: string
  currentBlock: number
  highestBlock: number
  syncStatus: "Synchronized" | "Syncing" | "Not Synced"
  lastSync: string
  peers: Peer[]
  onRefresh: () => void
  onAddPeer: () => void
}

export function NodeStatus({
  version,
  protocol,
  networkId,
  uptime,
  currentBlock,
  highestBlock,
  syncStatus,
  lastSync,
  peers,
  onRefresh,
  onAddPeer,
}: NodeStatusProps) {
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Network Status</CardTitle>
        <CardDescription>Monitor the Aurum.Gold network and node connections</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <div className="font-medium">Node Information</div>
            <div className="rounded-md border p-4 space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Version:</span>
                <span className="text-sm font-medium">{version}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Protocol:</span>
                <span className="text-sm font-medium">{protocol}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Network ID:</span>
                <span className="text-sm font-medium">{networkId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Uptime:</span>
                <span className="text-sm font-medium">{uptime}</span>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <div className="font-medium">Sync Status</div>
            <div className="rounded-md border p-4 space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Current Block:</span>
                <span className="text-sm font-medium">#{currentBlock.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Highest Block:</span>
                <span className="text-sm font-medium">#{highestBlock.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Sync Status:</span>
                <span
                  className={`text-sm font-medium ${
                    syncStatus === "Synchronized"
                      ? "text-green-600"
                      : syncStatus === "Syncing"
                        ? "text-amber-600"
                        : "text-red-600"
                  }`}
                >
                  {syncStatus}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Last Sync:</span>
                <span className="text-sm font-medium">{lastSync}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <div className="font-medium">Peer Connections</div>
          <div className="rounded-md border">
            <div className="p-4 bg-muted/50">
              <div className="grid grid-cols-5 text-sm font-medium">
                <div>Node ID</div>
                <div>IP Address</div>
                <div>Client</div>
                <div>Latency</div>
                <div>Connected Since</div>
              </div>
            </div>
            <div className="divide-y">
              {peers.length > 0 ? (
                peers.map((peer) => (
                  <div key={peer.id} className="p-4">
                    <div className="grid grid-cols-5 text-sm">
                      <div className="font-medium truncate">{peer.id}</div>
                      <div>{peer.ip}</div>
                      <div>{peer.client}</div>
                      <div>{peer.latency} ms</div>
                      <div>{peer.connectedSince}</div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-4 text-center text-muted-foreground">No peers connected</div>
              )}
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onRefresh}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <Button onClick={onAddPeer}>
            <Network className="mr-2 h-4 w-4" />
            Add Peer
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
