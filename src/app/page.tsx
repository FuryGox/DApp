"use client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BuyOrder } from "@/components/BuyOrder";
import { SellOrder } from "@/components/SellOrder";
import { OrderList } from "@/components/OrderList";
import { MarketOverview } from "@/components/MarketOverview";
import data from "@/data/data.json";
import { Account } from "@/components/Account";
import { WalletOptions } from "@/components/wallet-option";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider, useAccount } from "wagmi";
import { config } from "@/lib/config";
import EquityChart from "@/components/EquityChart"; // Import the EquityChart component

function ConnectWallet() {
  const { isConnected } = useAccount();
  if (isConnected) return <Account />;
  return <WalletOptions />;
}

const queryClient = new QueryClient();

export default function NFTDApp() {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <div className="container mx-auto p-4">
          <header className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold">NFT DApp</h1>
            <ConnectWallet />
          </header>
          <Tabs defaultValue="buy" className="mb-2">
            <TabsList>
              <TabsTrigger value="buy">Buy NFT</TabsTrigger>
              <TabsTrigger value="sell">Sell NFT</TabsTrigger>
              <TabsTrigger value="orders">Orders</TabsTrigger>
            </TabsList>
            <TabsContent value="buy">
              <BuyOrder />
            </TabsContent>
            <TabsContent value="sell">
              <SellOrder />
            </TabsContent>
            <TabsContent value="orders">
              <OrderList />
            </TabsContent>
          </Tabs>
          <MarketOverview chartData={data.chartData}/>
          <EquityChart />
        </div>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
