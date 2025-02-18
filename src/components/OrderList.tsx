import { useEffect, useState } from "react";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { useReadContract, useAccount, useWriteContract } from "wagmi";
import { readContract } from "@wagmi/core";
import { formatUnits } from "ethers";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
// import { OrderEdit } from "./EditOrder";
import ConnectWallet from "./ConnectWallet";
import { fund_abi, FUND_CONTRACT_ADDRESS } from "@/lib/abi";
import { config } from "@/lib/config";

const shortenText = (text: string) => {
  return text.length > 14 ? text.slice(0, 6) + "..." + text.slice(-8) : text;
};

export function OrderList() {
  const [buyOrders, setBuyOrders] = useState<any[]>([]);
  const [sellOrders, setSellOrders] = useState<any[]>([]);

  const { address: userAddress, isConnected } = useAccount();
  const { writeContract } = useWriteContract();

  // Get the counter of buy orders
  const { data: buyNFTCounter } = useReadContract({
    account: userAddress,
    address: FUND_CONTRACT_ADDRESS,
    abi: fund_abi,
    functionName: "buyNFTCounter",
  });

  // Read sell orders as before
  const { data: sellNFTCounter } = useReadContract({
    account: userAddress,
    address: FUND_CONTRACT_ADDRESS,
    abi: fund_abi,
    functionName: "sellNFTCounter",
  });

  // Cancel buy order function
  const cancelOrderBuy = async (id: number) => {
    try {
      writeContract({
        account: userAddress,
        address: FUND_CONTRACT_ADDRESS,
        abi: fund_abi,
        functionName: "cancelBuyNFT",
        args: [BigInt(id)],
      });
    } catch (error) {
      console.warn(error);
    }
  };

  // Cancel sell order function
  const cancelOrderSell = async (id: number) => {
    try {
      writeContract({
        account: userAddress,
        address: FUND_CONTRACT_ADDRESS,
        abi: fund_abi,
        functionName: "cancelSellNFT",
        args: [BigInt(id)],
      });
    } catch (error) {
      console.warn(error);
    }
  };

  // Fetch buy orders based on buyNFTCounter
  useEffect(() => {
    if (buyNFTCounter && userAddress) {
      const counter = Number(buyNFTCounter.toString());
      const promises = [];
      for (let i: any = 0; i < counter; i++) {
        promises.push(
          readContract(config, {
            address: FUND_CONTRACT_ADDRESS,
            abi: fund_abi,
            functionName: "buyNFTHistory",
            args: [i],
          })
        );
      }
      Promise.all(promises)
        .then((orders) => {
          const parsedOrders = orders.map((order: any) => ({
            id: order[0].toString(),
            buyer: order[2],
            amount: formatUnits(order[3], 18),
            refund: formatUnits(order[4], 18),
            timestamp: new Date(Number(order[5]) * 1000).toLocaleString(),
            processed: order[6],
          }));
          // Filter orders so only the ones with buyer equal to the connected userAddress are included.
          // We convert both to lowercase for a case-insensitive comparison.
          const filteredOrders = parsedOrders.filter(
            (order) => order.buyer.toLowerCase() === userAddress.toLowerCase()
          );
          setBuyOrders(filteredOrders);
        })
        .catch((error) => {
          console.error("Error fetching buy orders:", error);
        });
    }
  }, [buyNFTCounter, userAddress]);

  // Parse sell orders when data is available
  // Fetch buy orders based on buyNFTCounter
  useEffect(() => {
    if (sellNFTCounter && userAddress) {
      const counter = Number(sellNFTCounter.toString());
      const promises = [];
      for (let i: any = 0; i < counter; i++) {
        promises.push(
          readContract(config, {
            address: FUND_CONTRACT_ADDRESS,
            abi: fund_abi,
            functionName: "sellNFTHistory",
            args: [i],
          })
        );
      }
      Promise.all(promises)
        .then((orders) => {
          const parsedOrders = orders.map((order: any) => ({
            id: order[0].toString(),
            seller: order[2],
            buyer: order[3],
            tokenId: order[4].toString(),
            price: formatUnits(order[5], 18),
            timestamp: new Date(Number(order[6]) * 1000).toLocaleString(),
            processed: order[7],
          }));
          // Filter orders so only the ones with seller equal to the connected userAddress are included.
          // We convert both to lowercase for a case-insensitive comparison.
          const filteredOrders = parsedOrders.filter(
            (order) => order.seller.toLowerCase() === userAddress.toLowerCase()
          );
          setSellOrders(filteredOrders);
        })
        .catch((error) => {
          console.error("Error fetching buy orders:", error);
        });
    }
  }, [buyNFTCounter, userAddress]);

  if (!isConnected) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Wallet Not Connected</CardTitle>
          <CardDescription>
            Please connect your wallet to view your orders.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ConnectWallet />
        </CardContent>
      </Card>
    );
  }
  //{<OrderEdit order={order} />}
  return (
    <div className="grid grid-cols-1 gap-4">
      {/* Buy Orders Table */}
      <Card>
        <CardHeader>
          <CardTitle>Buy Orders</CardTitle>
          <CardDescription>Manage your buy requests</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Id</TableHead>
                <TableHead>Buyer</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Refund</TableHead>
                <TableHead>Timestamp</TableHead>
                <TableHead>Processed</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {buyOrders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell>{order.id}</TableCell>
                  <TableCell>
                    <HoverCard>
                      <HoverCardTrigger asChild>
                        <Button variant="ghost">
                          {shortenText(order.buyer)}
                        </Button>
                      </HoverCardTrigger>
                      <HoverCardContent className="w-full">
                        <div>{order.buyer}</div>
                      </HoverCardContent>
                    </HoverCard>
                  </TableCell>
                  <TableCell>{order.amount}</TableCell>
                  <TableCell>{parseFloat(order.refund).toFixed(2)}</TableCell>
                  <TableCell>{order.timestamp}</TableCell>
                  <TableCell>
                    {order.processed ? "Processed" : "Pending"}
                  </TableCell>
                  <TableCell className="flex-row flex">
                    {!order.processed && (
                      <Button
                        variant="destructive"
                        size="sm"
                        className="ml-2"
                        onClick={() => cancelOrderBuy(Number(order.id))}
                      >
                        Cancel
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Sell Orders Table */}
      <Card>
        <CardHeader>
          <CardTitle>Sell Orders</CardTitle>
          <CardDescription>Manage your sell requests</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Seller</TableHead>
                <TableHead>Buyer</TableHead>
                <TableHead>Token ID</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Timestamp</TableHead>
                <TableHead>Processed</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sellOrders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell>{order.id}</TableCell>
                  <TableCell>
                    <HoverCard>
                      <HoverCardTrigger asChild>
                        <Button variant="ghost">
                          {shortenText(order.seller)}
                        </Button>
                      </HoverCardTrigger>
                      <HoverCardContent className="w-full">
                        <div>{order.seller}</div>
                      </HoverCardContent>
                    </HoverCard>
                  </TableCell>
                  <TableCell>
                    <HoverCard>
                      <HoverCardTrigger asChild>
                        <Button variant="ghost">
                          {shortenText(order.buyer)}
                        </Button>
                      </HoverCardTrigger>
                      <HoverCardContent className="w-full">
                        <div>{order.buyer}</div>
                      </HoverCardContent>
                    </HoverCard>
                  </TableCell>
                  <TableCell>{order.tokenId}</TableCell>
                  <TableCell>{parseFloat(order.price).toFixed(2)}</TableCell>
                  <TableCell>{order.timestamp}</TableCell>
                  <TableCell>{order.processed ? "Processed" : "Pending"}</TableCell>
                  <TableCell>
                    {!order.processed && (
                      <Button
                        variant="destructive"
                        size="sm"
                        className="ml-2"
                        onClick={() => cancelOrderSell(Number(order.id))}
                      >
                        Cancel
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
