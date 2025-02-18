import { useAccount, useDisconnect, useEnsAvatar, useEnsName } from "wagmi";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useSwitchChain } from "wagmi";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export function Account() {
  const { chainId } = useAccount();
  const { address } = useAccount();
  const { chains, switchChain } = useSwitchChain();
  const { disconnect } = useDisconnect();
  const { data: ensName } = useEnsName({ address });
  const { data: ensAvatar } = useEnsAvatar({ name: ensName! });

  function shortenString(str: string, endleng: number) {
    if (str.length <= 4 + endleng) {
      return str;
    }
    const start = str.slice(0, 4);
    const end = str.slice(-endleng);
    return `${start}...${end}`;
  }

  return (
    <div className="p-4 space-y-4">
      {/* Chain Selector */}
      <Popover>
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="w-full">
              Current chain: {chainId || "N/A"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-4">
            <Label className="text-lg font-medium mb-3">Choose Network:</Label>
            <Separator className="mb-4" />
            <div className="space-y-2">
              {chains.map((chain) => (
                <Button
                  key={chain.id}
                  className="w-full"
                  onClick={() => switchChain({ chainId: chain.id })}
                  disabled={chain.id === chainId}
                >
                  {chain.name}
                </Button>
              ))}
            </div>
          </PopoverContent>
        </Popover>
      </Popover>
      {/* Account Info */}
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className="w-full flex items-center space-x-3"
          >
            <Avatar>
              {ensAvatar ? (
                <AvatarImage src={ensAvatar} alt="ENS Avatar" />
              ) : (
                <AvatarFallback>?</AvatarFallback>
              )}
            </Avatar>
            <div className="text-left">
              <div className="font-medium">
                {ensName || shortenString(address || "", 8)}
              </div>
              <div className="text-sm text-gray-500">
                {shortenString(address || "", 8)}
              </div>
            </div>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80 p-4 bg-white shadow rounded-lg">
          <div className="space-y-4">
            <div>
              <Label className="text-base text-gray-800">Name:</Label>
              <div className="text-sm text-gray-600">
                {ensName || "Not available"}
              </div>
            </div>
            <Separator />
            <div>
              <Label className="text-base text-gray-800">Wallet Address:</Label>
              <div className="text-sm text-gray-600 font-mono break-words">
                {address || "N/A"}
              </div>
            </div>
            <Button
              variant="destructive"
              className="w-full"
              onClick={() => disconnect()}
            >
              Disconnect
            </Button>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
