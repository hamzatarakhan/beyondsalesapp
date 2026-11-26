import type { TFunction } from "i18next";

// Pop-up error messages end with "<message> <Error Code: XXX>" (EN/AR). 1 = CAS "internal service error";
// pass the real CAS/BE code once the API returns one.
export const DEFAULT_ERROR_CODE = "1";

export const withErrorCode = (message: string, t: TFunction, code: string = DEFAULT_ERROR_CODE) =>
  `${message} ${t("common.errorCode", { code })}`;
