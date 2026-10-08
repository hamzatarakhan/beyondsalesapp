// Cancel-flow reasons per feature (labels live under i18n "cancelReasons.*").
// "other" is always the last entry and reveals the free-text field, so its value must stay "other".
export interface CancelReasonOption {
  value: string;
  labelKey: string;
}

const r = (key: string): CancelReasonOption => ({ value: key, labelKey: key });
const other = (labelKey = "other"): CancelReasonOption => ({ value: "other", labelKey });

export const CANCEL_REASONS = {
  simActivation: [
    r("customerNotEligible"),
    r("paymentIssue"),
    r("simNumberIssue"),
    r("systemError"),
    r("customerRequestedCancellation"),
    r("wrongPlanPackageSelected"),
    r("customerFailedVerification"),
    r("portInMnpRejected"),
    r("simSerialIssue"),
    r("activationCompletedIncorrectly"),
    other("otherTechnicalIssue"),
  ],
  migration: [
    r("customerChangedMind"),
    r("customerSelectedDifferentPlan"),
    r("customerNotEligible"),
    r("requiredDocsUnavailable"),
    r("customerWantsToCompleteLater"),
    r("technicalSystemIssue"),
    other(),
  ],
  changePlan: [
    r("customerChangedMind"),
    r("customerSelectedDifferentPlan"),
    r("customerWantsToCompleteLater"),
    r("technicalSystemIssue"),
    other(),
  ],
  vanity: [
    r("customerChangedMind"),
    r("requiredDetailsUnavailable"),
    r("customerWantsToCompleteLater"),
    r("technicalSystemIssue"),
    other(),
  ],
  billPayment: [
    r("customerChangedMind"),
    r("paymentIssue"),
    r("insufficientFunds"),
    r("incorrectCustomerBillDetails"),
    r("customerWantsToPayLater"),
    r("technicalSystemIssue"),
    other(),
  ],
} satisfies Record<string, CancelReasonOption[]>;
