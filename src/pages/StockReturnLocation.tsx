import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import AppHeader from "@/components/AppHeader";
import { Input } from "@/components/ui/input";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { cn } from "@/lib/utils";
import { ChevronRight, Search, X as XIcon, MapPin } from "lucide-react";
import { getStockReturnScenario, STOCK_RETURN_DESTINATIONS } from "@/data/stockReturnScenarios";
import { returnDraft, setReturnDraft } from "@/data/stockReturnStore";

// First step of a Dealer / Team Leader Stock Return: where the stock comes from and where it
// goes back to. One Location shows the assigned location read-only; Multiple Locations picks
// it from the user's demo locations — that is the only difference between the two. Field,
// picker sheet and bottom bar reuse Request Stock's Destination patterns.

type Field = "location" | "destination";

const StockReturnLocation = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [scenario] = useState(getStockReturnScenario);
  const single = scenario.locationMode === "single";

  const [location, setLocation] = useState(single ? scenario.locations[0] : returnDraft.location ?? "");
  const [destination, setDestination] = useState(returnDraft.destination ?? "");
  const [picker, setPicker] = useState<Field | null>(null);
  const [search, setSearch] = useState("");

  const options = picker === "location" ? scenario.locations : STOCK_RETURN_DESTINATIONS;
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return q ? options.filter((o) => o.toLowerCase().includes(q)) : options;
  }, [options, search]);

  const canContinue = !!location && !!destination;

  const openPicker = (f: Field) => { setSearch(""); setPicker(f); };
  const pick = (v: string) => {
    if (picker === "location") setLocation(v); else setDestination(v);
    setPicker(null);
  };
  const next = () => {
    setReturnDraft({ location, destination });
    navigate("/stock-returns/new");
  };

  const selectField = (f: Field, value: string, placeholder: string) => (
    <button
      type="button"
      onClick={() => openPicker(f)}
      className="w-full h-12 rounded-xl bg-card border border-border px-3.5 flex items-center justify-between text-sm"
    >
      <span className={value ? "text-foreground font-medium" : "text-muted-foreground"}>{value || placeholder}</span>
      <ChevronRight className="w-4 h-4 text-muted-foreground rtl:rotate-180" />
    </button>
  );

  return (
    <div className="mobile-container min-h-screen bg-background pb-28">
      <AppHeader title={t("stockReturn.locationStepTitle")} showBack onBackClick={() => navigate("/stock-returns")} />

      <div className="px-4 space-y-4">
        <div className="space-y-1.5">
          <p className="text-sm font-medium text-foreground px-1">{t("stockReturn.location")}</p>
          {single ? (
            <div className="w-full h-12 rounded-xl bg-card border border-border px-3.5 flex items-center gap-2.5 text-sm" aria-readonly>
              <MapPin className="w-4 h-4 text-primary shrink-0" />
              <span className="flex-1 text-foreground font-medium truncate">{location}</span>
            </div>
          ) : (
            selectField("location", location, t("stockReturn.selectLocation"))
          )}
        </div>

        <div className="space-y-1.5">
          <p className="text-sm font-medium text-foreground px-1">{t("stockReturn.destination")}</p>
          {selectField("destination", destination, t("stockReturn.selectDestination"))}
        </div>
      </div>

      <div className="fixed bottom-0 start-0 end-0 bg-background border-t border-border px-4 py-3">
        <button
          type="button"
          disabled={!canContinue}
          onClick={next}
          className={cn(
            "w-full h-12 rounded-full font-semibold text-sm transition-colors",
            canContinue ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground",
          )}
        >
          {t("stockReturn.continue")}
        </button>
      </div>

      <Drawer open={picker !== null} onOpenChange={(o) => !o && setPicker(null)}>
        <DrawerContent className="bg-card rounded-t-3xl max-h-[90vh] flex flex-col">
          <button onClick={() => setPicker(null)} aria-label={t("settings.close")} className="absolute end-4 top-4 w-8 h-8 rounded-full bg-muted flex items-center justify-center z-10">
            <XIcon className="w-4 h-4 text-foreground" />
          </button>
          <DrawerHeader className="text-center pt-8">
            <DrawerTitle className="text-lg font-semibold">{t(picker === "location" ? "stockReturn.location" : "stockReturn.destination")}</DrawerTitle>
          </DrawerHeader>
          <div className="px-4 pb-3">
            <div className="relative">
              <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t("stockReturn.searchPlaceholder")} className="h-11 bg-muted/40 rounded-xl ps-9" />
            </div>
          </div>
          <div className="px-4 pb-8 space-y-2 overflow-y-auto flex-1">
            {filtered.map((o) => {
              const selected = (picker === "location" ? location : destination) === o;
              return (
                <button
                  key={o}
                  type="button"
                  onClick={() => pick(o)}
                  className={cn("w-full flex items-center gap-3 p-3.5 rounded-2xl transition text-start", selected ? "border-[0.5px] bg-primary/10 border-primary/20" : "bg-muted/50")}
                >
                  <div className="w-9 h-9 rounded-lg bg-sky-100 dark:bg-sky-500/15 flex items-center justify-center shrink-0">
                    <MapPin className="w-4 h-4 text-sky-600 dark:text-sky-300" />
                  </div>
                  <span className="text-sm font-semibold text-foreground flex-1">{o}</span>
                </button>
              );
            })}
          </div>
        </DrawerContent>
      </Drawer>
    </div>
  );
};

export default StockReturnLocation;
