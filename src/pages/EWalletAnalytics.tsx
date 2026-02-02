import { useState, useMemo } from "react";
import AppHeader from "@/components/AppHeader";
import ActivityDistribution from "@/components/ActivityDistribution";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { Calendar } from "@/components/ui/calendar";
import {
  Wallet,
  Filter,
  CalendarIcon,
  X,
  ChevronRight,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { format, subDays, isWithinInterval, startOfDay, endOfDay } from "date-fns";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import {
  parentWallets,
  childWallets,
  childMembers,
  mockTransactions,
  activityTypeLabels,
  memberWalletBalances,
  type WalletType,
  type TransactionType,
  type ActivityType,
} from "@/data/mockWalletData";
import { DateRange } from "react-day-picker";

type DateRangeOption = "today" | "last-7-days" | "last-30-days" | "custom";
type WalletViewMode = "my-wallets" | "team-wallets";

const EWalletAnalytics = () => {
  const navigate = useNavigate();
  
  // Mock role toggle (Parent/Child)
  const [isParent, setIsParent] = useState(true);
  
  // Wallet view mode (Parent only: my-wallets vs team-wallets)
  const [walletViewMode, setWalletViewMode] = useState<WalletViewMode>("my-wallets");
  
  // Filters
  const [selectedWallet, setSelectedWallet] = useState<WalletType>("e-topup");
  const [dateRangeOption, setDateRangeOption] = useState<DateRangeOption>("last-7-days");
  const [customDateRange, setCustomDateRange] = useState<DateRange | undefined>();
  const [transactionTypeFilter, setTransactionTypeFilter] = useState<TransactionType | "all">("all");
  const [activityTypeFilters, setActivityTypeFilters] = useState<ActivityType[]>([]);
  const [statusFilters, setStatusFilters] = useState<Array<"completed" | "pending" | "failed">>([]);
  const [selectedMember, setSelectedMember] = useState<string | null>(null);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [rankingTab, setRankingTab] = useState<"top" | "lowest">("top");

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
          acc["e-cash"] += memberBalance.wallets["e-cash"];
          acc["rewards"] += memberBalance.wallets["rewards"];
          acc["credit-line"] += memberBalance.wallets["credit-line"];
        }
        return acc;
      },
      { "e-topup": 0, "e-voucher": 0, "e-cash": 0, "rewards": 0, "credit-line": 0 }
    );
    
    return [
      { id: "e-topup" as WalletType, name: "E-Topup", balance: aggregatedBalances["e-topup"], currency: "KD" },
      { id: "e-voucher" as WalletType, name: "E-Voucher", balance: aggregatedBalances["e-voucher"], currency: "KD" },
      { id: "e-cash" as WalletType, name: "E-Cash", balance: aggregatedBalances["e-cash"], currency: "KD" },
      { id: "rewards" as WalletType, name: "Rewards", balance: aggregatedBalances["rewards"], currency: "KD" },
      { id: "credit-line" as WalletType, name: "Credit Line", balance: aggregatedBalances["credit-line"], currency: "KD" },
    ];
  }, []);

  // Top 5 and lowest 5 children wallets for selected wallet type
  const childrenWalletRanking = useMemo(() => {
    if (!isParent || walletViewMode !== "team-wallets") return null;
    
    const childBalances = childMembers.map((member) => {
      const memberBalance = memberWalletBalances.find((m) => m.memberName === member.name);
      const transactionCount = mockTransactions.filter(
        (t) => t.memberName === member.name && t.walletType === selectedWallet
      ).length;
      return {
        name: member.name,
        balance: memberBalance?.wallets[selectedWallet] || 0,
        transactionCount,
      };
    }).sort((a, b) => b.balance - a.balance);
    
    return {
      top5: childBalances.slice(0, 5),
      lowest5: childBalances.slice(-5).reverse(),
    };
  }, [isParent, walletViewMode, selectedWallet]);
  
  // Get current wallets based on role and view mode
  const currentWallets = useMemo(() => {
    if (!isParent) {
      return childWallets;
    }
    return walletViewMode === "my-wallets" ? myWallets : teamWallets;
  }, [isParent, walletViewMode, myWallets, teamWallets]);
  
  // Dynamic wallet balances based on selected member (for team wallets)
  const displayWallets = useMemo(() => {
    if (!isParent || walletViewMode === "my-wallets" || !selectedMember) {
      return currentWallets;
    }
    
    const memberBalance = memberWalletBalances.find((m) => m.memberName === selectedMember);
    if (!memberBalance) {
      return currentWallets;
    }
    
    return currentWallets.map((wallet) => ({
      ...wallet,
      balance: memberBalance.wallets[wallet.id],
    }));
  }, [isParent, walletViewMode, selectedMember, currentWallets]);

  // Calculate date range based on option
  const getDateRange = () => {
    const today = new Date();
    switch (dateRangeOption) {
      case "today":
        return { from: startOfDay(today), to: endOfDay(today) };
      case "last-7-days":
        return { from: startOfDay(subDays(today, 7)), to: endOfDay(today) };
      case "last-30-days":
        return { from: startOfDay(subDays(today, 30)), to: endOfDay(today) };
      case "custom":
        return customDateRange?.from && customDateRange?.to
          ? { from: startOfDay(customDateRange.from), to: endOfDay(customDateRange.to) }
          : { from: startOfDay(today), to: endOfDay(today) };
      default:
        return { from: startOfDay(today), to: endOfDay(today) };
    }
  };

  const parentMemberName = "Hamza";

  const resetFilters = () => {
    setDateRangeOption("last-7-days");
    setCustomDateRange(undefined);
    setTransactionTypeFilter("all");
    setActivityTypeFilters([]);
    setStatusFilters([]);
    setSelectedMember(null);
  };

  const clearMember = () => {
    setSelectedMember(null);
  };

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (dateRangeOption !== "last-7-days") count++;
    if (transactionTypeFilter !== "all") count++;
    if (activityTypeFilters.length > 0) count += activityTypeFilters.length;
    if (statusFilters.length > 0) count += statusFilters.length;
    if (selectedMember) count++;
    return count;
  }, [dateRangeOption, transactionTypeFilter, activityTypeFilters, statusFilters, selectedMember]);

  const getDateRangeLabel = () => {
    switch (dateRangeOption) {
      case "today":
        return "Today";
      case "last-7-days":
        return "Last 7 days";
      case "last-30-days":
        return "Last 30 days";
      case "custom":
        if (customDateRange?.from && customDateRange?.to) {
          return `${format(customDateRange.from, "MMM d")} - ${format(customDateRange.to, "MMM d")}`;
        }
        return "Custom Date";
      default:
        return "";
    }
  };

  return (
    <div className="mobile-container min-h-screen flex flex-col pb-20">
      <AppHeader title="E-Wallet Analytics" showBack />

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

      {/* Global Filters */}
      <div className="px-4 mb-3">
        <div className="flex items-center gap-2">
          <Drawer open={isFilterOpen} onOpenChange={setIsFilterOpen}>
            <DrawerTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "h-10 rounded-xl gap-2 flex-1",
                  activeFiltersCount > 0 && "bg-primary text-primary-foreground border-primary hover:bg-primary/90"
                )}
              >
                <Filter className="w-4 h-4" />
                <span>Filters</span>
                {activeFiltersCount > 0 && (
                  <Badge variant="secondary" className="ml-1 h-5 w-5 p-0 flex items-center justify-center text-[10px] bg-destructive text-destructive-foreground">
                    {activeFiltersCount}
                  </Badge>
                )}
              </Button>
            </DrawerTrigger>
            <DrawerContent className="max-h-[85vh]">
              {/* Header with close button */}
              <div className="relative pt-2 pb-4 px-4 text-center">
                <h3 className="text-lg font-semibold text-foreground">Filter</h3>
                <p className="text-sm text-muted-foreground mt-1">Please choose your filter options</p>
                <DrawerClose asChild>
                  <button className="absolute right-4 top-4 w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                    <X className="w-4 h-4 text-muted-foreground" />
                  </button>
                </DrawerClose>
              </div>

              <div className="px-4 pb-4 space-y-5 overflow-y-auto">
                {/* Member Filter (Parent only, Team Wallets view) */}
                {isParent && walletViewMode === "team-wallets" && (
                  <div>
                    <Label className="text-sm font-medium text-foreground mb-3 block">Select Member</Label>
                    <div className="flex flex-wrap gap-2">
                      {childMembers.map((member) => (
                        <button
                          key={member.id}
                          onClick={() => setSelectedMember(selectedMember === member.name ? null : member.name)}
                          className={cn(
                            "px-4 py-2 rounded-full text-sm font-medium transition-all border",
                            selectedMember === member.name
                              ? "bg-primary text-primary-foreground border-primary"
                              : "bg-background text-foreground border-border hover:border-primary/50"
                          )}
                        >
                          {selectedMember !== member.name && <span className="mr-1">+</span>}
                          {member.name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Date Range */}
                <div>
                  <Label className="text-sm font-medium text-foreground mb-3 block">Date Range</Label>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { value: "today" as DateRangeOption, label: "Today" },
                      { value: "last-7-days" as DateRangeOption, label: "Last 7 days" },
                      { value: "last-30-days" as DateRangeOption, label: "Last 30 days" },
                      { value: "custom" as DateRangeOption, label: "Custom Date" },
                    ].map((option) => (
                      <button
                        key={option.value}
                        onClick={() => setDateRangeOption(option.value)}
                        className={cn(
                          "px-4 py-2 rounded-full text-sm font-medium transition-all border",
                          dateRangeOption === option.value
                            ? "bg-primary text-primary-foreground border-primary"
                            : "bg-background text-foreground border-border hover:border-primary/50"
                        )}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                  
                  {dateRangeOption === "custom" && (
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full mt-3 h-11 rounded-xl justify-start">
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
                  <Label className="text-sm font-medium text-foreground mb-3 block">Transaction Type</Label>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { value: "all" as const, label: "All" },
                      { value: "credit" as const, label: "Credit" },
                      { value: "debit" as const, label: "Debit" },
                    ].map((option) => (
                      <button
                        key={option.value}
                        onClick={() => setTransactionTypeFilter(option.value)}
                        className={cn(
                          "px-4 py-2 rounded-full text-sm font-medium transition-all border",
                          transactionTypeFilter === option.value
                            ? "bg-primary text-primary-foreground border-primary"
                            : "bg-background text-foreground border-border hover:border-primary/50"
                        )}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Activity Type (Multi-select) */}
                <div>
                  <Label className="text-sm font-medium text-foreground mb-3 block">Activity Type</Label>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => setActivityTypeFilters([])}
                      className={cn(
                        "px-4 py-2 rounded-full text-sm font-medium transition-all border",
                        activityTypeFilters.length === 0
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-background text-foreground border-border hover:border-primary/50"
                      )}
                    >
                      All
                    </button>
                    {[
                      { value: "transfer" as ActivityType, label: "Transfer" },
                      { value: "voucher" as ActivityType, label: "Voucher" },
                      { value: "bill-payment" as ActivityType, label: "Bill pay" },
                    ].map((option) => {
                      const isSelected = activityTypeFilters.includes(option.value);
                      return (
                        <button
                          key={option.value}
                          onClick={() => {
                            if (isSelected) {
                              setActivityTypeFilters(activityTypeFilters.filter(v => v !== option.value));
                            } else {
                              setActivityTypeFilters([...activityTypeFilters, option.value]);
                            }
                          }}
                          className={cn(
                            "px-4 py-2 rounded-full text-sm font-medium transition-all border",
                            isSelected
                              ? "bg-primary text-primary-foreground border-primary"
                              : "bg-background text-foreground border-border hover:border-primary/50"
                          )}
                        >
                          {!isSelected && <span className="mr-1">+</span>}
                          {option.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Activity Status (Multi-select) */}
                <div>
                  <Label className="text-sm font-medium text-foreground mb-3 block">Activity Status</Label>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => setStatusFilters([])}
                      className={cn(
                        "px-4 py-2 rounded-full text-sm font-medium transition-all border",
                        statusFilters.length === 0
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-background text-foreground border-border hover:border-primary/50"
                      )}
                    >
                      All
                    </button>
                    {[
                      { value: "completed" as const, label: "Completed" },
                      { value: "pending" as const, label: "Pending" },
                      { value: "failed" as const, label: "Failed" },
                    ].map((option) => {
                      const isSelected = statusFilters.includes(option.value);
                      return (
                        <button
                          key={option.value}
                          onClick={() => {
                            if (isSelected) {
                              setStatusFilters(statusFilters.filter(v => v !== option.value));
                            } else {
                              setStatusFilters([...statusFilters, option.value]);
                            }
                          }}
                          className={cn(
                            "px-4 py-2 rounded-full text-sm font-medium transition-all border",
                            isSelected
                              ? "bg-primary text-primary-foreground border-primary"
                              : "bg-background text-foreground border-border hover:border-primary/50"
                          )}
                        >
                          {!isSelected && <span className="mr-1">+</span>}
                          {option.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="px-4 pb-6 pt-2 space-y-3">
                <DrawerClose asChild>
                  <Button className="w-full h-12 rounded-full text-base font-medium">Apply</Button>
                </DrawerClose>
                <button
                  onClick={resetFilters}
                  className="w-full text-center text-primary font-medium text-sm"
                >
                  Clear Filter
                </button>
              </div>
            </DrawerContent>
          </Drawer>
        </div>

        {/* Active Filter Chips */}
        {activeFiltersCount > 0 && (
          <div className="flex flex-wrap gap-2 mt-2 items-center">
            {isParent && walletViewMode === "team-wallets" && selectedMember && (
              <Badge variant="secondary" className="pl-2 pr-1 py-1 gap-1">
                <span className="text-xs">{selectedMember}</span>
                <button onClick={clearMember} className="ml-1 rounded-full hover:bg-muted p-0.5">
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            )}
            {dateRangeOption !== "last-7-days" && (
              <Badge variant="secondary" className="pl-2 pr-1 py-1 gap-1">
                <span className="text-xs">{getDateRangeLabel()}</span>
                <button onClick={() => { setDateRangeOption("last-7-days"); setCustomDateRange(undefined); }} className="ml-1 rounded-full hover:bg-muted p-0.5">
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            )}
            {transactionTypeFilter !== "all" && (
              <Badge variant="secondary" className="pl-2 pr-1 py-1 gap-1">
                <span className="text-xs">{transactionTypeFilter === "credit" ? "Credit" : "Debit"}</span>
                <button onClick={() => setTransactionTypeFilter("all")} className="ml-1 rounded-full hover:bg-muted p-0.5">
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            )}
            {activityTypeFilters.map((filter) => (
              <Badge key={filter} variant="secondary" className="pl-2 pr-1 py-1 gap-1">
                <span className="text-xs">{activityTypeLabels[filter]}</span>
                <button onClick={() => setActivityTypeFilters(activityTypeFilters.filter(v => v !== filter))} className="ml-1 rounded-full hover:bg-muted p-0.5">
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            ))}
            {statusFilters.map((filter) => (
              <Badge key={filter} variant="secondary" className="pl-2 pr-1 py-1 gap-1">
                <span className="text-xs capitalize">{filter}</span>
                <button onClick={() => setStatusFilters(statusFilters.filter(v => v !== filter))} className="ml-1 rounded-full hover:bg-muted p-0.5">
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            ))}
          </div>
        )}
      </div>

      {/* Wallet Balance Cards - Horizontal Scroll */}
      <div className="mb-4">
        <div className="flex gap-3 overflow-x-auto scrollbar-hide px-4 pb-1">
          {displayWallets.map((wallet) => (
            <button
              key={wallet.id}
              onClick={() => setSelectedWallet(wallet.id)}
              className={cn(
                "flex-shrink-0 w-40 rounded-2xl p-4 text-left transition-all",
                selectedWallet === wallet.id
                  ? "bg-gradient-to-br from-primary to-primary/80 text-primary-foreground ring-2 ring-primary ring-offset-2 ring-offset-background"
                  : "bg-gradient-to-br from-muted to-muted/80 text-foreground"
              )}
            >
              <div className={cn(
                "w-8 h-8 rounded-lg flex items-center justify-center mb-3",
                selectedWallet === wallet.id
                  ? "bg-primary-foreground/20"
                  : "bg-background/50"
              )}>
                <Wallet className="w-4 h-4" />
              </div>
              <p className={cn(
                "text-xs mb-1",
                selectedWallet === wallet.id ? "opacity-75" : "text-muted-foreground"
              )}>{wallet.name}</p>
              <p className="text-lg font-bold">
                {wallet.balance.toFixed(2)} <span className="text-sm font-normal">{wallet.currency}</span>
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* Members Ranking (Parent Team View only, hidden when member filtered) */}
      {isParent && walletViewMode === "team-wallets" && !selectedMember && childrenWalletRanking && (
        <div className="px-4 mb-4">
          <div className="bg-card rounded-xl border overflow-hidden">
            <div className="p-4 pb-0">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Member Wallet Ranking</p>
            </div>
            {/* Tabs */}
            <div className="px-4 pt-2">
              <div className="flex border-b border-border">
                <button
                  onClick={() => setRankingTab("top")}
                  className={cn(
                    "flex-1 py-2 text-sm font-medium border-b-2 transition-colors",
                    rankingTab === "top"
                      ? "border-primary text-primary"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  )}
                >
                  Top 5
                </button>
                <button
                  onClick={() => setRankingTab("lowest")}
                  className={cn(
                    "flex-1 py-2 text-sm font-medium border-b-2 transition-colors",
                    rankingTab === "lowest"
                      ? "border-primary text-primary"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  )}
                >
                  Lowest 5
                </button>
              </div>
            </div>
            
            {/* Members List */}
            <div className="p-4 space-y-0">
              {(rankingTab === "top" ? childrenWalletRanking.top5 : childrenWalletRanking.lowest5).map((member, index) => (
                <div 
                  key={member.name} 
                  className={cn(
                    "flex items-center justify-between py-2.5",
                    index !== (rankingTab === "top" ? childrenWalletRanking.top5 : childrenWalletRanking.lowest5).length - 1 && "border-b border-border/50"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 flex items-center justify-center">
                      {index < 3 ? (
                        <span className="text-lg">🏅</span>
                      ) : (
                        <span className="w-5 h-5 rounded-full bg-muted flex items-center justify-center text-xs font-medium text-muted-foreground">
                          {index + 1}
                        </span>
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">{member.name}</p>
                      <p className="text-xs text-muted-foreground">{member.transactionCount} Transactions</p>
                    </div>
                  </div>
                  <span className={cn(
                    "text-sm font-semibold",
                    rankingTab === "top" ? "text-success" : "text-destructive"
                  )}>
                    {member.balance.toFixed(2)} KD
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Activity Distribution */}
      <div className="px-4 mb-4">
        <div className="bg-card rounded-xl p-4 border">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">Activity Distribution</p>
          <ActivityDistribution
            transactions={mockTransactions.filter((t) => {
              const dateRange = getDateRange();
              const matchesDate = isWithinInterval(t.date, { start: dateRange.from, end: dateRange.to });
              
              if (isParent) {
                if (walletViewMode === "my-wallets") {
                  if (t.memberName !== parentMemberName) return false;
                } else {
                  if (t.memberName === parentMemberName) return false;
                  if (selectedMember && t.memberName !== selectedMember) return false;
                }
              }
              
              return t.walletType === selectedWallet && matchesDate;
            })}
            walletType={selectedWallet}
          />
        </div>
      </div>

      {/* View Transactions Link */}
      <div className="px-4 mt-auto">
        <button
          onClick={() => navigate("/ewallet-transactions")}
          className="w-full bg-card rounded-xl p-4 border flex items-center justify-between hover:shadow-md transition-shadow"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Wallet className="w-5 h-5 text-primary" />
            </div>
            <div className="text-left">
              <p className="font-medium text-foreground">View Transaction History</p>
              <p className="text-sm text-muted-foreground">See all your transactions</p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-muted-foreground" />
        </button>
      </div>
    </div>
  );
};

export default EWalletAnalytics;
