import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Plan validity labels are stored as "Valid 28 days" — this strips the
// leading "Valid " so every place that displays it (plan cards, checkout
// summaries) shows the exact same text instead of re-wording it differently.
export function formatValidity(label?: string) {
  return (label ?? "30 days").replace(/^valid\s*/i, "").trim();
}
