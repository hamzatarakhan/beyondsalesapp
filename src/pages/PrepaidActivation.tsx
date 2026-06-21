import { useState } from "react";
import { useNavigate } from "react-router-dom";
import AppHeader from "@/components/AppHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Drawer, DrawerContent } from "@/components/ui/drawer";
import {
  ScanLine,
  Phone,
  ArrowRight,
  SlidersHorizontal,
  Plus,
  CreditCard,
  Banknote,
  Apple,
  Search,
  X,
  Eye,
} from "lucide-react";
import { cn } from "@/lib/utils";

type SimType = "psim" | "esim";
type PayMethod = "card" | "cash" | "apple";

const tiers = ["Purple", "Gold", "Super Gold"] as const;
type Tier = typeof tiers[number];

const numbersByTier: Record<Tier, string[]> = {
  Purple: Array.from({ length: 9 }, () => "547896324"),
  Gold: Array.from({ length: 9 }, () => "555123456"),
  "Super Gold": Array.from({ length: 9 }, () => "566789012"),
};

const plans = [
  { title: "Plan Title", internet: "60 GB", mins: "100", sms: "500", social: "Unlimited", price: 30, discount: "Discount 50%" },
  { title: "Plan Title", internet: "80 GB", mins: "200", sms: "1000", social: "Unlimited", price: 45, discount: "Discount 30%" },
  { title: "Plan Title", internet: "120 GB", mins: "Unlimited", sms: "Unlimited", social: "Unlimited", price: 60, discount: null },
];

const PrepaidActivation = () => {
  const navigate = useNavigate();
  const [simType, setSimType] = useState<SimType>("psim");
  const [kit, setKit] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("0785599574");
  const [planType, setPlanType] = useState("");
  const [selectedPlan, setSelectedPlan] = useState(0);
  const [promoOn, setPromoOn] = useState(false);
  const [promoCode, setPromoCode] = useState("");
  const [pay, setPay] = useState<PayMethod | "">("");
  const [numberSheetOpen, setNumberSheetOpen] = useState(false);

  return (
    <div className="mobile-container flex flex-col min-h-screen bg-[hsl(210,20%,96%)]">
      <AppHeader title="Prepaid Activation" showBack />

      <div className="flex-1 px-4 pb-28 space-y-5">
        {/* SIM Type */}
        <section>
          <h3 className="text-sm font-semibold text-foreground mb-2">SIM Type</h3>
          <div className="grid grid-cols-2 gap-3">
            <SimCard active={simType === "psim"} label="P-SIM" onClick={() => setSimType("psim")} />
            <SimCard active={simType === "esim"} label="E-SIM" onClick={() => setSimType("esim")} />
          </div>
        </section>

        {/* KIT (P-SIM) / Email (E-SIM) */}
        {simType === "psim" ? (
          <section>
            <h3 className="text-sm font-semibold text-foreground mb-2">KIT</h3>
            <div className="relative">
              <Input
                value={kit}
                onChange={(e) => setKit(e.target.value)}
                placeholder="KIT Code (10 Digits)"
                className="h-12 bg-card border-0 rounded-xl shadow-sm pr-12"
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-primary"
                aria-label="Scan KIT"
              >
                <ScanLine className="w-5 h-5" />
              </button>
            </div>
          </section>
        ) : (
          <section>
            <h3 className="text-sm font-semibold text-foreground mb-2">
              Customer Email
            </h3>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter email to send the eSIM QR code"
              className="h-12 bg-card border-0 rounded-xl shadow-sm"
            />
            <p className="text-[11px] text-muted-foreground mt-1.5">
              The eSIM activation QR will be emailed to the customer.
            </p>
          </section>
        )}

        {/* Phone number card */}
        <section className="bg-card rounded-2xl p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
              <Phone className="w-3.5 h-3.5 text-primary" />
            </div>
            <p className="text-sm font-semibold text-foreground">Your phone number.</p>
          </div>
          <div className="bg-primary/5 rounded-xl py-3 text-center text-lg font-semibold tracking-wide text-foreground mb-3">
            {phone}
          </div>
          {simType === "psim" && (
            <button
              onClick={() => setNumberSheetOpen(true)}
              className="w-full flex items-center justify-center gap-1.5 text-sky-600 text-sm font-semibold"
            >
              Get Different Number <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </section>

        {/* Plan Type */}
        <section>
          <h3 className="text-sm font-semibold text-foreground mb-2">Plan Type</h3>
          <div className="flex gap-2">
            <Select value={planType} onValueChange={setPlanType}>
              <SelectTrigger className="flex-1 bg-card border-0 rounded-xl h-12 shadow-sm">
                <SelectValue placeholder="Select plan type" />
              </SelectTrigger>
              <SelectContent className="bg-card">
                <SelectItem value="featured">Featured</SelectItem>
                <SelectItem value="1m">1 Month</SelectItem>
                <SelectItem value="3m">3 Months</SelectItem>
                <SelectItem value="12m">12 Months</SelectItem>
              </SelectContent>
            </Select>
            <button className="w-12 h-12 rounded-xl bg-card shadow-sm flex items-center justify-center text-primary">
              <SlidersHorizontal className="w-5 h-5" />
            </button>
          </div>

          {/* Plans carousel */}
          <div className="-mx-4 mt-3 overflow-x-auto no-scrollbar">
            <div className="flex gap-3 px-4 snap-x snap-mandatory">
              {plans.map((p, i) => (
                <PlanCard
                  key={i}
                  plan={p}
                  selected={selectedPlan === i}
                  onSelect={() => setSelectedPlan(i)}
                />
              ))}
            </div>
            <div className="flex justify-center gap-1.5 mt-3">
              {plans.map((_, i) => (
                <span
                  key={i}
                  className={cn(
                    "h-1.5 rounded-full transition-all",
                    selectedPlan === i ? "w-5 bg-primary" : "w-1.5 bg-primary/30"
                  )}
                />
              ))}
            </div>
          </div>
        </section>

        {/* Signatures */}
        <SignatureBox title="Customer Signature" />
        <SignatureBox title="Dealer Signature" />

        {/* Promo code */}
        <section className="bg-card rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-foreground">Promo code</p>
            <Switch checked={promoOn} onCheckedChange={setPromoOn} />
          </div>
          {promoOn && (
            <Input
              value={promoCode}
              onChange={(e) => setPromoCode(e.target.value)}
              placeholder="Enter the code"
              className="h-11 bg-muted/40 border-0 rounded-xl mt-3"
            />
          )}
        </section>

        {/* Payment */}
        <section className="bg-card rounded-2xl p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
              <CreditCard className="w-3.5 h-3.5 text-primary" />
            </div>
            <p className="text-sm font-semibold text-foreground">Select Payment Method</p>
          </div>
          <div className="space-y-2">
            <PayOption icon={CreditCard} label="Credit / Debit Card" value="card" selected={pay === "card"} onClick={() => setPay("card")} />
            <PayOption icon={Banknote} label="Cash" value="cash" selected={pay === "cash"} onClick={() => setPay("cash")} />
            <PayOption icon={Apple} label="Apple Pay" value="apple" selected={pay === "apple"} onClick={() => setPay("apple")} />
          </div>
        </section>
      </div>

      {/* Pay CTA */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-[hsl(210,20%,96%)]">
        <div className="max-w-[390px] mx-auto">
          <Button
            disabled={!pay}
            onClick={() => navigate("/")}
            className="w-full h-12 rounded-full text-base font-semibold flex items-center justify-between px-6 disabled:opacity-60"
          >
            <span>Pay</span>
            <span>{plans[selectedPlan].price + 0.5} KSA</span>
          </Button>
        </div>
      </div>

      {/* Choose Different Number sheet */}
      <ChooseNumberSheet
        open={numberSheetOpen}
        onClose={() => setNumberSheetOpen(false)}
        onPick={(n) => {
          setPhone(n);
          setNumberSheetOpen(false);
        }}
      />
    </div>
  );
};

const SimCard = ({ active, label, onClick }: { active: boolean; label: string; onClick: () => void }) => (
  <button
    onClick={onClick}
    className={cn(
      "relative rounded-2xl p-4 flex flex-col items-start gap-2 transition-all",
      active ? "bg-primary/10 ring-1 ring-primary/30" : "bg-card shadow-sm"
    )}
  >
    <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
      <svg viewBox="0 0 24 24" className="w-5 h-5 text-primary" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="6" y="3" width="12" height="18" rx="2" />
        <path d="M10 8h4M10 12h4M10 16h4" />
      </svg>
    </div>
    <p className="text-sm font-semibold text-foreground">{label}</p>
    <span
      className={cn(
        "absolute top-3 right-3 w-4 h-4 rounded-full border-2",
        active ? "border-primary bg-primary" : "border-primary/40"
      )}
    >
      {active && <span className="block w-1.5 h-1.5 bg-card rounded-full m-auto mt-[3px]" />}
    </span>
  </button>
);

const PlanCard = ({
  plan,
  selected,
  onSelect,
}: {
  plan: typeof plans[number];
  selected: boolean;
  onSelect: () => void;
}) => (
  <div className="snap-center shrink-0 w-[78%] bg-card rounded-2xl p-4 shadow-sm">
    <div className="flex items-center justify-between mb-3">
      <p className="font-semibold text-foreground">{plan.title}</p>
      {plan.discount && (
        <span className="px-2 py-1 rounded-md bg-primary text-primary-foreground text-[10px] font-semibold">
          {plan.discount}
        </span>
      )}
    </div>
    <div className="grid grid-cols-2 gap-y-2 text-xs mb-3">
      <Stat label="Internet" value={plan.internet} />
      <Stat label="Local Mins" value={plan.mins} />
      <Stat label="SMS" value={plan.sms} />
      <Stat label="Social Media" value={plan.social} />
    </div>
    <button className="flex items-center gap-1 text-sky-600 text-xs font-medium mb-3">
      More Details <Eye className="w-3.5 h-3.5" />
    </button>
    <div className="flex items-center justify-between mb-3">
      <p>
        <span className="text-2xl font-bold text-primary">{plan.price}/mo</span>
        <span className="text-xs text-muted-foreground ml-1">kSA</span>
      </p>
      <span className="px-2 py-1 rounded-md bg-emerald-50 text-emerald-700 text-[10px] font-medium">
        Valid 30 days
      </span>
    </div>
    <p className="text-[11px] text-muted-foreground mb-3">+15% Vat included</p>
    <button
      onClick={onSelect}
      className={cn(
        "w-full py-2.5 rounded-full text-sm font-semibold transition-colors",
        selected ? "bg-primary text-primary-foreground" : "bg-primary/10 text-primary"
      )}
    >
      {selected ? "Selected" : "Select"}
    </button>
  </div>
);

const Stat = ({ label, value }: { label: string; value: string }) => (
  <div>
    <p className="text-muted-foreground">{label}</p>
    <p className="font-semibold text-foreground">{value}</p>
  </div>
);

const SignatureBox = ({ title }: { title: string }) => (
  <section>
    <h3 className="text-sm font-semibold text-foreground mb-2">{title}</h3>
    <button className="w-full border-2 border-dashed border-primary/30 rounded-2xl bg-card py-8 flex flex-col items-center gap-2">
      <span className="w-9 h-9 rounded-full border-2 border-primary flex items-center justify-center text-primary">
        <Plus className="w-4 h-4" />
      </span>
      <p className="text-xs text-muted-foreground">No signature found here</p>
    </button>
  </section>
);

const PayOption = ({
  icon: Icon,
  label,
  selected,
  onClick,
}: {
  icon: typeof CreditCard;
  label: string;
  value: PayMethod;
  selected: boolean;
  onClick: () => void;
}) => (
  <button
    onClick={onClick}
    className={cn(
      "w-full flex items-center gap-3 p-3 rounded-xl bg-card border transition-colors",
      selected ? "border-primary" : "border-border"
    )}
  >
    <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
      <Icon className="w-4 h-4 text-primary" />
    </div>
    <p className="flex-1 text-left text-sm font-medium text-foreground">{label}</p>
    <span
      className={cn(
        "w-5 h-5 rounded-full border-2 flex items-center justify-center",
        selected ? "border-primary" : "border-primary/40"
      )}
    >
      {selected && <span className="w-2 h-2 rounded-full bg-primary" />}
    </span>
  </button>
);

const ChooseNumberSheet = ({
  open,
  onClose,
  onPick,
}: {
  open: boolean;
  onClose: () => void;
  onPick: (n: string) => void;
}) => {
  const [tier, setTier] = useState<Tier>("Purple");
  const [query, setQuery] = useState("");

  const list = numbersByTier[tier].filter((n) => n.includes(query));

  return (
    <Drawer open={open} onOpenChange={(o) => !o && onClose()}>
      <DrawerContent className="bg-card rounded-t-3xl border-0 px-5 pb-6 pt-2 max-h-[85vh]">
        <div className="mx-auto w-10 h-1 rounded-full bg-muted-foreground/30 mb-4" />
        <div className="flex items-center justify-between mb-4">
          <div className="w-7" />
          <h3 className="font-semibold text-foreground">Choose Different Number</h3>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-muted flex items-center justify-center"
            aria-label="Close"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="relative mb-4">
          <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search"
            className="h-11 pl-10 bg-muted/40 border-0 rounded-xl"
          />
        </div>

        <div className="grid grid-cols-3 gap-2 mb-3">
          {tiers.map((t) => (
            <button
              key={t}
              onClick={() => setTier(t)}
              className={cn(
                "py-2 rounded-full text-sm font-semibold transition-colors",
                tier === t ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"
              )}
            >
              {t}
            </button>
          ))}
        </div>

        <div className="overflow-y-auto flex-1 -mx-1">
          {list.map((n, i) => (
            <button
              key={i}
              onClick={() => onPick(n)}
              className="w-full flex items-center justify-between px-3 py-3.5 border-b border-border/60 last:border-0"
            >
              <span className="text-sm font-medium text-foreground">{n}</span>
              <span className="text-xs">
                <span className="font-semibold text-foreground">0</span>{" "}
                <span className="text-muted-foreground">KSA</span>
              </span>
            </button>
          ))}
        </div>
      </DrawerContent>
    </Drawer>
  );
};

export default PrepaidActivation;