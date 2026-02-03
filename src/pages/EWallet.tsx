import { useState, useMemo } from "react";
import AppHeader from "@/components/AppHeader";
import ActivityDistribution from "@/components/ActivityDistribution";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  DrawerFooter,
  DrawerHeader,
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
  Search,
  X,
  Share2,
  Check,
  FileText,
  FileSpreadsheet,
  BarChart3,
  History,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { format, subDays, isWithinInterval, startOfDay, endOfDay } from "date-fns";
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

type DateRangeOption = "today" | "last-7-days" | "last-30-days" | "custom";
type WalletViewMode = "my-wallets" | "team-wallets";
type ViewTab = "analytics" | "transactions";

const EWallet = () => {
  // View tab state
  const [activeTab, setActiveTab] = useState<ViewTab>("analytics");
  
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
  const [searchQuery, setSearchQuery] = useState("");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [rankingTab, setRankingTab] = useState<"top" | "lowest">("top");
  
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
  
  // Filter transactions based on wallet view mode
  const filteredTransactions = useMemo(() => {
    const dateRange = getDateRange();
    
    return mockTransactions.filter((txn) => {
      // Wallet filter
      if (txn.walletType !== selectedWallet) {
        return false;
      }
      
      // For parent users, filter by view mode
      if (isParent) {
        if (walletViewMode === "my-wallets") {
          if (txn.memberName !== parentMemberName) {
            return false;
          }
        } else {
          if (txn.memberName === parentMemberName) {
            return false;
          }
          if (selectedMember && txn.memberName !== selectedMember) {
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
      
      // Activity type filter (multi-select)
      if (activityTypeFilters.length > 0 && !activityTypeFilters.includes(txn.activityType)) {
        return false;
      }
      
      // Status filter (multi-select)
      if (statusFilters.length > 0 && !statusFilters.includes(txn.status)) {
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
  }, [selectedWallet, dateRangeOption, customDateRange, transactionTypeFilter, activityTypeFilters, statusFilters, selectedMember, searchQuery, isParent, walletViewMode]);

  const resetFilters = () => {
    setDateRangeOption("last-7-days");
    setCustomDateRange(undefined);
    setTransactionTypeFilter("all");
    setActivityTypeFilters([]);
    setStatusFilters([]);
    setSelectedMember(null);
    setSearchQuery("");
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
      {/* Header with Tab Toggle */}
      <AppHeader 
        title="E-Wallet" 
        showBack 
        rightElement={
          <button
            onClick={() => setActiveTab(activeTab === "analytics" ? "transactions" : "analytics")}
            className="w-10 h-10 rounded-xl bg-card flex items-center justify-center shadow-sm"
          >
            {activeTab === "analytics" ? (
              <History className="w-5 h-5 text-foreground" />
            ) : (
              <BarChart3 className="w-5 h-5 text-foreground" />
            )}
          </button>
        }
      />

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

      {/* Search and Filter (Transactions view only) */}
      {activeTab === "transactions" && (
        <div className="px-4 mb-3">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search transactions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-11 rounded-xl bg-card border-border"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                >
                  <X className="w-4 h-4 text-muted-foreground" />
                </button>
              )}
            </div>
            <Drawer open={isFilterOpen} onOpenChange={setIsFilterOpen}>
              <DrawerTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className={cn(
                    "h-11 w-11 rounded-xl shrink-0 relative",
                    activeFiltersCount > 0 && "bg-primary text-primary-foreground border-primary hover:bg-primary/90"
                  )}
                >
                  <Filter className="w-5 h-5" />
                  {activeFiltersCount > 0 && (
                    <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-destructive text-destructive-foreground text-[10px] flex items-center justify-center font-medium">
                      {activeFiltersCount}
                    </span>
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
                                  {format(customDateRange.from, "LLL dd, y")} -{" "}
                                  {format(customDateRange.to, "LLL dd, y")}
                                </>
                              ) : (
                                format(customDateRange.from, "LLL dd, y")
                              )
                            ) : (
                              <span>Pick a date range</span>
                            )}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            initialFocus
                            mode="range"
                            defaultMonth={customDateRange?.from}
                            selected={customDateRange}
                            onSelect={setCustomDateRange}
                            numberOfMonths={1}
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
                        { value: "credit" as TransactionType, label: "Credit" },
                        { value: "debit" as TransactionType, label: "Debit" },
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
                      {(Object.keys(activityTypeLabels) as ActivityType[]).map((activity) => {
                        const isSelected = activityTypeFilters.includes(activity);
                        return (
                          <button
                            key={activity}
                            onClick={() => {
                              if (isSelected) {
                                setActivityTypeFilters(activityTypeFilters.filter(v => v !== activity));
                              } else {
                                setActivityTypeFilters([...activityTypeFilters, activity]);
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
                            {activityTypeLabels[activity]}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Status (Multi-select) */}
                  <div>
                    <Label className="text-sm font-medium text-foreground mb-3 block">Status</Label>
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
      )}

      {/* Analytics Filter */}
      {activeTab === "analytics" && (
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
      )}

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

      {/* Analytics Content */}
      {activeTab === "analytics" && (
        <>
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
        </>
      )}

      {/* Transactions Content */}
      {activeTab === "transactions" && (
        <div className="px-4 flex-1">
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
                  className="bg-card rounded-xl p-4 cursor-pointer hover:shadow-md transition-shadow border"
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
      )}

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

              <DrawerFooter className="pt-2 pb-6">
                <div className="flex items-center justify-center gap-4 text-sm">
                  <button
                    className="text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5"
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
                    {copied ? <Check className="w-4 h-4 text-success" /> : <Share2 className="w-4 h-4" />}
                    <span>{copied ? "Copied" : "Share"}</span>
                  </button>
                  <span className="text-border">•</span>
                  <button
                    className="text-primary hover:text-primary/80 transition-colors flex items-center gap-1.5"
                    onClick={() => {
                      toast({
                        title: "Exporting as PDF",
                        description: "Your transaction details will be downloaded shortly.",
                      });
                    }}
                  >
                    <FileText className="w-4 h-4" />
                    <span>PDF</span>
                  </button>
                  <span className="text-border">•</span>
                  <button
                    className="text-success hover:text-success/80 transition-colors flex items-center gap-1.5"
                    onClick={() => {
                      toast({
                        title: "Exporting as Excel",
                        description: "Your transaction details will be downloaded shortly.",
                      });
                    }}
                  >
                    <FileSpreadsheet className="w-4 h-4" />
                    <span>Excel</span>
                  </button>
                </div>
              </DrawerFooter>
            </div>
          )}
        </DrawerContent>
      </Drawer>
    </div>
  );
};

export default EWallet;
