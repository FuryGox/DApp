'use client'
import { Account } from "@/components/Account";
import { WalletOptions } from "@/components/wallet-option";
import { useAccount } from "wagmi";

export default function ConnectWallet() {
    const { isConnected } = useAccount();
    if (isConnected) return <Account />;
    return <WalletOptions />;
}