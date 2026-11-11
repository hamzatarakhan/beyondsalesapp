// Shared by the Home and Services pages so both search the same way.
// Whole-word, prefix matching on normalised text (case, accents and Arabic letter variants are
// ignored): "bil" finds Bill Payment, but letters from the middle of a word never match.

export const searchNorm = (v: string) =>
  v
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ًͯ-ٰٟـ]/g, "")
    .replace(/[أإآ]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ة/g, "ه");

export const searchWords = (v: string) => searchNorm(v).split(/[^\p{L}\p{N}]+/u).filter(Boolean);

// Extra English/Arabic words per service, keyed by its route (including the query string).
// They let a dealer find a service by what it does, not just by its exact label.
const SEARCH_KEYWORDS: Record<string, string> = {
  "/new-activation-3": "activate activation new sim line تفعيل شريحة خط جديد",
  "/new-activation-3?flow=fulfilment": "continue activation complete resume استكمال",
  "/sim-status-check": "status check state حالة فحص",
  "/sim-replacement?option=2": "replace replacement lost damaged استبدال بدل فاقد",
  "/sim-termination?option=3": "terminate termination close cancel line إنهاء إلغاء خط",
  "/cancel-port-in": "port in port-in mnp cancel إلغاء نقل",
  "/change-prepaid-bundle": "bundle plan prepaid package باقة تغيير",
  "/change-postpaid-plan": "plan postpaid upgrade downgrade خطة",
  "/subscription-migration?direction=pre-to-post": "pre to post migrate convert تحويل",
  "/subscription-migration?direction=post-to-pre": "post to pre migrate convert تحويل",
  "/credit-transfer": "transfer credit send balance تحويل رصيد",
  "/bill-payment?option=2": "bill invoice pay payment فاتورة سداد دفع",
  "/credit-limit-adjustment?option=5": "limit credit limit increase حد ائتماني",
  "/change-owner": "owner ownership transfer نقل ملكية",
  "/update-id": "id update identity iqama civil تحديث هوية",
  "/customer-search": "search find customer lookup بحث عميل",
  "/customer-complaint": "complaint ticket issue شكوى",
  "/wallet-recharge": "wallet recharge top up topup my balance شحن محفظة",
  "/e-voucher": "voucher sms print قسيمة",
  "/ewallet?view=transactions": "transactions history statement wallet حركات كشف",
  "/e-wallet-analytics": "analytics chart ranking wallet تحليلات",
  "/commission-report": "commission earnings report عمولة أرباح",
  "/order-history": "orders history طلبات سجل",
  "/profile/hierarchy": "hierarchy team manager structure الهيكل فريق",
  "/inventory-dashboard": "inventory stock dashboard مخزون",
  "/stock-opt2/request": "request stock purchase order طلب مخزون",
  "/purchase-orders": "request stock purchase order طلب مخزون",
  "/stock-opt2/push": "push stock sales order distribute توزيع",
  "/sales-orders": "push stock sales order distribute توزيع",
  "/stock-returns": "return stock رجوع إرجاع مخزون",
  "/tickets": "tickets ticket support help issue request تذاكر تذكرة دعم مساعدة",
  "/visit-management": "visit visits dealer visit check in checkin schedule زيارة زيارات تسجيل حضور",
  "/my-shifts": "shift shifts working shift schedule attendance clock دوام وردية مناوبة",
  "/channel-onboarding": "onboarding channel member register تسجيل",
  "/onboarding-requests": "onboarding requests channel member طلبات تسجيل",
};

/**
 * True when every typed word starts a word in what the dealer can see (the service name or its
 * group name). Hidden keywords only count once at least 3 letters are typed, so a single letter
 * like "d" never surfaces a service whose visible name has no word starting with "d".
 */
export const matchesServiceSearch = (query: string, label: string, group: string, path?: string) => {
  const tokens = searchWords(query);
  if (tokens.length === 0) return false;
  const visibleWords = searchWords(`${label} ${group}`);
  const keywordWords = searchWords((path && SEARCH_KEYWORDS[path]) || "");
  return tokens.every(
    (tok) => visibleWords.some((w) => w.startsWith(tok)) || (tok.length >= 3 && keywordWords.some((w) => w.startsWith(tok))),
  );
};

/** Lower is better: 0 = the name starts with what was typed, 1 = a word in the name does, 2 = only the group or keywords matched. */
export const searchRank = (query: string, label: string) => {
  const tokens = searchWords(query);
  const words = searchWords(label);
  if (tokens.length === 0) return 2;
  if (searchNorm(label).startsWith(searchNorm(query).trim())) return 0;
  return tokens.every((tok) => words.some((w) => w.startsWith(tok))) ? 1 : 2;
};

export const hasSearchTerm = (query: string) => searchWords(query).length > 0;
