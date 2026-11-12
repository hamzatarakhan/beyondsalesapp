import { PRODUCT_ICON, PRODUCT_TONE } from "@/data/stockProductVisuals";
import { useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import AppHeader from "@/components/AppHeader";
import { Input } from "@/components/ui/input";
import { Drawer, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { cn } from "@/lib/utils";
import { Eye, Boxes, Check, ChevronDown, ChevronRight, MapPin, Search, X as XIcon } from "lucide-react";
import { DEMO_DESTINATIONS, PURCHASE_ORDER_PRODUCTS, type ProductId } from "@/data/purchaseOrdersStore";

// Inventory Dashboard: My Stock (own inventory) and Team Stock (each team member's inventory,
// opened on its own page). Every inventory shows totals, a product search and per-product
// serial numbers in a "View Item" sheet. A Location picker narrows any inventory to one
// warehouse/branch; "All Locations" is the sum of every location.

// ---------- Demo data ----------
type TeamMember = { id: string; name: string; dealerCode: string; inventoryCode: string; scale: number };
export const TEAM_MEMBERS: TeamMember[] = [
  { id: "ahmad-ali", name: "Ahmad Ali", dealerCode: "1157853334", inventoryCode: "257587411", scale: 0.8 },
  { id: "sara-khaled", name: "Sara Khaled", dealerCode: "1157853335", inventoryCode: "257587412", scale: 0.6 },
  { id: "omar-hassan", name: "Omar Hassan", dealerCode: "1157853336", inventoryCode: "257587413", scale: 0.45 },
  { id: "noura-saleh", name: "Noura Saleh", dealerCode: "1157853337", inventoryCode: "257587414", scale: 0.3 },
  { id: "fahad-otaibi", name: "Fahad Al-Otaibi", dealerCode: "1157853338", inventoryCode: "257587415", scale: 0.2 },
];

// Demo split of stock across locations (same locations as Request Stock). Some products are
// missing at some branches so a location can show fewer product types.
const LOCATIONS = DEMO_DESTINATIONS;
const LOCATION_WEIGHTS = [0.35, 0.2, 0.15, 0.12, 0.1, 0.08];
const carries = (productIndex: number, loc: number) => loc === 0 || (productIndex + loc) % 4 !== 3;

const unitsAt = (productIndex: number, base: number, scale: number, loc: number) =>
  carries(productIndex, loc) ? Math.round(base * scale * (LOCATION_WEIGHTS[loc] ?? 0.05)) : 0;

/** Units per product for an inventory at one location (null = all locations);
 *  `scale` shrinks the dealer's own figures for team members. */
const stockFor = (scale: number, loc: number | null = null) =>
  PURCHASE_ORDER_PRODUCTS.map((p, i) => {
    const base = p.availableStocks - i * 7;
    const units = loc === null
      ? LOCATIONS.reduce((sum, _, l) => sum + unitsAt(i, base, scale, l), 0)
      : unitsAt(i, base, scale, loc);
    return { ...p, units };
  }).filter((p) => p.units > 0);

const totalsFor = (scale: number, loc: number | null = null) => {
  const stock = stockFor(scale, loc);
  return { units: stock.reduce((s, p) => s + p.units, 0), types: stock.length };
};

const serialsFor = (productId: ProductId, count: number, loc: number | null) => {
  const base = 15448860000 + PURCHASE_ORDER_PRODUCTS.findIndex((p) => p.id === productId) * 1000 + (loc === null ? 0 : (loc + 1) * 100000);
  return Array.from({ length: count }, (_, i) => `#${base + i}`);
};

const initials = (name: string) => name.split(/\s+/).map((w) => w[0]).slice(0, 2).join("").toUpperCase();

// ---------- Shared bits ----------
const SearchField = ({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) => (
  <div className="relative">
    <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
    <Input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="h-11 bg-card rounded-xl ps-9 text-sm" />
  </div>
);

const StatTile = ({ label, value }: { label: string; value: number }) => (
  <div className="bg-card rounded-2xl p-3.5 shadow-sm">
    <p className="text-[11px] text-muted-foreground">{label}</p>
    <p className="text-lg font-bold text-foreground mt-0.5">{value.toLocaleString()}</p>
  </div>
);

/** Location field + bottom sheet listing "All Locations" and every location. */
const LocationPicker = ({ value, onChange }: { value: number | null; onChange: (loc: number | null) => void }) => {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const options: (number | null)[] = [null, ...LOCATIONS.map((_, i) => i)];
  const label = (loc: number | null) => (loc === null ? t("inventoryDashboard.allLocations") : LOCATIONS[loc]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="w-full h-12 bg-card rounded-xl border border-input px-3 flex items-center gap-2.5 text-start"
      >
        <MapPin className="w-4 h-4 text-primary shrink-0" />
        <span className="flex-1 min-w-0">
          <span className="block text-[10px] text-muted-foreground leading-tight">{t("inventoryDashboard.location")}</span>
          <span className="block text-sm font-semibold text-foreground truncate">{label(value)}</span>
        </span>
        <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />
      </button>

      <Drawer open={open} onOpenChange={setOpen}>
        <DrawerContent className="bg-card rounded-t-3xl max-h-[85vh] flex flex-col">
          <button onClick={() => setOpen(false)} aria-label={t("settings.close")} className="absolute end-4 top-4 w-8 h-8 rounded-full bg-muted flex items-center justify-center z-10">
            <XIcon className="w-4 h-4 text-foreground" />
          </button>
          <DrawerHeader className="text-center pt-8 pb-3">
            <DrawerTitle className="text-lg font-semibold">{t("inventoryDashboard.selectLocation")}</DrawerTitle>
            <DrawerDescription className="text-xs text-muted-foreground">{t("inventoryDashboard.selectLocationDesc")}</DrawerDescription>
          </DrawerHeader>
          <div className="flex-1 min-h-0 overflow-y-auto px-4 pb-8 space-y-2">
            {options.map((loc) => {
              const selected = loc === value;
              return (
                <button
                  key={loc ?? "all"}
                  type="button"
                  onClick={() => { onChange(loc); setOpen(false); }}
                  aria-pressed={selected}
                  className={cn(
                    "w-full flex items-center gap-3 rounded-xl px-4 py-3.5 text-start border transition-colors",
                    selected ? "border-primary bg-primary/5" : "border-transparent bg-muted/50",
                  )}
                >
                  <MapPin className={cn("w-4 h-4 shrink-0", selected ? "text-primary" : "text-muted-foreground")} />
                  <span className="flex-1 text-sm font-semibold text-foreground">{label(loc)}</span>
                  {selected && <Check className="w-4 h-4 text-primary" />}
                </button>
              );
            })}
          </div>
        </DrawerContent>
      </Drawer>
    </>
  );
};

/** Location + totals + product search + product list + View Item sheet for one inventory. */
const StockOverview = ({ scale }: { scale: number }) => {
  const { t } = useTranslation();
  const [location, setLocation] = useState<number | null>(null);
  const [query, setQuery] = useState("");
  const [viewing, setViewing] = useState<{ id: ProductId; units: number } | null>(null);
  const [serialQuery, setSerialQuery] = useState("");

  const stock = useMemo(() => stockFor(scale, location), [scale, location]);
  const totals = useMemo(() => totalsFor(scale, location), [scale, location]);
  const q = query.trim().toLowerCase();
  const shown = stock.filter((p) => !q || t(`purchaseOrders.product.${p.nameKey}`).toLowerCase().includes(q));

  const serials = viewing ? serialsFor(viewing.id, viewing.units, location) : [];
  const sq = serialQuery.replace(/\D/g, "");
  const shownSerials = sq ? serials.filter((s) => s.includes(sq)) : serials;

  return (
    <>
      <LocationPicker value={location} onChange={setLocation} />

      <div className="grid grid-cols-2 gap-3">
        <StatTile label={t("inventoryDashboard.totalUnits")} value={totals.units} />
        <StatTile label={t("inventoryDashboard.totalTypes")} value={totals.types} />
      </div>

      <SearchField value={query} onChange={setQuery} placeholder={t("inventoryDashboard.searchProduct")} />

      <div className="space-y-3">
        {shown.map((p) => {
          const Icon = PRODUCT_ICON[p.id];
          return (
            <div key={p.id} className="bg-card rounded-2xl p-4 shadow-sm flex items-center gap-3">
              <div className={cn("w-11 h-11 rounded-full flex items-center justify-center shrink-0", PRODUCT_TONE[p.id])}>
                <Icon className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-foreground">{t(`purchaseOrders.product.${p.nameKey}`)}</p>
                <span className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-md bg-muted text-[11px] font-semibold text-muted-foreground">
                  <Boxes className="w-3 h-3" /> {t("inventoryDashboard.availableStocks", { count: p.units })}
                </span>
              </div>
              <button
                type="button"
                onClick={() => { setSerialQuery(""); setViewing({ id: p.id, units: p.units }); }}
                aria-label={t("purchaseOrders.viewSerialsAria")}
                className="w-9 h-9 rounded-lg border border-rose-200 bg-rose-50 dark:bg-rose-500/10 dark:border-rose-500/30 flex items-center justify-center shrink-0"
              >
                <Eye className="w-4 h-4 text-primary" />
              </button>
            </div>
          );
        })}
        {shown.length === 0 && <p className="text-center text-sm text-muted-foreground py-8">{t("inventoryDashboard.noProducts")}</p>}
      </div>

      {/* ---------- View Item — serial numbers for the tapped product ---------- */}
      <Drawer open={!!viewing} onOpenChange={(o) => { if (!o) setViewing(null); }}>
        <DrawerContent className="bg-card rounded-t-3xl max-h-[90vh] flex flex-col">
          <button onClick={() => setViewing(null)} aria-label={t("settings.close")} className="absolute end-4 top-4 w-8 h-8 rounded-full bg-muted flex items-center justify-center z-10">
            <XIcon className="w-4 h-4 text-foreground" />
          </button>
          <DrawerHeader className="text-center pt-8 pb-3">
            <DrawerTitle className="text-lg font-semibold">{t("inventoryDashboard.viewItem")}</DrawerTitle>
            <DrawerDescription className="text-xs text-muted-foreground">
              {t("inventoryDashboard.availableSerials", { count: viewing?.units ?? 0 })}
            </DrawerDescription>
          </DrawerHeader>
          <div className="px-4 pb-3">
            <SearchField value={serialQuery} onChange={setSerialQuery} placeholder={t("inventoryDashboard.searchSerial")} />
          </div>
          <div className="flex-1 min-h-0 overflow-y-auto px-4 pb-8 space-y-2.5">
            {shownSerials.map((serial) => (
              <div key={serial} className="rounded-xl bg-muted/50 px-4 py-3.5 text-sm font-bold text-foreground">{serial}</div>
            ))}
            {shownSerials.length === 0 && <p className="text-center text-sm text-muted-foreground py-6">{t("inventoryDashboard.noSerials")}</p>}
          </div>
        </DrawerContent>
      </Drawer>
    </>
  );
};

// ---------- Inventory Dashboard — My Stock / Team Stock ----------
const InventoryDashboard = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  // The tab lives in the URL so Back from a member's inventory returns to Team Stock.
  const [params, setParams] = useSearchParams();
  const tab = params.get("tab") === "team" ? "team" : "mine";
  const [memberQuery, setMemberQuery] = useState("");

  const mq = memberQuery.trim().toLowerCase();
  const members = TEAM_MEMBERS.filter(
    (m) => !mq || m.name.toLowerCase().includes(mq) || m.dealerCode.includes(mq) || m.inventoryCode.includes(mq),
  );

  return (
    <div className="mobile-container min-h-screen bg-background pb-8">
      <AppHeader title={t("inventoryDashboard.title")} showBack onBackClick={() => navigate("/")} />

      <div className="px-4 space-y-4">
        <div className="grid grid-cols-2 border-b border-border">
          {(["mine", "team"] as const).map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => setParams(v === "team" ? { tab: "team" } : {}, { replace: true })}
              className={cn(
                "h-10 text-sm font-medium border-b-2 -mb-px transition-colors",
                tab === v ? "border-primary text-primary" : "border-transparent text-muted-foreground",
              )}
            >
              {t(v === "mine" ? "inventoryDashboard.myStock" : "inventoryDashboard.teamStock")}
            </button>
          ))}
        </div>

        {tab === "mine" ? (
          <StockOverview scale={1} />
        ) : (
          <>
            <SearchField value={memberQuery} onChange={setMemberQuery} placeholder={t("inventoryDashboard.searchMember")} />
            <div className="space-y-3">
              {members.map((m) => {
                const totals = totalsFor(m.scale);
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => navigate(`/inventory-dashboard/member/${m.id}`)}
                    className="w-full bg-card rounded-2xl p-4 shadow-sm flex items-center gap-3 text-start transition-colors hover:bg-muted/40"
                  >
                    <span className="w-10 h-10 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center shrink-0 self-start">
                      {initials(m.name)}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-foreground">{m.name}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{t("inventoryDashboard.dealerCode")}: <span className="text-foreground">{m.dealerCode}</span></p>
                      <p className="text-xs text-muted-foreground">{t("inventoryDashboard.inventoryCode")}: <span className="text-foreground">{m.inventoryCode}</span></p>
                      <div className="flex flex-wrap gap-1.5 mt-1.5">
                        <span className="px-2 py-0.5 rounded-md bg-muted text-[11px] font-semibold text-muted-foreground">
                          {t("inventoryDashboard.productTypes", { count: totals.types })}
                        </span>
                        <span className="px-2 py-0.5 rounded-md bg-muted text-[11px] font-semibold text-muted-foreground">
                          {t("inventoryDashboard.availableUnits", { count: totals.units })}
                        </span>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0 rtl:rotate-180" />
                  </button>
                );
              })}
              {members.length === 0 && <p className="text-center text-sm text-muted-foreground py-8">{t("inventoryDashboard.noMembers")}</p>}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

// ---------- A team member's inventory ----------
export const MemberInventory = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { memberId } = useParams();
  const member = TEAM_MEMBERS.find((m) => m.id === memberId);
  const back = () => navigate("/inventory-dashboard?tab=team");

  return (
    <div className="mobile-container min-h-screen bg-background pb-8">
      <AppHeader title={member ? t("inventoryDashboard.memberInventory", { name: member.name }) : t("inventoryDashboard.title")} showBack onBackClick={back} />
      <div className="px-4 space-y-4">
        {member ? <StockOverview scale={member.scale} /> : <p className="text-center text-sm text-muted-foreground py-8">{t("inventoryDashboard.noMembers")}</p>}
      </div>
    </div>
  );
};

export default InventoryDashboard;
