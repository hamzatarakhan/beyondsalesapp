// Customer CVM offers (Pelatro). The dealer verifies the customer's MSISDN with an OTP, sees the
// offers Pelatro returns for that customer, and each offer either opts in directly (gifts) or
// opens the existing flow it belongs to (top-up, change plan, bill payment, migration) with the
// offer carried in navigation state, so that flow can show it and apply its terms.
import { useState } from "react";
import { useLocation } from "react-router-dom";

export type CvmBenefitKind = "minutes" | "data" | "social" | "idd" | "cashback" | "discount";
export interface CvmBenefit { kind: CvmBenefitKind; amount: string }

export type CvmOffer = { id: string; validUntil: string } & (
  | { kind: "recharge"; minAmount: number; benefits: CvmBenefit[] }
  | { kind: "btl"; planTitle: string; price: number }
  | { kind: "changePlan"; planTitle: string; renew?: boolean; benefits: CvmBenefit[] }
  | { kind: "direct"; benefits: CvmBenefit[] }
  | { kind: "postpaidPlan"; planTitle: string; benefits: CvmBenefit[] }
  | { kind: "billFull"; discountPct: number; months: number }
  | { kind: "billWaiver"; payPct: number }
  | { kind: "billWaiverDiscount"; payPct: number; discountPct: number; months: number }
  | { kind: "migration"; discountPct: number; months: number }
);
export type CvmOfferKind = CvmOffer["kind"];

export interface CvmCustomer {
  msisdn: string;
  type: "prepaid" | "postpaid";
  status: "active" | "terminated";
  planName: string;
  offers: CvmOffer[];
}

/** Every number here also exists in the demo data of the flow its offers open. */
export const CVM_CUSTOMERS: CvmCustomer[] = [
  {
    msisdn: "0501234567",
    type: "prepaid",
    status: "active",
    planName: "Baqah 100",
    offers: [
      { id: "R-1", kind: "recharge", minAmount: 50, validUntil: "30 Nov 2026", benefits: [{ kind: "data", amount: "5 GB" }, { kind: "idd", amount: "100" }] },
      { id: "R-2", kind: "recharge", minAmount: 100, validUntil: "15 Dec 2026", benefits: [{ kind: "cashback", amount: "15" }] },
      { id: "B-1", kind: "btl", planTitle: "Baqah 70", price: 70, validUntil: "31 Dec 2026" },
      { id: "B-2", kind: "btl", planTitle: "Baqah Flex 60", price: 60, validUntil: "31 Dec 2026" },
      { id: "C-1", kind: "changePlan", planTitle: "Baqah 150", validUntil: "30 Nov 2026", benefits: [{ kind: "data", amount: "20 GB" }, { kind: "discount", amount: "10" }] },
      { id: "C-2", kind: "changePlan", planTitle: "Baqah 100", renew: true, validUntil: "30 Nov 2026", benefits: [{ kind: "minutes", amount: "500" }] },
      { id: "D-1", kind: "direct", validUntil: "25 Nov 2026", benefits: [{ kind: "social", amount: "2 GB" }] },
      { id: "D-2", kind: "direct", validUntil: "25 Nov 2026", benefits: [{ kind: "idd", amount: "30" }] },
      { id: "M-1", kind: "migration", discountPct: 10, months: 6, validUntil: "31 Dec 2026" },
      { id: "M-2", kind: "migration", discountPct: 20, months: 3, validUntil: "31 Dec 2026" },
    ],
  },
  {
    msisdn: "0502222211",
    type: "postpaid",
    status: "active",
    planName: "Switch Postpaid 120",
    offers: [
      { id: "P-1", kind: "postpaidPlan", planTitle: "Switch Postpaid 150", validUntil: "31 Dec 2026", benefits: [{ kind: "data", amount: "10 GB" }, { kind: "discount", amount: "15" }] },
      { id: "BP-1", kind: "billFull", discountPct: 20, months: 3, validUntil: "30 Nov 2026" },
      { id: "BP-2", kind: "billWaiver", payPct: 70, validUntil: "30 Nov 2026" },
      { id: "BP-3", kind: "billWaiverDiscount", payPct: 80, discountPct: 10, months: 2, validUntil: "30 Nov 2026" },
    ],
  },
  // Active line with nothing from Pelatro — the empty state.
  { msisdn: "0501234512", type: "prepaid", status: "active", planName: "Baqah Flex 100", offers: [] },
  // Terminated customers can't use CVM offers.
  { msisdn: "0501234533", type: "prepaid", status: "terminated", planName: "Baqah 150", offers: [] },
];

/** The flow an offer opens, or null when it is opted into straight from the offers page. */
export const cvmOfferTarget = (o: CvmOffer, msisdn: string): { path: string; state: Record<string, unknown> } | null => {
  const cvmOffer = { ...o, msisdn };
  switch (o.kind) {
    case "recharge":
      return { path: "/customer-recharge/e-reload", state: { cvmOffer } };
    case "btl":
    case "changePlan":
      return { path: "/change-prepaid-bundle", state: { cvmOffer, pickPlan: { msisdn, chip: "all", title: o.planTitle, verifiedMsisdn: msisdn } } };
    case "postpaidPlan":
      return { path: "/change-postpaid-plan", state: { cvmOffer, pickPlan: { msisdn, title: o.planTitle } } };
    case "billFull":
    case "billWaiver":
    case "billWaiverDiscount":
      return { path: "/bill-payment?option=2", state: { cvmOffer } };
    case "migration":
      return { path: "/subscription-migration?direction=pre-to-post", state: { cvmOffer, msisdn } };
    case "direct":
      return null;
  }
};

export type CarriedCvmOffer = CvmOffer & { msisdn: string };

/** The offer a flow was opened with. Read once on mount, because the flows clear their
 * navigation state after picking up the preselected plan. */
export const useCvmOffer = () => {
  const location = useLocation();
  const [offer] = useState<CarriedCvmOffer | null>(
    () => (location.state as { cvmOffer?: CarriedCvmOffer } | null)?.cvmOffer ?? null,
  );
  return offer;
};

/** Amount the customer must pay on a bill offer: the full due, or X% of it on a waiver offer. */
export const cvmBillRequired = (o: CvmOffer, due: number) =>
  o.kind === "billWaiver" || o.kind === "billWaiverDiscount" ? Math.round(due * o.payPct) / 100 : due;
