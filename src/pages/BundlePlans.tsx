import { useState } from "react";
import { useNavigate } from "react-router-dom";
import AppHeader from "@/components/AppHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Phone, Search, Wallet, MessageSquare, CreditCard, Check } from "lucide-react";
import { cn } from "@/lib/utils";

const planTabs = ["Featured", "Visits", "1 Month", "2 Month", "3 Months"];

const plans = [
  {
    id: 1,
    title: "Basic Monthly",
    isCurrent: true,
    discount: "50%",
    internet: "60 GB",
    localMins: "100",
    sms: "500",
    socialMedia: "Unlimited",
    price: 30,
    vatIncluded: true,
    earnAmount: 2,
    category: "Featured",
  },
  {
    id: 2,
    title: "Smart Monthly",
    isCurrent: false,
    discount: "30%",
    internet: "100 GB",
    localMins: "200",
    sms: "1000",
    socialMedia: "Unlimited",
    price: 45,
    vatIncluded: true,
    earnAmount: 3,
    category: "1 Month",
  },
  {
    id: 3,
    title: "Ultra Monthly",
    isCurrent: false,
    discount: "20%",
    internet: "150 GB",
    localMins: "Unlimited",
    sms: "2000",
    socialMedia: "Unlimited",
    price: 60,
    vatIncluded: true,
    earnAmount: 5,
    category: "1 Month",
  },
  {
    id: 4,
    title: "Visitor Lite",
    isCurrent: false,
    discount: "15%",
    internet: "30 GB",
    localMins: "50",
    sms: "100",
    socialMedia: "Unlimited",
    price: 20,
    vatIncluded: true,
    earnAmount: 1,
    category: "Visits",
  },
  {
    id: 5,
    title: "Visitor Plus",
    isCurrent: false,
    discount: "25%",
    internet: "80 GB",
    localMins: "150",
    sms: "500",
    socialMedia: "Unlimited",
    price: 35,
    vatIncluded: true,
    earnAmount: 2,
    category: "Visits",
  },
  {
    id: 6,
    title: "2 Month Value",
    isCurrent: false,
    discount: "10%",
    internet: "120 GB",
    localMins: "300",
    sms: "1500",
    socialMedia: "Unlimited",
    price: 55,
    vatIncluded: true,
    earnAmount: 4,
    category: "2 Month",
  },
  {
    id: 7,
    title: "2 Month Pro",
    isCurrent: false,
    discount: "35%",
    internet: "200 GB",
    localMins: "Unlimited",
    sms: "Unlimited",
    socialMedia: "Unlimited",
    price: 80,
    vatIncluded: true,
    earnAmount: 6,
    category: "2 Month",
  },
  {
    id: 8,
    title: "Quarterly Basic",
    isCurrent: false,
    discount: "40%",
    internet: "250 GB",
    localMins: "500",
    sms: "3000",
    socialMedia: "Unlimited",
    price: 90,
    vatIncluded: true,
    earnAmount: 7,
    category: "3 Months",
  },
  {
    id: 9,
    title: "Quarterly Max",
    isCurrent: false,
    discount: "45%",
    internet: "Unlimited",
    localMins: "Unlimited",
    sms: "Unlimited",
    socialMedia: "Unlimited",
    price: 120,
    vatIncluded: true,
    earnAmount: 10,
    category: "3 Months",
  },
];

const paymentMethods = [
  {
    id: "stc-wallet",
    name: "STC Wallet",
    description: "Pay from your Wallet (556 KD)",
    icon: Wallet,
    category: "Digital Wallets",
  },
  {
    id: "sms-pay",
    name: "SMS Pay",
    description: "SMS-based payment",
    icon: MessageSquare,
    category: "Digital Wallets",
  },
  {
    id: "customer-balance",
    name: "Customer Balance",
    description: "Pay from customer balance (3.0 KD)",
    icon: CreditCard,
    category: "Other",
  },
];

const BundlePlans = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("Featured");
  const [selectedPlan, setSelectedPlan] = useState<number | null>(1);
  const [selectedPayment, setSelectedPayment] = useState("sms-pay");
  const [searchQuery, setSearchQuery] = useState("");

  const selectedPlanData = plans.find((p) => p.id === selectedPlan);

  return (
    <div className="mobile-container min-h-screen flex flex-col pb-20">
      <AppHeader title="Bundle Activation/Renewal" showBack />

      {/* Customer Info Card */}
      <div className="px-4 mb-4">
        <div className="bg-primary/10 rounded-xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
            <Phone className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="font-semibold text-foreground">578632498</p>
            <p className="text-sm text-muted-foreground">Mobile ID</p>
          </div>
        </div>
      </div>

      {/* Select Base Plan */}
      <div className="px-4 mb-3">
        <h3 className="font-semibold text-foreground mb-3">Select Base Plan</h3>
        
        {/* Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {planTabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                "px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors relative",
                activeTab === tab
                  ? "bg-primary text-primary-foreground"
                  : "bg-card text-muted-foreground border border-border"
              )}
            >
              {tab}
              {tab === "Visits" && (
                <span className="absolute -top-2 -right-1 bg-destructive text-destructive-foreground text-[10px] px-1.5 py-0.5 rounded-full">
                  15% OFF
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Search */}
      <div className="px-4 mb-4">
        <div className="relative">
          <Input
            placeholder="Search by Order ID"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-11 rounded-xl bg-card border-border pr-10"
          />
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
        </div>
      </div>

      {/* Plans Carousel */}
      <div className="px-4 mb-6">
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
          {plans.map((plan) => (
            <div
              key={plan.id}
              onClick={() => setSelectedPlan(plan.id)}
              className={cn(
                "min-w-[260px] bg-card rounded-2xl p-4 border-2 transition-all cursor-pointer relative",
                selectedPlan === plan.id
                  ? "border-primary shadow-lg"
                  : "border-transparent"
              )}
            >
              {/* Discount Badge */}
              {plan.discount && (
                <div className="absolute -left-1 top-6 bg-destructive text-destructive-foreground text-xs font-bold px-2 py-1 rounded-r-lg">
                  {plan.discount}
                </div>
              )}

              {/* Plan Header */}
              <div className="flex items-center gap-2 mb-4">
                <h4 className="font-semibold text-foreground">{plan.title}</h4>
                {plan.isCurrent && (
                  <span className="text-xs text-success font-medium bg-success/10 px-2 py-0.5 rounded-full">
                    Current Plan
                  </span>
                )}
              </div>

              {/* Plan Details Grid */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="border-r border-border pr-3">
                  <p className="text-xs text-muted-foreground">Internet</p>
                  <p className="font-semibold text-foreground">{plan.internet}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Local Mins</p>
                  <p className="font-semibold text-foreground">{plan.localMins}</p>
                </div>
                <div className="border-r border-border pr-3">
                  <p className="text-xs text-muted-foreground">SMS</p>
                  <p className="font-semibold text-foreground">{plan.sms}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Social Media</p>
                  <p className="font-semibold text-foreground">{plan.socialMedia}</p>
                </div>
              </div>

              {/* Price */}
              <div className="mb-3">
                <span className="text-2xl font-bold text-foreground">{plan.price}</span>
                <span className="text-lg text-foreground">/mo</span>
                <span className="text-sm text-muted-foreground ml-1">KD</span>
                <p className="text-xs text-muted-foreground">+15% Vat included</p>
              </div>

              {/* Earn Badge */}
              <div className="bg-success/10 rounded-lg py-2 px-3 mb-3 flex items-center justify-center gap-1">
                <span className="text-success text-sm font-medium">🎁 Earn {plan.earnAmount} KD</span>
              </div>

              {/* Selected Button */}
              {selectedPlan === plan.id && (
                <Button className="w-full h-10 rounded-xl bg-primary text-primary-foreground">
                  Selected
                </Button>
              )}
            </div>
          ))}
        </div>

        {/* Carousel Dots */}
        <div className="flex justify-center gap-1.5 mt-3">
          <span className="w-5 h-1.5 rounded-full bg-primary" />
          <span className="w-1.5 h-1.5 rounded-full bg-muted" />
        </div>
      </div>

      {/* Payment Methods */}
      <div className="px-4 mb-4">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <CreditCard className="w-4 h-4 text-primary" />
          </div>
          <h3 className="font-semibold text-foreground">Select Payment Method</h3>
        </div>

        <p className="text-sm text-muted-foreground mb-3">Digital Wallets</p>

        <div className="space-y-3">
          {paymentMethods.map((method) => (
            <div
              key={method.id}
              onClick={() => setSelectedPayment(method.id)}
              className={cn(
                "bg-card rounded-xl p-4 flex items-center gap-3 cursor-pointer border-2 transition-all",
                selectedPayment === method.id
                  ? "border-primary"
                  : "border-transparent"
              )}
            >
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <method.icon className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-foreground">{method.name}</p>
                <p className="text-sm text-muted-foreground">{method.description}</p>
              </div>
              <div
                className={cn(
                  "w-5 h-5 rounded-full border-2 flex items-center justify-center",
                  selectedPayment === method.id
                    ? "border-primary bg-primary"
                    : "border-muted-foreground"
                )}
              >
                {selectedPayment === method.id && (
                  <Check className="w-3 h-3 text-primary-foreground" />
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Pay Button */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-background border-t border-border">
        <div className="max-w-[390px] mx-auto">
          <Button
            onClick={() => navigate("/")}
            className="w-full h-14 rounded-xl bg-primary text-primary-foreground text-lg font-semibold flex items-center justify-between px-6"
          >
            <span>Pay</span>
            <span>{selectedPlanData?.price || 30}.0 KD</span>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default BundlePlans;
