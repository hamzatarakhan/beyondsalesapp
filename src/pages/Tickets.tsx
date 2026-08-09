import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import AppHeader from "@/components/AppHeader";
import { Drawer, DrawerContent } from "@/components/ui/drawer";
import { cn } from "@/lib/utils";
import { Search, SlidersHorizontal, X, Plus, Hash, Layers, Calendar } from "lucide-react";
import { DEMO_TICKETS, TicketStatus } from "@/data/tickets";

export const STATUS_STYLE: Record<TicketStatus, string> = {
  progress: "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
  closed: "bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300",
  resolved: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
  pending: "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
};

export const STATUS_LABEL: Record<TicketStatus, string> = {
  progress: "Progress",
  closed: "Closed",
  resolved: "Resolved",
  pending: "Pending",
};

type Filter = "all" | "resolved" | "progress" | "closed";

const Tickets = () => {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [filterOpen, setFilterOpen] = useState(false);
  const [filter, setFilter] = useState<Filter>("all");
  const [draftFilter, setDraftFilter] = useState<Filter>("all");

  const tickets = useMemo(() => {
    return DEMO_TICKETS.filter((ticket) => {
      const matchesFilter = filter === "all" || ticket.status === filter;
      const q = query.trim().toLowerCase();
      const matchesQuery =
        !q ||
        ticket.id.toLowerCase().includes(q) ||
        ticket.category.toLowerCase().includes(q) ||
        ticket.subCategory.toLowerCase().includes(q);
      return matchesFilter && matchesQuery;
    });
  }, [filter, query]);

  const stats = [
    { count: DEMO_TICKETS.filter((x) => x.status === "progress" || x.status === "pending").length * 25, label: "Progress", status: "progress" as TicketStatus },
    { count: 50, label: "Closed", status: "closed" as TicketStatus },
    { count: 20, label: "Resolved", status: "resolved" as TicketStatus },
  ];

  return (
    <div className="min-h-screen bg-background pb-28">
      <AppHeader title="Tickets" showBack />

      <div className="px-4 grid grid-cols-3 gap-3">
        {stats.map((s) => (
          <div key={s.label} className="bg-card rounded-2xl py-3 shadow-[var(--card-shadow)] border border-border/60 flex flex-col items-center gap-1.5">
            <p className="text-xl font-bold text-foreground">{s.count}</p>
            <span className={cn("px-2.5 py-0.5 rounded-full text-[11px] font-medium", STATUS_STYLE[s.status])}>
              {s.label}
            </span>
          </div>
        ))}
      </div>

      <div className="px-4 mt-4 flex items-center gap-3">
        <div className="flex-1 relative">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search"
            className="w-full h-12 rounded-xl bg-card border border-border/60 pl-4 pr-11 rtl:pl-11 rtl:pr-4 text-base outline-none focus:ring-2 focus:ring-primary/30"
          />
          <Search className="w-5 h-5 text-muted-foreground absolute right-4 rtl:right-auto rtl:left-4 top-1/2 -translate-y-1/2" />
        </div>
        <button
          onClick={() => { setDraftFilter(filter); setFilterOpen(true); }}
          className="w-12 h-12 rounded-xl bg-card border border-border/60 flex items-center justify-center"
          aria-label="Filter tickets"
        >
          <SlidersHorizontal className="w-5 h-5 text-primary" />
        </button>
      </div>

      <div className="px-4 mt-4 space-y-3">
        {tickets.map((ticket) => (
          <button
            key={ticket.id}
            onClick={() => navigate(`/tickets/${ticket.id}`)}
            className="w-full text-left rtl:text-right bg-card rounded-2xl border border-border/60 shadow-[var(--card-shadow)] overflow-hidden flex"
          >
            <span className="w-1.5 shrink-0 bg-primary" />
            <div className="flex-1 p-4">
              <div className="flex items-start justify-between gap-2">
                <p className="font-semibold text-foreground">{ticket.category}</p>
                <span className={cn("px-2.5 py-0.5 rounded-full text-[11px] font-medium shrink-0", STATUS_STYLE[ticket.status])}>
                  {STATUS_LABEL[ticket.status]}
                </span>
              </div>
              <div className="mt-2 space-y-1.5 text-sm text-muted-foreground">
                <p className="flex items-center gap-2"><Hash className="w-4 h-4" />{ticket.id}</p>
                <p className="flex items-center gap-2"><Layers className="w-4 h-4" />{ticket.subCategory}</p>
                <p className="flex items-center gap-2"><Calendar className="w-4 h-4" />{ticket.date}</p>
              </div>
            </div>
          </button>
        ))}
        {tickets.length === 0 && (
          <p className="text-center text-sm text-muted-foreground py-10">No tickets match your filters.</p>
        )}
      </div>

      <button
        onClick={() => navigate("/tickets/new")}
        className="fixed bottom-6 right-4 rtl:right-auto rtl:left-4 h-12 px-5 rounded-full bg-primary text-primary-foreground font-medium shadow-lg flex items-center gap-2"
      >
        <Plus className="w-5 h-5" /> New Ticket
      </button>

      <Drawer open={filterOpen} onOpenChange={setFilterOpen}>
        <DrawerContent className="px-4 pb-8">
          <div className="relative pt-2 pb-4 text-center">
            <h2 className="text-lg font-semibold text-foreground">Filter</h2>
            <p className="text-sm text-muted-foreground">Please choose your filter options</p>
            <button
              onClick={() => setFilterOpen(false)}
              className="absolute right-0 rtl:right-auto rtl:left-0 top-2 w-9 h-9 rounded-full bg-muted flex items-center justify-center"
              aria-label="Close filter"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <p className="text-sm font-medium text-foreground mb-2">Status</p>
          <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
            {([
              { key: "all", label: "All" },
              { key: "resolved", label: "Resolved" },
              { key: "progress", label: "Progress" },
              { key: "closed", label: "Closed" },
            ] as { key: Filter; label: string }[]).map((opt) => (
              <button
                key={opt.key}
                onClick={() => setDraftFilter(opt.key)}
                className={cn(
                  "shrink-0 px-4 h-9 rounded-full text-sm font-medium border transition-colors",
                  draftFilter === opt.key
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-muted/50 text-muted-foreground border-transparent"
                )}
              >
                {opt.key === "all" ? opt.label : `+ ${opt.label}`}
              </button>
            ))}
          </div>

          <button
            onClick={() => { setFilter(draftFilter); setFilterOpen(false); }}
            className="mt-6 w-full h-12 rounded-full bg-primary text-primary-foreground font-semibold"
          >
            Apply
          </button>
          <button
            onClick={() => { setDraftFilter("all"); setFilter("all"); setFilterOpen(false); }}
            className="mt-3 w-full h-11 text-primary font-semibold"
          >
            Clear Filter
          </button>
        </DrawerContent>
      </Drawer>
    </div>
  );
};

export default Tickets;
