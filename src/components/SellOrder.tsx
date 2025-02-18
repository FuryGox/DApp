"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { useAccount, useReadContract } from "wagmi"
import { type BaseError, useWriteContract, useWaitForTransactionReceipt } from "wagmi"
import { useState, useEffect } from "react"
import ConnectWallet from "./ConnectWallet"
import { fund_abi, FUND_CONTRACT_ADDRESS, NFT_abi } from "@/lib/abi"
import { readContract } from "@wagmi/core"
import { config } from "@/lib/config"

export function SellOrder() {
  // Set up transaction hooks.
  const { data: hash, error, writeContract } = useWriteContract()
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({ hash })
  const { address: userAddress, isConnected } = useAccount()
  const [tokenID, setTokenID] = useState("")
  const [ownedTokens, setOwnedTokens] = useState<string[]>([])

  // Get the NFT contract address from the fund contract.
  const { data: NFT_address } = useReadContract({
    account: userAddress,
    address: FUND_CONTRACT_ADDRESS,
    abi: fund_abi,
    functionName: "nftToken",
  })

  // Get the next token ID (i.e. total minted tokens) from the NFT contract.
  const { data: nextTokenId } = useReadContract({
    account: userAddress,
    address: NFT_address!,
    abi: NFT_abi,
    functionName: "nextTokenId",
  })

  useEffect(() => {
    const fetchOwnedTokens = async () => {
      if (nextTokenId && NFT_address && userAddress) {
        const totalTokens = Number(nextTokenId)
        const tokenPromises = []

        // Loop through all minted token IDs.
        for (let i = 1; i < totalTokens; i++) {
          tokenPromises.push(
            readContract(config, {
              account: userAddress,
              address: NFT_address,
              abi: NFT_abi,
              functionName: "ownerOf",
              args: [BigInt(i)],
            })
          )
        }

        try {
          // Resolve all ownerOf calls.
          const owners = await Promise.all(tokenPromises)
          // Filter token IDs that are owned by the connected user.
          const owned = owners
            .map((owner, i) => ({ tokenId: i + 1, owner }))
            .filter(({ owner }) => owner.toLowerCase() === userAddress.toLowerCase())
            .map(({ tokenId }) => tokenId.toString())
          setOwnedTokens(owned)
        } catch (error) {
          console.error("Error fetching token owners:", error)
        }
      }
    }

    fetchOwnedTokens()
  }, [nextTokenId, NFT_address, userAddress])

  async function handleSellOrder() {
    if (!isConnected || !tokenID) {
      console.error("Wallet is not connected or no token selected.")
      return
    }

    try {
      // Approve the fund contract to transfer the NFT.
      await writeContract({
        address: NFT_address!,
        abi: NFT_abi,
        functionName: "approve",
        args: [FUND_CONTRACT_ADDRESS, BigInt(tokenID)],
      })

      // Call sellNFT on the fund contract.
      await writeContract({
        address: FUND_CONTRACT_ADDRESS,
        abi: fund_abi,
        functionName: "sellNFT",
        args: [BigInt(tokenID)],
      })
    } catch (error) {
      console.error("Transaction failed:", error)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Place Sell Order</CardTitle>
        <CardDescription>
          {isConnected
            ? "Select the NFT token ID you want to sell"
            : "Please connect your wallet to place a sell order"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isConnected ? (
          <div className="space-y-2">
            <Label htmlFor="tokenId">Token ID</Label>
            <Select onValueChange={(value) => setTokenID(value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select a token ID" />
              </SelectTrigger>
              <SelectContent>
                {ownedTokens.map((token) => (
                  <SelectItem key={token} value={token}>
                    {token}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {hash && (
              <div>
                Transaction Hash:{" "}
                <a href={`https://testnet.bscscan.com/tx/${hash}`} target="_blank" rel="noopener noreferrer">
                  {hash}
                </a>
              </div>
            )}
            {isConfirming && <div>Waiting for confirmation...</div>}
            {isConfirmed && <div>Transaction confirmed.</div>}
            {error && <div>Error: {(error as BaseError).shortMessage || error.message}</div>}
          </div>
        ) : (
          <ConnectWallet />
        )}
      </CardContent>
      <CardFooter>
        {isConnected && (
          <Button onClick={handleSellOrder} disabled={!tokenID}>
            Place Sell Order
          </Button>
        )}
      </CardFooter>
    </Card>
  )
}
