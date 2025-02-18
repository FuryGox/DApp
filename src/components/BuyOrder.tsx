import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  WagmiProvider,
  useAccount,
  useReadContract,
  useWriteContract,
  useWaitForTransactionReceipt,
} from "wagmi";
import { parseAbi } from "viem";
import { config } from "@/lib/config";
import ConnectWallet from "./ConnectWallet";
import { fund_abi, FUND_CONTRACT_ADDRESS, TOKEN_ADDRESS } from "@/lib/abi";
import { formatUnits } from "ethers";

const queryClient = new QueryClient();
export function BuyOrder() {
  const { data: hash, writeContract } = useWriteContract();
  const [buyAmount, setBuyAmount] = useState("");
  const [isPendingApproval, setPendingApproval] = useState(false);
  const [isPendingMint, setPendingMint] = useState(false);
  const [nftPrice, setNftPrice] = useState<number | null>(null);

  // Contract interaction hooks
  const { address: userAddress, isConnected } = useAccount();

  // Allowance
  const { data: allowance, refetch: refetchAllowance } = useReadContract({
    address: TOKEN_ADDRESS,
    abi: parseAbi([
      "function allowance(address owner, address spender) view returns (uint256)",
    ]),
    functionName: "allowance",
    args: [userAddress as any, FUND_CONTRACT_ADDRESS],
  });
  const { isLoading: isWaitingForApproval, isSuccess: isApprovalConfirmed } =
    useWaitForTransactionReceipt({
      hash,
    });
  const { isLoading: isWaitingForMint, isSuccess: isMintConfirmed } =
    useWaitForTransactionReceipt({
      hash,
    });

  // 1. Read the session counter from the contract
  const { data: sessionCounter } = useReadContract({
    address: FUND_CONTRACT_ADDRESS,
    abi: fund_abi,
    functionName: "sessionCounter",
  });

  // 2. Determine the latest session index (if available)
  // Here we use sessionCounter directly (assuming it holds the latest index)
  // Convert sessionCounter to a number.
  const numericIndex = Number(sessionCounter);

  // If numericIndex is greater than 0, subtract 1 and convert to BigInt;
  // otherwise, leave sessionIndex undefined.
  const sessionIndex = numericIndex > 0 ? BigInt(numericIndex - 1) : undefined;

  const { data: sessionData } = useReadContract({
    address: FUND_CONTRACT_ADDRESS,
    abi: fund_abi,
    functionName: "sessionHistory",
    args: [sessionIndex!],
  });


  // 4. Once sessionData is available, extract the nftPrice.
  useEffect(() => {
    if (sessionData) {
      // Extract the nftPrice from index 1
      setNftPrice(Number(parseFloat(formatUnits(sessionData[1], 18)).toFixed(2)));

    }
  }, [sessionData]);

  // Buy function
  const handleBuyOrder = async () => {
    try {
      const buyAmountWei = BigInt(buyAmount) * BigInt(10 ** 18); // Convert amount to wei
      if (!allowance || BigInt(allowance) < buyAmountWei) {
        // Approve tokens if allowance is insufficient
        setPendingApproval(true);
        writeContract({
          address: TOKEN_ADDRESS,
          abi: parseAbi(["function approve(address spender, uint256 amount)"]),
          functionName: "approve",
          args: [FUND_CONTRACT_ADDRESS, BigInt(buyAmountWei)],
        });
        setPendingApproval(false);
        await refetchAllowance(); // Refresh allowance
      }
      // Call buyNFT
      setPendingMint(true);
      writeContract({
        address: FUND_CONTRACT_ADDRESS,
        abi: fund_abi,
        functionName: "buyNFT",
        args: [BigInt(buyAmountWei)],
      });
      setPendingMint(false);
    } catch (error) {
      console.error("Transaction failed:", error);
      setPendingApproval(false);
      setPendingMint(false);
    }
  };

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <Card>
          <CardHeader>
            <CardTitle>Place Buy Order</CardTitle>
            <CardDescription>
              {isConnected
                ? "Enter USDC amount"
                : "Please connect your wallet to place a buy order"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isConnected ? (
              <div className="space-y-2">
                <Input
                  id="buyAmount"
                  placeholder="Enter USDC amount"
                  value={buyAmount}
                  onChange={(e) => setBuyAmount(e.target.value)}
                />
                <p>
                  Estimated NFTs:{" "}
                  {buyAmount
                    ? Math.floor(Number.parseFloat(buyAmount))
                    : 0}
                </p>
                {/* Display the NFT Price */}
                <p>
                  NFT Price:{" "}
                  {nftPrice !== null ? nftPrice : "Loading price..."}
                </p>
                {hash && (
                  <div>
                    Transaction Hash:{" "}
                    <a
                      href={`https://testnet.bscscan.com/tx/${hash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {hash}
                    </a>
                  </div>
                )}
                {isWaitingForApproval && <div>Waiting for approval...</div>}
                {isApprovalConfirmed && (
                  <div>Approval transaction confirmed!</div>
                )}
                {isWaitingForMint && <div>Waiting for mint transaction...</div>}
                {isMintConfirmed && <div>Mint transaction confirmed!</div>}
              </div>
            ) : (
              <ConnectWallet />
            )}
          </CardContent>
          <CardFooter>
            {isConnected ? (
              <Button onClick={handleBuyOrder}>
                {isPendingApproval
                  ? "Approving..."
                  : isPendingMint
                    ? "Minting..."
                    : "Place Buy Order"}
              </Button>
            ) : (
              <></>
            )}
          </CardFooter>
        </Card>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
