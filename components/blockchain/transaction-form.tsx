"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { ArrowRightLeft } from "lucide-react"

interface TransactionFormProps {
  balance: number
  onSubmit: (to: string, amount: number, fee: number) => void
}

export function TransactionForm({ balance, onSubmit }: TransactionFormProps) {
  const [to, setTo] = useState("")
  const [amount, setAmount] = useState("")
  const [fee, setFee] = useState("0.001")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    // Validate inputs
    if (!to || !to.startsWith("aur1")) {
      toast({
        title: "Invalid address",
        description: "Please enter a valid Aurum.Gold address starting with 'aur1'",
        variant: "destructive",
      })
      return
    }

    const amountValue = Number.parseFloat(amount)
    const feeValue = Number.parseFloat(fee)

    if (isNaN(amountValue) || amountValue <= 0) {
      toast({
        title: "Invalid amount",
        description: "Please enter a valid amount greater than 0",
        variant: "destructive",
      })
      return
    }

    if (isNaN(feeValue) || feeValue < 0) {
      toast({
        title: "Invalid fee",
        description: "Please enter a valid fee (0 or greater)",
        variant: "destructive",
      })
      return
    }

    // Check if user has enough balance
    if (amountValue + feeValue > balance) {
      toast({
        title: "Insufficient balance",
        description: `Your balance of ${balance} $AUR is not enough for this transaction`,
        variant: "destructive",
      })
      return
    }

    // Submit transaction
    setIsSubmitting(true)

    try {
      onSubmit(to, amountValue, feeValue)

      // Reset form
      setTo("")
      setAmount("")
      setFee("0.001")

      toast({
        title: "Transaction submitted",
        description: `Successfully sent ${amountValue} $AUR to ${to}`,
        variant: "default",
      })
    } catch (error) {
      toast({
        title: "Transaction failed",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="recipient">Recipient Address</Label>
        <Input id="recipient" placeholder="aur1q6jf7..." value={to} onChange={(e) => setTo(e.target.value)} required />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="amount">Amount</Label>
          <Input
            id="amount"
            placeholder="0.00"
            type="number"
            step="0.000001"
            min="0.000001"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="fee">Network Fee</Label>
          <Input
            id="fee"
            placeholder="0.001"
            type="number"
            step="0.000001"
            min="0.000001"
            value={fee}
            onChange={(e) => setFee(e.target.value)}
            required
          />
        </div>
      </div>

      <Button type="submit" className="w-full bg-amber-500 hover:bg-amber-600" disabled={isSubmitting}>
        {isSubmitting ? (
          <span className="flex items-center">
            <span className="animate-spin mr-2">⟳</span> Processing...
          </span>
        ) : (
          <span className="flex items-center">
            <ArrowRightLeft className="mr-2 h-4 w-4" /> Send Transaction
          </span>
        )}
      </Button>
    </form>
  )
}
