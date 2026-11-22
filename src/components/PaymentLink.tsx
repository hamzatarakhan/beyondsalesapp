// "Payment link / QR": a third way to pay at any checkout. The customer pays on their own phone while
// the dealer waits on the sheet. Prototype: the payment "arrives" a few seconds after the sheet opens.
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import QRCode from "react-qr-code";
import { Check, Copy, Loader2, QrCode, Share2 } from "lucide-react";
import PayOption from "@/components/activation/PayOption";
import { Button } from "@/components/ui/button";
import { Drawer, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import RiyalSymbol from "@/components/RiyalSymbol";

/** The third option in every Payment Method card. */
export const PaymentLinkOption = ({ selected, onClick }: { selected: boolean; onClick: () => void }) => {
  const { t } = useTranslation();
  return <PayOption icon={QrCode} label={t("paymentLink.option")} description={t("paymentLink.optionDesc")} selected={selected} onClick={onClick} />;
};

/** Shown instead of the confirm step when "Payment link / QR" is the chosen method; onPaid continues as a normal payment. */
export const PaymentLinkSheet = ({ open, onOpenChange, amount, onPaid }: { open: boolean; onOpenChange: (o: boolean) => void; amount: number; onPaid: () => void }) => {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);
  const link = `https://pay.example.com/p/${amount.toFixed(2)}`;

  useEffect(() => {
    if (!open) return;
    const id = setTimeout(() => { onOpenChange(false); onPaid(); }, 6000);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const copy = async () => {
    try { await navigator.clipboard.writeText(link); setCopied(true); setTimeout(() => setCopied(false), 1500); } catch { /* clipboard unavailable */ }
  };
  const share = async () => {
    try { if (navigator.share) await navigator.share({ url: link }); else await copy(); } catch { /* share cancelled */ }
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="bg-card rounded-t-3xl border-0 px-5 pb-6 pt-2">
        <DrawerHeader className="text-center px-0 pb-3">
          <DrawerTitle>{t("paymentLink.title")}</DrawerTitle>
          <DrawerDescription>{t("paymentLink.desc")} <RiyalSymbol /> {amount.toFixed(2)}</DrawerDescription>
        </DrawerHeader>
        <div className="flex flex-col items-center gap-4">
          <div className="bg-white p-3 rounded-2xl border border-border/60"><QRCode value={link} size={180} /></div>
          <div className="w-full rounded-xl bg-muted px-3 py-2.5">
            <p className="text-xs text-foreground truncate" dir="ltr">{link}</p>
          </div>
          <div className="w-full grid grid-cols-2 gap-3">
            <Button variant="outline" className="h-11 rounded-full border-primary text-primary" onClick={copy}>
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />} {copied ? t("paymentLink.copied") : t("paymentLink.copy")}
            </Button>
            <Button variant="outline" className="h-11 rounded-full border-primary text-primary" onClick={share}>
              <Share2 className="w-4 h-4" /> {t("paymentLink.share")}
            </Button>
          </div>
          <p className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="w-4 h-4 animate-spin" /> {t("paymentLink.waiting")}</p>
          <button type="button" className="w-full h-11 text-primary font-semibold text-sm" onClick={() => onOpenChange(false)}>{t("paymentLink.anotherWay")}</button>
        </div>
      </DrawerContent>
    </Drawer>
  );
};
