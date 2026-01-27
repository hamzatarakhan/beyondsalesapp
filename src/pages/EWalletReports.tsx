import { useState, useMemo } from "react";
import AppHeader from "@/components/AppHeader";
import ActivityDistribution from "@/components/ActivityDistribution";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
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
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
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
  X,
  Share2,
  Copy,
  Check,
  Link2,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { format, subDays, startOfMonth, isWithinInterval, startOfDay, endOfDay } from "date-fns";
import { cn } from "@/lib/utils";
import {
  parentWallets,
  childWallets,
  childMembers,
  mockTransactions,
  activityTypeLabels,
  statusLabels,
  memberWalletBalances,
  type WalletType,
  type TransactionType,
  type ActivityType,
  type Transaction,
} from "@/data/mockWalletData";
import { DateRange } from "react-day-picker";

type DateRangeOption = "today" | "last-7-days" | "last-month" | "custom";
type WalletViewMode = "my-wallets" | "team-wallets";

const EWalletReports = () => {
  // Mock role toggle (Parent/Child)
  const [isParent, setIsParent] = useState(true);
  
  // Wallet view mode (Parent only: my-wallets vs team-wallets)
  const [walletViewMode, setWalletViewMode] = useState<WalletViewMode>("my-wallets");
  
  // Filters
  const [selectedWallet, setSelectedWallet] = useState<WalletType>("e-topup");
  const [dateRangeOption, setDateRangeOption] = useState<DateRangeOption>("last-7-days");
  const [customDateRange, setCustomDateRange] = useState<DateRange | undefined>();
  const [transactionTypeFilter, setTransactionTypeFilter] = useState<TransactionType | "all">("all");
  const [activityTypeFilter, setActivityTypeFilter] = useState<ActivityType | "all">("all");
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  
  // Transaction details drawer
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  // Parent's own wallets (My Wallets)
  const myWallets = parentWallets;
  
  // Team wallets - aggregate balances from all child members
  const teamWallets = useMemo(() => {
    const aggregatedBalances = childMembers.reduce(
      (acc, member) => {
        const memberBalance = memberWalletBalances.find((m) => m.memberName === member.name);
        if (memberBalance) {
          acc["e-topup"] += memberBalance.wallets["e-topup"];
          acc["e-voucher"] += memberBalance.wallets["e-voucher"];
        }
        return acc;
      },
      { "e-topup": 0, "e-voucher": 0 }
    );
    
    return [
      { id: "e-topup" as WalletType, name: "E-Topup", balance: aggregatedBalances["e-topup"], currency: "KD" },
      { id: "e-voucher" as WalletType, name: "E-Voucher", balance: aggregatedBalances["e-voucher"], currency: "KD" },
    ];
  }, []);
  
  // Get current wallets based on role and view mode
  const currentWallets = useMemo(() => {
    if (!isParent) {
      return childWallets;
    }
    return walletViewMode === "my-wallets" ? myWallets : teamWallets;
  }, [isParent, walletViewMode, myWallets, teamWallets]);
  
  // Dynamic wallet balances based on selected members (for team wallets)
  const displayWallets = useMemo(() => {
    if (!isParent || walletViewMode === "my-wallets" || selectedMembers.length === 0) {
      return currentWallets;
    }
    
    // Aggregate balances for selected members only
    const aggregatedBalances = selectedMembers.reduce(
      (acc, memberName) => {
        const memberBalance = memberWalletBalances.find((m) => m.memberName === memberName);
        if (memberBalance) {
          acc["e-topup"] += memberBalance.wallets["e-topup"];
          acc["e-voucher"] += memberBalance.wallets["e-voucher"];
        }
        return acc;
      },
      { "e-topup": 0, "e-voucher": 0 }
    );
    
    return currentWallets.map((wallet) => ({
      ...wallet,
      balance: aggregatedBalances[wallet.id],
    }));
  }, [isParent, walletViewMode, selectedMembers, currentWallets]);
  
  const currentWallet = displayWallets.find((w) => w.id === selectedWallet) || displayWallets[0];

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

  // Get parent member name for filtering
  const parentMemberName = "Hamza";
  
  // Filter transactions based on wallet view mode
  const filteredTransactions = useMemo(() => {
    const dateRange = getDateRange();
    
    return mockTransactions.filter((txn) => {
      // Wallet filter - only show transactions for selected wallet
      if (txn.walletType !== selectedWallet) {
        return false;
      }
      
      // For parent users, filter by view mode
      if (isParent) {
        if (walletViewMode === "my-wallets") {
          // Only show parent's own transactions
          if (txn.memberName !== parentMemberName) {
            return false;
          }
        } else {
          // Team wallets - show child member transactions only
          if (txn.memberName === parentMemberName) {
            return false;
          }
          // If specific members are selected, filter by them
          if (selectedMembers.length > 0 && !selectedMembers.includes(txn.memberName)) {
            return false;
          }
        }
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
  }, [selectedWallet, dateRangeOption, customDateRange, transactionTypeFilter, activityTypeFilter, selectedMembers, searchQuery, isParent, walletViewMode]);

  const resetFilters = () => {
    setDateRangeOption("last-7-days");
    setCustomDateRange(undefined);
    setTransactionTypeFilter("all");
    setActivityTypeFilter("all");
    setSelectedMembers([]);
    setSearchQuery("");
  };

  const toggleMember = (memberName: string) => {
    setSelectedMembers((prev) =>
      prev.includes(memberName)
        ? prev.filter((m) => m !== memberName)
        : [...prev, memberName]
    );
  };

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (dateRangeOption !== "last-7-days") count++;
    if (transactionTypeFilter !== "all") count++;
    if (activityTypeFilter !== "all") count++;
    if (selectedMembers.length > 0) count++;
    return count;
  }, [dateRangeOption, transactionTypeFilter, activityTypeFilter, selectedMembers]);

  const getDateRangeLabel = () => {
    switch (dateRangeOption) {
      case "today":
        return "Today";
      case "last-7-days":
        return "Last 7 Days";
      case "last-month":
        return "Last Month";
      case "custom":
        if (customDateRange?.from && customDateRange?.to) {
          return `${format(customDateRange.from, "MMM d")} - ${format(customDateRange.to, "MMM d")}`;
        }
        return "Custom";
      default:
        return "";
    }
  };

  const removeMember = (memberName: string) => {
    setSelectedMembers((prev) => prev.filter((m) => m !== memberName));
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

      {/* Wallet View Mode Toggle (Parent only) */}
      {isParent && (
        <div className="px-4 mb-3">
          <div className="bg-muted rounded-xl p-1 flex">
            <button
              onClick={() => setWalletViewMode("my-wallets")}
              className={cn(
                "flex-1 py-2.5 rounded-lg text-sm font-medium transition-all",
                walletViewMode === "my-wallets"
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground"
              )}
            >
              My Wallets
            </button>
            <button
              onClick={() => setWalletViewMode("team-wallets")}
              className={cn(
                "flex-1 py-2.5 rounded-lg text-sm font-medium transition-all",
                walletViewMode === "team-wallets"
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground"
              )}
            >
              Team Wallets
            </button>
          </div>
        </div>
      )}

      {/* Search & Filter Toggle */}
      <div className="px-4 mb-4">
        <div className="flex w-full gap-2">
          <div className="relative flex-1">
            <Input
              placeholder="Search by Ref ID, Member..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-11 rounded-xl bg-card border-border pr-10"
            />
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          </div>
          <Drawer open={isFilterOpen} onOpenChange={setIsFilterOpen}>
            <DrawerTrigger asChild>
              <Button
                variant={activeFiltersCount > 0 ? "default" : "outline"}
                size="icon"
                className="h-11 w-11 rounded-xl relative"
              >
                <Filter className="w-5 h-5" />
                {activeFiltersCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-destructive text-destructive-foreground text-xs rounded-full flex items-center justify-center">
                    {activeFiltersCount}
                  </span>
                )}
              </Button>
            </DrawerTrigger>
            <DrawerContent>
              <DrawerHeader className="border-b border-border">
                <div className="flex items-center justify-between">
                  <DrawerTitle>Filters</DrawerTitle>
                  <Button variant="ghost" size="sm" onClick={resetFilters} className="text-primary">
                    <RotateCcw className="w-4 h-4 mr-1" />
                    Reset
                  </Button>
                </div>
              </DrawerHeader>
              <div className="p-4 space-y-4 max-h-[60vh] overflow-y-auto">
                {/* Member Filter (Parent only, Team Wallets view) */}
                {isParent && walletViewMode === "team-wallets" && (
                  <div>
                    <Label className="text-sm font-medium text-foreground mb-3 block">Select Members</Label>
                    <div className="space-y-2">
                      {childMembers.map((member) => (
                        <div
                          key={member.id}
                          className="flex items-center gap-3 p-3 rounded-xl bg-muted/50"
                        >
                          <Checkbox
                            id={member.id}
                            checked={selectedMembers.includes(member.name)}
                            onCheckedChange={() => toggleMember(member.name)}
                          />
                          <Label
                            htmlFor={member.id}
                            className="text-sm font-medium cursor-pointer flex-1"
                          >
                            {member.name}
                          </Label>
                        </div>
                      ))}
                    </div>
                    {selectedMembers.length > 0 && (
                      <p className="text-xs text-muted-foreground mt-2">
                        {selectedMembers.length} member(s) selected
                      </p>
                    )}
                  </div>
                )}

                {/* Date Range */}
                <div>
                  <Label className="text-sm font-medium text-foreground mb-2 block">Date Range</Label>
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
                      <PopoverContent className="w-auto p-0 bg-card border-border z-[100]" align="start">
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
                  <Label className="text-sm font-medium text-foreground mb-2 block">Transaction Type</Label>
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
                  <Label className="text-sm font-medium text-foreground mb-2 block">Activity Type</Label>
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
              </div>
              <DrawerFooter className="border-t border-border">
                <DrawerClose asChild>
                  <Button className="w-full h-12 rounded-xl">Apply Filters</Button>
                </DrawerClose>
              </DrawerFooter>
            </DrawerContent>
          </Drawer>
        </div>

        {/* Active Filter Chips */}
        {activeFiltersCount > 0 && (
          <div className="flex flex-wrap gap-2 mt-3 items-center">
            {/* Member Filters (Parent only) */}
            {isParent && walletViewMode === "team-wallets" && selectedMembers.map((member) => (
              <Badge
                key={member}
                variant="secondary"
                className="pl-2 pr-1 py-1 gap-1 cursor-pointer hover:bg-secondary/80"
              >
                <span className="text-xs">{member}</span>
                <button
                  onClick={() => removeMember(member)}
                  className="ml-1 rounded-full hover:bg-muted p-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            ))}
            
            {/* Date Range Filter */}
            {dateRangeOption !== "last-7-days" && (
              <Badge
                variant="secondary"
                className="pl-2 pr-1 py-1 gap-1 cursor-pointer hover:bg-secondary/80"
              >
                <span className="text-xs">{getDateRangeLabel()}</span>
                <button
                  onClick={() => {
                    setDateRangeOption("last-7-days");
                    setCustomDateRange(undefined);
                  }}
                  className="ml-1 rounded-full hover:bg-muted p-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            )}
            
            {/* Transaction Type Filter */}
            {transactionTypeFilter !== "all" && (
              <Badge
                variant="secondary"
                className="pl-2 pr-1 py-1 gap-1 cursor-pointer hover:bg-secondary/80"
              >
                <span className="text-xs">{transactionTypeFilter === "credit" ? "Credit" : "Debit"}</span>
                <button
                  onClick={() => setTransactionTypeFilter("all")}
                  className="ml-1 rounded-full hover:bg-muted p-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            )}
            
            {/* Activity Type Filter */}
            {activityTypeFilter !== "all" && (
              <Badge
                variant="secondary"
                className="pl-2 pr-1 py-1 gap-1 cursor-pointer hover:bg-secondary/80"
              >
                <span className="text-xs">{activityTypeLabels[activityTypeFilter]}</span>
                <button
                  onClick={() => setActivityTypeFilter("all")}
                  className="ml-1 rounded-full hover:bg-muted p-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            )}
          </div>
        )}
      </div>

      {/* Wallet Selection */}
      <div className="px-4 mb-4">
        <h3 className="text-sm font-semibold text-foreground mb-2">
          {isParent && walletViewMode === "team-wallets" ? "Team Wallet Balance" : "Select Wallet"}
        </h3>
        <div className="grid grid-cols-2 gap-3">
          {displayWallets.map((wallet) => (
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
              <p className="text-lg font-bold text-primary">{wallet.balance.toFixed(2)} {wallet.currency}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Activity Distribution for Selected Wallet */}
      <div className="px-4 mb-4">
        <ActivityDistribution
          transactions={mockTransactions.filter((t) => {
            const dateRange = getDateRange();
            const matchesDate = isWithinInterval(t.date, { start: dateRange.from, end: dateRange.to });
            
            // Filter by view mode for parent
            if (isParent) {
              if (walletViewMode === "my-wallets") {
                if (t.memberName !== parentMemberName) return false;
              } else {
                if (t.memberName === parentMemberName) return false;
                if (selectedMembers.length > 0 && !selectedMembers.includes(t.memberName)) return false;
              }
            }
            
            return t.walletType === selectedWallet && matchesDate;
          })}
          walletType={selectedWallet}
        />
      </div>


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
                onClick={() => {
                  setSelectedTransaction(txn);
                  setIsDetailsOpen(true);
                }}
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
                      {isParent && <p className="text-sm text-muted-foreground">{txn.memberName}</p>}
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

      {/* Transaction Details Bottom Sheet */}
      <Drawer open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DrawerContent className="max-h-[85vh]">
          {selectedTransaction && (
            <div className="overflow-y-auto">
              <DrawerHeader className="text-center pb-0">
                <div
                  className={cn(
                    "w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4",
                    selectedTransaction.transactionType === "credit" ? "bg-success/10" : "bg-destructive/10"
                  )}
                >
                  {selectedTransaction.transactionType === "credit" ? (
                    <ArrowDownLeft className="w-8 h-8 text-success" />
                  ) : (
                    <ArrowUpRight className="w-8 h-8 text-destructive" />
                  )}
                </div>
                <p
                  className={cn(
                    "text-3xl font-bold",
                    selectedTransaction.transactionType === "credit" ? "text-success" : "text-destructive"
                  )}
                >
                  {selectedTransaction.transactionType === "credit" ? "+" : "-"}{selectedTransaction.amount} {selectedTransaction.currency}
                </p>
                <span className={cn("text-sm px-3 py-1 rounded-full mt-2 inline-block", getStatusColor(selectedTransaction.status))}>
                  {statusLabels[selectedTransaction.status]}
                </span>
              </DrawerHeader>

              {/* Transaction Details */}
              <div className="px-4 py-4">
                <div className="bg-muted rounded-xl divide-y divide-border">
                  <div className="p-3 flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Transaction Type</span>
                    <span className="font-medium text-foreground capitalize">{selectedTransaction.transactionType}</span>
                  </div>
                  <div className="p-3 flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Activity</span>
                    <span className="font-medium text-foreground">{activityTypeLabels[selectedTransaction.activityType]}</span>
                  </div>
                  <div className="p-3 flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Description</span>
                    <span className="font-medium text-foreground">{selectedTransaction.description}</span>
                  </div>
                  <div className="p-3 flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Date & Time</span>
                    <span className="font-medium text-foreground">{format(selectedTransaction.date, "MMM d, yyyy • h:mm a")}</span>
                  </div>
                  <div className="p-3 flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Member</span>
                    <span className="font-medium text-foreground">{selectedTransaction.memberName}</span>
                  </div>
                  <div className="p-3 flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Reference ID</span>
                    <span className="font-medium text-foreground text-xs">{selectedTransaction.referenceId}</span>
                  </div>
                </div>
              </div>

              {/* Balance Impact */}
              <div className="px-4 pb-4">
                <h3 className="font-semibold text-foreground mb-2 text-sm">Balance Impact</h3>
                <div className="bg-muted rounded-xl divide-y divide-border">
                  <div className="p-3 flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Amount</span>
                    <span
                      className={cn(
                        "font-bold",
                        selectedTransaction.transactionType === "credit" ? "text-success" : "text-destructive"
                      )}
                    >
                      {selectedTransaction.transactionType === "credit" ? "+" : "-"}{selectedTransaction.amount} {selectedTransaction.currency}
                    </span>
                  </div>
                  <div className="p-3 flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Balance Before</span>
                    <span className="font-medium text-foreground">{selectedTransaction.balanceBefore} {selectedTransaction.currency}</span>
                  </div>
                  <div className="p-3 flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Balance After</span>
                    <span className="font-medium text-foreground">{selectedTransaction.balanceAfter} {selectedTransaction.currency}</span>
                  </div>
                </div>
              </div>

              <DrawerFooter className="pt-0">
                <div className="flex gap-2 w-full">
                  <Button
                    variant="outline"
                    className="flex-1 h-11 rounded-xl"
                    onClick={() => {
                      const shareLink = `https://ewallet.example.com/txn/${selectedTransaction.referenceId}`;
                      navigator.clipboard.writeText(shareLink);
                      setCopied(true);
                      toast({
                        title: "Link copied!",
                        description: "The shareable link has been copied to your clipboard.",
                      });
                      setTimeout(() => setCopied(false), 2000);
                    }}
                  >
                    {copied ? <Check className="w-4 h-4 mr-2 text-success" /> : <Share2 className="w-4 h-4 mr-2" />}
                    {copied ? "Copied" : "Share"}
                  </Button>
                  <Button
                    className="flex-1 h-11 rounded-xl"
                    onClick={() => {
                      toast({
                        title: "Exporting as PDF",
                        description: "Your transaction details will be downloaded shortly.",
                      });
                    }}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Export PDF
                  </Button>
                </div>
              </DrawerFooter>
            </div>
          )}
        </DrawerContent>
      </Drawer>
    </div>
  );
};


export default EWalletReports;
