import { z } from "zod";

export const bookingCodeSchema = z.string().length(10).regex(/^[A-Za-z0-9]+$/).regex(/[A-Za-z]/).regex(/[0-9]/);

// Booked-number activation is offered for prepaid and basic postpaid, but not
// for (Switch) postpaid.
export const canActivateBookedNumber = (payType: string) =>
  payType === "prepaid" || payType === "basic-postpaid";
