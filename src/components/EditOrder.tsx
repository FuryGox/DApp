import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label";
import { Input } from "./ui/input";
import { useState } from "react";
import data from "@/data/data.json";
import * as React from "react"
import { Check, ChevronsUpDown } from "lucide-react"
import { cn } from "@/lib/utils"
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandItem,
    CommandList,
} from "@/components/ui/command"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"

const transaction_type = [
    {
        value: "buy",
        label: "Buy",
    },
    {
        value: "sell",
        label: "Sell",
    }
]

const amount_currency_list = [
    {
        value: "NFTS",
        label: "NFTS",
    },
    {
        value: "USDC",
        label: "USDC",
    }
]

interface Order {
    type: string;
    amount: number;
    amount_currency: string;
    estimated: number;
    estimated_currency: string;
}

interface OrderEditProps {
    order: Order;
}

export function OrderEdit({ order }: OrderEditProps) {
    const covert_rate = data.converst_rate;
    const [type, setType] = useState(order.type)
    const [type_open, SetType_open] = useState(false)
    const [amount, setAmount] = useState<number | null>(order.amount)
    const [amount_currency_open, SetAmount_currency_open] = useState(false)
    const [amount_currency, setAmount_currency] = useState(order.amount_currency)
    const [estimated, setEstimated] = useState<number | null>(order.estimated)
    const [estimated_currency_open, SetEstimated_currency_open] = useState(false)
    const [estimated_currency, setEstimated_currency] = useState(order.estimated_currency)
    const [error, SetError] = useState(false)

    const update_estimated = (from_currency: string, amount_tranfer: number | null) => {
        const conver_rate = covert_rate.find((rate) => rate.from === from_currency)?.rate;
        const conver_taget = (covert_rate.find((taget) => taget.from === from_currency)?.to) ?? 'Select currency...';
        setEstimated(((amount_tranfer ? amount_tranfer : 0) * (conver_rate ? conver_rate : 1)))
        setEstimated_currency(conver_taget)
    }

    const handlesSaveChange = () => {
        if (!type || !amount || !amount_currency || !estimated || !estimated_currency) {
            SetError(true)
        }
        else {
            SetError(false)
            console.log('ok')
        }
    }

    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button variant="outline">Edit</Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Edit Order</DialogTitle>
                    <DialogDescription>
                        <div className="space-y-2">
                            <Label htmlFor="edit_type">Chose Currency</Label>
                            <div id="edit_type" className='flex items-center'>
                                <Popover open={type_open} onOpenChange={SetType_open}>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="outline"
                                            role="combobox"
                                            aria-expanded={type_open}
                                            className="justify-between flex-grow"
                                        >
                                            {type
                                                ? transaction_type.find((_type) => _type.value === type)?.label
                                                : "Select Type..."}
                                            <ChevronsUpDown className="opacity-50" />
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-[200px] p-0">
                                        <Command>
                                            <CommandList>
                                                <CommandEmpty>No Type found.</CommandEmpty>
                                                <CommandGroup>
                                                    {transaction_type.map((_type) => (
                                                        <CommandItem
                                                            key={_type.value}
                                                            value={_type.value}
                                                            onSelect={(currentValue) => {
                                                                setType(currentValue === type ? "" : currentValue)

                                                                SetType_open(false)
                                                            }}
                                                        >
                                                            {_type.label}
                                                            <Check
                                                                className={cn(
                                                                    "ml-auto",
                                                                    type === _type.value ? "opacity-100" : "opacity-0"
                                                                )}
                                                            />
                                                        </CommandItem>
                                                    ))}
                                                </CommandGroup>
                                            </CommandList>
                                        </Command>
                                    </PopoverContent>
                                </Popover>
                            </div>
                        </div>
                        <div className=" mt-4">
                            <Label htmlFor="buyAmount" className="mt-4">Amount</Label>
                            <div className="flex items-center gap-1 mr-1">
                                <Input
                                    className="flex-grow-0"
                                    id="buyAmount"
                                    placeholder="Enter amount"
                                    value={amount?.toString()}
                                    onChange={(e) => {
                                        setAmount(Number(e.target.value))
                                        update_estimated(amount_currency, Number(e.target.value))
                                    }}
                                />
                                <div >
                                    <Popover open={amount_currency_open} onOpenChange={SetAmount_currency_open}>
                                        <PopoverTrigger asChild>
                                            <Button
                                                variant="outline"
                                                role="combobox"
                                                aria-expanded={amount_currency_open}
                                                className=" justify-between"
                                            >
                                                {amount_currency
                                                    ? amount_currency_list.find((currency) => currency.value === amount_currency)?.label
                                                    : "Select currency..."}
                                                <ChevronsUpDown className="opacity-50" />
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-[200px] p-0">
                                            <Command>
                                                <CommandList>
                                                    <CommandEmpty>No currency found.</CommandEmpty>
                                                    <CommandGroup>
                                                        {amount_currency_list.map((currency) => (
                                                            <CommandItem
                                                                key={currency.value}
                                                                value={currency.value}
                                                                onSelect={(currentValue) => {
                                                                    setAmount_currency(currentValue === amount_currency ? "" : currentValue)
                                                                    SetAmount_currency_open(false)
                                                                    update_estimated(currentValue, amount)
                                                                }}
                                                            >
                                                                {currency.label}
                                                                <Check
                                                                    className={cn(
                                                                        "ml-auto",
                                                                        amount_currency === currency.value ? "opacity-100" : "opacity-0"
                                                                    )}
                                                                />
                                                            </CommandItem>
                                                        ))}
                                                    </CommandGroup>
                                                </CommandList>
                                            </Command>
                                        </PopoverContent>
                                    </Popover>
                                </div>
                            </div>
                        </div>
                        <div className=" mt-4">
                            <Label htmlFor="estimatedAmount" className="mt-4">Estimated</Label>
                            <div className="flex items-center gap-1 mr-1">
                                <Input
                                    disabled
                                    className="flex-grow-0"
                                    id="estimatedAmount"
                                    placeholder="Enter amount"
                                    value={estimated?.toString()}
                                    onChange={(e) => setAmount(Number(e.target.value))}
                                />
                                <div>
                                    <Popover open={estimated_currency_open} onOpenChange={SetEstimated_currency_open}>
                                        <PopoverTrigger asChild>
                                            <Button
                                                disabled
                                                variant="outline"
                                                role="combobox"
                                                aria-expanded={estimated_currency_open}
                                                className=" justify-between"
                                            >
                                                {estimated_currency
                                                    ? amount_currency_list.find((currency) => currency.value === estimated_currency)?.label
                                                    : "Select currency..."}
                                                <ChevronsUpDown className="opacity-50" />
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-[200px] p-0">
                                            <Command>
                                                <CommandList>
                                                    <CommandEmpty>No currency found.</CommandEmpty>
                                                    <CommandGroup>
                                                        {amount_currency_list.map((currency) => (
                                                            <CommandItem
                                                                key={currency.value}
                                                                value={currency.value}
                                                                onSelect={(currentValue) => {
                                                                    setEstimated_currency(currentValue === estimated_currency ? "" : currentValue)
                                                                    SetEstimated_currency_open(false)
                                                                }}
                                                            >
                                                                {currency.label}
                                                                <Check
                                                                    className={cn(
                                                                        "ml-auto",
                                                                        estimated_currency === currency.value ? "opacity-100" : "opacity-0"
                                                                    )}
                                                                />
                                                            </CommandItem>
                                                        ))}
                                                    </CommandGroup>
                                                </CommandList>
                                            </Command>
                                        </PopoverContent>
                                    </Popover>
                                </div>
                            </div>
                        </div>
                        {error ?
                            <div className="text-red-500 mt-4">Error</div>
                            : <></>}
                    </DialogDescription>
                </DialogHeader>
                {/* Add form fields for editing */}
                <DialogFooter>
                    <DialogClose asChild>
                        <Button type="button" variant="secondary">
                            Close
                        </Button>
                    </DialogClose>
                    <Button type="submit" onClick={() => {
                        handlesSaveChange()
                    }}>Save changes</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}