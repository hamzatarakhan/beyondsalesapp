import { useTranslation } from "react-i18next";
import { Check, Layers, Wallet } from "lucide-react";
import { Input } from "@/components/ui/input";
import RiyalSymbol from "@/components/RiyalSymbol";
import { cn } from "@/lib/utils";
import { bookedModeHasPlan, bookedModeHasTopup, type BookedActivationConfig, type BookedActivationMode } from "@/lib/bookedActivation";

interface Props {
  config: BookedActivationConfig;
  mode: BookedActivationMode;
  onModeChange: (mode: BookedActivationMode) => void;
  topup: string;
  onTopupChange: (value: string) => void;
  errors: string[];
}

export default function BookedActivationOptions({ config, mode, onModeChange, topup, onTopupChange, errors }: Props) {
  const { t } = useTranslation();
  const planOn = bookedModeHasPlan(mode);
  const topupOn = bookedModeHasTopup(mode);

  // The two cards toggle independently; the combination maps back to the four
  // configured activation modes. Toggles that would produce a mode the brand
  // has disabled are ignored so the configuration stays authoritative.
  const toggle = (kind: "plan" | "topup") => {
    const nextPlanOn = kind === "plan" ? !planOn : planOn;
    const nextTopupOn = kind === "topup" ? !topupOn : topupOn;
    const nextMode: BookedActivationMode = nextPlanOn && nextTopupOn ? "plan-topup" : nextPlanOn ? "plan" : nextTopupOn ? "topup" : "none";
    if (config.enabledModes.includes(nextMode)) onModeChange(nextMode);
  };

  return <section className="space-y-3">
    <label className="block text-sm font-semibold text-foreground" htmlFor="booked-activation-mode">{t("activation3.subscription.bookedOptions.title")}</label>
    <div className="grid grid-cols-2 gap-3">
      <button
        type="button"
        aria-pressed={planOn}
        onClick={() => toggle("plan")}
        className={cn(
          "relative rounded-2xl border p-3 text-start transition-colors",
          planOn ? "border-primary bg-primary/5 ring-1 ring-primary" : "border-border bg-card",
        )}
      >
        {planOn && <span className="absolute end-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground"><Check className="h-3 w-3" /></span>}
        <Layers className={cn("h-5 w-5", planOn ? "text-primary" : "text-muted-foreground")} />
        <p className={cn("mt-1.5 text-sm font-semibold", planOn ? "text-primary" : "text-foreground")}>{t("activation3.subscription.bookedOptions.cards.plan")}</p>
      </button>
      <button
        type="button"
        aria-pressed={topupOn}
        onClick={() => toggle("topup")}
        className={cn(
          "relative rounded-2xl border p-3 text-start transition-colors",
          topupOn ? "border-primary bg-primary/5 ring-1 ring-primary" : "border-border bg-card",
        )}
      >
        {topupOn && <span className="absolute end-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground"><Check className="h-3 w-3" /></span>}
        <Wallet className={cn("h-5 w-5", topupOn ? "text-primary" : "text-muted-foreground")} />
        <p className={cn("mt-1.5 text-sm font-semibold", topupOn ? "text-primary" : "text-foreground")}>{t("activation3.subscription.bookedOptions.cards.topup")}</p>
        {topupOn && <div className="relative mt-2">
          <span className="absolute start-3 top-1/2 -translate-y-1/2 text-muted-foreground"><RiyalSymbol /></span>
          <Input
            inputMode="decimal"
            value={topup}
            onChange={event => { if (/^\d*(\.\d{0,2})?$/.test(event.target.value)) onTopupChange(event.target.value); }}
            onClick={event => event.stopPropagation()}
            className="h-9 bg-background ps-9 text-sm"
            aria-invalid={errors.includes("topupMinimum")}
            aria-label={t("activation3.subscription.topupSectionTitle")}
          />
        </div>}
      </button>
    </div>
    {errors.map(error => <p key={error} role="alert" className="text-xs text-destructive">{t(`activation3.subscription.bookedOptions.errors.${error}`, { min: error === "planMinimum" ? config.minPlanAmount : config.minTopupAmount })}</p>)}
  </section>;
}
