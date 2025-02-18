import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { fund_abi, FUND_CONTRACT_ADDRESS } from "@/lib/abi";
import { useEffect, useState, useCallback } from "react";
import {
  CartesianGrid,
  LabelList,
  Line,
  LineChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { useAccount, useReadContract } from "wagmi";
import { config } from "@/lib/config";
import { readContract } from "@wagmi/core";
import { formatUnits } from "ethers";

// Define the data type for history items
type HistoryData = {
  id: number | string;
  NFTPrice: number;
  totalAsset: number;
  totalBuyNFT: number;
  totalSellNFT: number;
  winRate: number;
  risk: number;
  timestamp: string;
};

// Chart configuration for tooltip and color theming
const chartConfig: ChartConfig = {
  NFTPrice: {
    label: "NFT Price",
    color: "hsl(var(--chart-1))",
  },
  totalAsset: {
    label: "Total Asset",
    color: "hsl(var(--chart-1))",
  },
  totalBuyNFT: {
    label: "Total Buy NFT",
    color: "hsl(var(--chart-1))",
  },
  totalSellNFT: {
    label: "Total Sell NFT",
    color: "hsl(var(--chart-1))",
  },
  winRate: {
    label: "Win Rate",
    color: "hsl(var(--chart-1))",
  },
  risk: {
    label: "Risk",
    color: "hsl(var(--chart-1))",
  },
};

// Helper function to format the timestamp for display
function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d
    .toLocaleString("vi-VN", {
      hour: "2-digit",
      day: "2-digit",
      month: "2-digit",
      year: "2-digit",
      hour12: true,
    })
    .replace(",", " -");
}

export function MarketOverview({ chartData }: any) {
  const { address: userAddress, isConnected } = useAccount();
  const [dataTable, setDataTable] = useState<HistoryData[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Read the session counter from the contract
  const { data: historyLength } = useReadContract({
    account: userAddress,
    address: FUND_CONTRACT_ADDRESS,
    abi: fund_abi,
    functionName: "sessionCounter",
  });

  // Fetch and update chart data using async/await for clarity
  const updateChartData = useCallback(async () => {
    if (isConnected && historyLength !== undefined) {
      setIsLoading(true);
      try {
        const counter = Number(historyLength);
        const promises = [];
        for (let i = 0; i < counter; i++) {
          promises.push(
            readContract(config, {
              account: userAddress,
              address: FUND_CONTRACT_ADDRESS,
              abi: fund_abi,
              functionName: "sessionHistory",
              args: [BigInt(i)],
            })
          );
        }
        const orders = await Promise.all(promises);
        const parsedOrders = orders.map((order: any) => ({
          id: order[0].toString(),
          NFTPrice: parseFloat(formatUnits(order[1], 18)),
          totalAsset: Number(formatUnits(order[2], 18)),
          totalBuyNFT: Number(formatUnits(order[3], 18)),
          totalSellNFT: Number(formatUnits(order[4], 18)),
          totalNFT: order[5].toString(),
          winRate: Number(formatUnits(order[6], 18)),
          risk: Number(formatUnits(order[7], 18)),
          timestamp: formatDate(new Date(Number(order[8]) * 1000)),
        }));
        setDataTable(parsedOrders);
      } catch (error) {
        console.error("Error fetching orders:", error);
      } finally {
        setIsLoading(false);
      }
    }
  }, [isConnected, historyLength, userAddress]);

  useEffect(() => {
    updateChartData();
  }, [updateChartData]);

  if (!isConnected) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Market Overview</CardTitle>
          <CardDescription>Connect wallet to view market data</CardDescription>
        </CardHeader>
        <CardContent>
          <p>Please connect your wallet to see the market overview.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mb-2">
      <CardHeader>
        <CardTitle>Market Overview</CardTitle>
        <CardDescription>NFT Price Trend Over the Last 24 Hours</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <p>Loading data...</p>
          </div>
        ) : dataTable.length === 0 ? (
          <div className="flex justify-center items-center h-64">
            <p>No data available</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={300} className="pt-8">
            <ChartContainer config={chartConfig}>
              <LineChart
                data={dataTable}
                margin={{
                  top: 60,
                  left: 30,
                  right: 30,
                }}
              >
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="timestamp"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  tickFormatter={(value) => value.slice(0, 11)}
                />
                <YAxis tickFormatter={(value) => `${value.toFixed(2)}`} />
                <Tooltip formatter={(value: number) => `${value.toFixed(2)}`} />
                <Line
                  dataKey="NFTPrice"
                  type="natural"
                  stroke="hsl(var(--chart-1))"
                  strokeWidth={2}
                  dot={{ fill: "hsl(var(--chart-1))" }}
                  activeDot={{ r: 6 }}
                >
                  <LabelList
                    dataKey="NFTPrice"
                    formatter={(value: number) => `${value.toFixed(2)}`}
                    position="top"
                    offset={12}
                    className="fill-foreground"
                    fontSize={12}
                  />
                </Line>
              </LineChart>
            </ChartContainer>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
