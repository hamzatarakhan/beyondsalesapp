import { CreditCard, Ticket, Router as RouterIcon, QrCode, Fingerprint, type LucideIcon } from "lucide-react";
import type { ProductId } from "@/data/purchaseOrdersStore";

/** Icon per stock product — shared by every Stock Management screen. */
export const PRODUCT_ICON: Record<ProductId, LucideIcon> = {
  vmSim: CreditCard, voucher10: Ticket, voucher20: Ticket, voucher50: Ticket, voucher100: Ticket,
  router1: RouterIcon, router2: RouterIcon, router3: RouterIcon, digitalVoucher: QrCode, fingerprint: Fingerprint,
};

export const PRODUCT_TONE: Record<ProductId, string> = {
  vmSim: "bg-violet-100 text-violet-600 dark:bg-violet-500/15 dark:text-violet-300",
  voucher10: "bg-emerald-100 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-300",
  voucher20: "bg-emerald-100 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-300",
  voucher50: "bg-emerald-100 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-300",
  voucher100: "bg-emerald-100 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-300",
  router1: "bg-amber-100 text-amber-600 dark:bg-amber-500/15 dark:text-amber-300",
  router2: "bg-amber-100 text-amber-600 dark:bg-amber-500/15 dark:text-amber-300",
  router3: "bg-amber-100 text-amber-600 dark:bg-amber-500/15 dark:text-amber-300",
  digitalVoucher: "bg-rose-100 text-rose-600 dark:bg-rose-500/15 dark:text-rose-300",
  fingerprint: "bg-sky-100 text-sky-600 dark:bg-sky-500/15 dark:text-sky-300",
};

export const emptyProductRecord = <T,>(make: () => T): Record<ProductId, T> =>
  Object.fromEntries((Object.keys(PRODUCT_ICON) as ProductId[]).map((k) => [k, make()])) as Record<ProductId, T>;
