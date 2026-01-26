import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import AppHeader from "@/components/AppHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import {
  Wallet,
  Filter,
  Download,
  ChevronRight,
  CalendarIcon,
  ArrowUpRight,
  ArrowDownLeft,
  RotateCcw,
  Search,
} from "lucide-react";
import { format, subDays, startOfMonth, isWithinInterval, startOfDay, endOfDay } from "date-fns";
import { cn } from "@/lib/utils";
import {
  parentWallets,
  childWallets,
  childMembers,
  mockTransactions,
  activityTypeLabels,
  statusLabels,
  type WalletType,
  type TransactionType,
  type ActivityType,
  type Transaction,
} from "@/data/mockWalletData";
import { DateRange } from "react-day-picker";

type DateRangeOption = "today" | "last-7-days" | "last-month" | "custom";

const EWalletReports = () => {
  const navigate = useNavigate();
  
  // Mock role toggle (Parent/Child)
  const [isParent, setIsParent] = useState(true);
  
  // Filters
  const [selectedWallet, setSelectedWallet] = useState<WalletType>("e-topup");
  const [dateRangeOption, setDateRangeOption] = useState<DateRangeOption>("last-7-days");
  const [customDateRange, setCustomDateRange] = useState<DateRange | undefined>();
  const [transactionTypeFilter, setTransactionTypeFilter] = useState<TransactionType | "all">("all");
  const [activityTypeFilter, setActivityTypeFilter] = useState<ActivityType | "all">("all");
  const [memberFilter, setMemberFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  const wallets = isParent ? parentWallets : childWallets;
  const currentWallet = wallets.find((w) => w.id === selectedWallet) || wallets[0];

  // Calculate date range based on option
  const getDateRange = () => {
    const today = new Date();
    switch (dateRangeOption) {
      case "today":
        return { from: startOfDay(today), to: endOfDay(today) };
      case "last-7-days":
        return { from: startOfDay(subDays(today, 7)), to: endOfDay(today) };
      case "last-month":
        return { from: startOfMonth(today), to: endOfDay(today) };
      case "custom":
        return customDateRange?.from && customDateRange?.to
          ? { from: startOfDay(customDateRange.from), to: endOfDay(customDateRange.to) }
          : { from: startOfDay(today), to: endOfDay(today) };
      default:
        return { from: startOfDay(today), to: endOfDay(today) };
    }
  };

  // Filter transactions
  const filteredTransactions = useMemo(() => {
    const dateRange = getDateRange();
    
    return mockTransactions.filter((txn) => {
      // Wallet filter - only show transactions for selected wallet
      if (txn.walletType !== selectedWallet) {
        return false;
      }
      
      // Date filter
      if (!isWithinInterval(txn.date, { start: dateRange.from, end: dateRange.to })) {
        return false;
      }
      
      // Transaction type filter
      if (transactionTypeFilter !== "all" && txn.transactionType !== transactionTypeFilter) {
        return false;
      }
      
      // Activity type filter
      if (activityTypeFilter !== "all" && txn.activityType !== activityTypeFilter) {
        return false;
      }
      
      // Member filter (only for parent)
      if (isParent && memberFilter !== "all" && !txn.memberName.includes(memberFilter)) {
        return false;
      }
      
      // Search query
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return (
          txn.referenceId.toLowerCase().includes(query) ||
          txn.memberName.toLowerCase().includes(query) ||
          txn.description.toLowerCase().includes(query)
        );
      }
      
      return true;
    });
  }, [selectedWallet, dateRangeOption, customDateRange, transactionTypeFilter, activityTypeFilter, memberFilter, searchQuery, isParent]);

  const resetFilters = () => {
    setDateRangeOption("today");
    setCustomDateRange(undefined);
    setTransactionTypeFilter("all");
    setActivityTypeFilter("all");
    setMemberFilter("all");
    setSearchQuery("");
  };

  const getStatusColor = (status: Transaction["status"]) => {
    switch (status) {
      case "completed":
        return "text-success bg-success/10";
      case "pending":
        return "text-warning bg-warning/10";
      case "failed":
        return "text-destructive bg-destructive/10";
    }
  };

  return (
    <div className="mobile-container min-h-screen flex flex-col pb-20">
      <AppHeader title="E-Wallet Reports" showBack />

      {/* Role Toggle (Demo) */}
      <div className="px-4 mb-4">
        <div className="bg-card rounded-xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
              <Wallet className="w-4 h-4 text-primary" />
            </div>
            <span className="text-sm font-medium text-foreground">User Role (Demo)</span>
          </div>
          <div className="flex items-center gap-2">
            <Label htmlFor="role-toggle" className="text-sm text-muted-foreground">
              {isParent ? "Parent" : "Child"}
            </Label>
            <Switch
              id="role-toggle"
              checked={isParent}
              onCheckedChange={setIsParent}
            />
          </div>
        </div>
      </div>

      {/* Search & Filter Toggle */}
      <div className="px-4 mb-4">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Input
              placeholder="Search by Ref ID, Member..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-11 rounded-xl bg-card border-border pr-10"
            />
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          </div>
          <Button
            variant={showFilters ? "default" : "outline"}
            size="icon"
            className="h-11 w-11 rounded-xl"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Wallet Selection */}
      <div className="px-4 mb-4">
        <h3 className="text-sm font-semibold text-foreground mb-2">Select Wallet</h3>
        <div className="grid grid-cols-2 gap-3">
          {wallets.map((wallet) => (
            <button
              key={wallet.id}
              onClick={() => setSelectedWallet(wallet.id)}
              className={cn(
                "px-4 py-3 rounded-xl border-2 transition-all text-center",
                selectedWallet === wallet.id
                  ? "bg-primary/10 border-primary"
                  : "bg-card border-transparent"
              )}
            >
              <p className="text-sm font-medium text-foreground">{wallet.name}</p>
              <p className="text-lg font-bold text-primary">{wallet.balance} {wallet.currency}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="px-4 mb-4 animate-in slide-in-from-top-2 duration-200">
          <div className="bg-card rounded-xl p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold text-foreground">Filters</h4>
              <Button variant="ghost" size="sm" onClick={resetFilters} className="text-primary">
                <RotateCcw className="w-4 h-4 mr-1" />
                Reset
              </Button>
            </div>

            {/* Date Range */}
            <div>
              <Label className="text-sm text-muted-foreground mb-2 block">Date Range</Label>
              <Select value={dateRangeOption} onValueChange={(v) => setDateRangeOption(v as DateRangeOption)}>
                <SelectTrigger className="h-11 rounded-xl bg-background">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-card border-border z-50">
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="last-7-days">Last 7 Days</SelectItem>
                  <SelectItem value="last-month">Last Month</SelectItem>
                  <SelectItem value="custom">Custom Range</SelectItem>
                </SelectContent>
              </Select>
              
              {dateRangeOption === "custom" && (
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full mt-2 h-11 rounded-xl justify-start">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {customDateRange?.from ? (
                        customDateRange.to ? (
                          <>
                            {format(customDateRange.from, "MMM d")} - {format(customDateRange.to, "MMM d, yyyy")}
                          </>
                        ) : (
                          format(customDateRange.from, "MMM d, yyyy")
                        )
                      ) : (
                        <span>Pick a date range</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 bg-card border-border z-50" align="start">
                    <Calendar
                      initialFocus
                      mode="range"
                      defaultMonth={customDateRange?.from}
                      selected={customDateRange}
                      onSelect={setCustomDateRange}
                      numberOfMonths={1}
                      className="p-3 pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              )}
            </div>

            {/* Transaction Type */}
            <div>
              <Label className="text-sm text-muted-foreground mb-2 block">Transaction Type</Label>
              <Select value={transactionTypeFilter} onValueChange={(v) => setTransactionTypeFilter(v as TransactionType | "all")}>
                <SelectTrigger className="h-11 rounded-xl bg-background">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-card border-border z-50">
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="credit">Credit</SelectItem>
                  <SelectItem value="debit">Debit</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Activity Type */}
            <div>
              <Label className="text-sm text-muted-foreground mb-2 block">Activity Type</Label>
              <Select value={activityTypeFilter} onValueChange={(v) => setActivityTypeFilter(v as ActivityType | "all")}>
                <SelectTrigger className="h-11 rounded-xl bg-background">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-card border-border z-50">
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="recharge">Recharge</SelectItem>
                  <SelectItem value="transfer">Transfer</SelectItem>
                  <SelectItem value="rollback">Rollback</SelectItem>
                  <SelectItem value="voucher">Voucher</SelectItem>
                  <SelectItem value="bill-payment">Bill Payment</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Member Filter (Parent only) */}
            {isParent && (
              <div>
                <Label className="text-sm text-muted-foreground mb-2 block">Member</Label>
                <Select value={memberFilter} onValueChange={setMemberFilter}>
                  <SelectTrigger className="h-11 rounded-xl bg-background">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border z-50">
                    <SelectItem value="all">All Members</SelectItem>
                    {childMembers.map((member) => (
                      <SelectItem key={member.id} value={member.name}>
                        {member.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Transaction History */}
      <div className="px-4 flex-1">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-foreground">Transaction History</h3>
          <Button variant="ghost" size="sm" className="text-primary">
            <Download className="w-4 h-4 mr-1" />
            Export
          </Button>
        </div>

        {filteredTransactions.length === 0 ? (
          <div className="bg-card rounded-xl p-8 text-center">
            <p className="text-muted-foreground">No transactions found</p>
            <p className="text-sm text-muted-foreground mt-1">Try adjusting your filters</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredTransactions.map((txn) => (
              <div
                key={txn.id}
                onClick={() => navigate(`/ewallet-transaction/${txn.id}`)}
                className="bg-card rounded-xl p-4 cursor-pointer hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div
                      className={cn(
                        "w-10 h-10 rounded-full flex items-center justify-center",
                        txn.transactionType === "credit" ? "bg-success/10" : "bg-destructive/10"
                      )}
                    >
                      {txn.transactionType === "credit" ? (
                        <ArrowDownLeft className="w-5 h-5 text-success" />
                      ) : (
                        <ArrowUpRight className="w-5 h-5 text-destructive" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{txn.description}</p>
                      <p className="text-sm text-muted-foreground">{txn.memberName}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {format(txn.date, "MMM d, yyyy • h:mm a")}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p
                      className={cn(
                        "font-bold",
                        txn.transactionType === "credit" ? "text-success" : "text-destructive"
                      )}
                    >
                      {txn.transactionType === "credit" ? "+" : "-"}{txn.amount} {txn.currency}
                    </p>
                    <span className={cn("text-xs px-2 py-0.5 rounded-full mt-1 inline-block", getStatusColor(txn.status))}>
                      {statusLabels[txn.status]}
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
                  <p className="text-xs text-muted-foreground">Ref: {txn.referenceId}</p>
                  <div className="flex items-center gap-1 text-xs text-primary">
                    <span>View Details</span>
                    <ChevronRight className="w-4 h-4" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default EWalletReports;
