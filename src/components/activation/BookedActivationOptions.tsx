import { useTranslation } from "react-i18next";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import RiyalSymbol from "@/components/RiyalSymbol";
import { bookedModeHasTopup, type BookedActivationConfig, type BookedActivationMode } from "@/lib/bookedActivation";

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
  return <section className="space-y-3">
    <label className="block text-sm font-semibold text-foreground" htmlFor="booked-activation-mode">{t("activation3.subscription.bookedOptions.title")}</label>
    <Select value={mode} onValueChange={(value: BookedActivationMode) => onModeChange(value)}>
      <SelectTrigger id="booked-activation-mode" className="bg-card"><SelectValue /></SelectTrigger>
      <SelectContent>{config.enabledModes.map(value => <SelectItem key={value} value={value}>{t(`activation3.subscription.bookedOptions.modes.${value}`)}</SelectItem>)}</SelectContent>
    </Select>
    {bookedModeHasTopup(mode) && <div className="space-y-2">
      <label htmlFor="booked-topup" className="text-sm font-medium text-foreground">{t("activation3.subscription.topupSectionTitle")} <span className="text-destructive">*</span></label>
      <div className="relative"><span className="absolute start-3 top-1/2 -translate-y-1/2 text-muted-foreground"><RiyalSymbol /></span>
        <Input id="booked-topup" inputMode="decimal" value={topup} onChange={event => { if (/^\d*(\.\d{0,2})?$/.test(event.target.value)) onTopupChange(event.target.value); }} className="bg-card ps-9" aria-invalid={errors.includes("topupMinimum")} />
      </div>
    </div>}
    {errors.map(error => <p key={error} role="alert" className="text-xs text-destructive">{t(`activation3.subscription.bookedOptions.errors.${error}`, { min: error === "planMinimum" ? config.minPlanAmount : config.minTopupAmount })}</p>)}
  </section>;
}