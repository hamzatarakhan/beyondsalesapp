import { useState } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, Outlet } from "react-router-dom";
import { ThemeProvider } from "./contexts/ThemeContext";
import { LanguageProvider } from "./contexts/LanguageContext";
import { BrandProvider } from "./contexts/BrandContext";
import { WidgetsProvider } from "./contexts/WidgetsContext";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { WalletBalanceProvider } from "./contexts/WalletBalanceContext";
import { WalletTopUpOverlayProvider, useWalletTopUpOverlay } from "./contexts/WalletTopUpOverlayContext";
import SplashScreen from "./components/SplashScreen";
import BrandSwitchLoader from "./components/BrandSwitchLoader";
import Login from "./pages/Login";
import ForgotPassword from "./pages/ForgotPassword";
import DeviceRegistration from "./pages/DeviceRegistration";
import Home from "./pages/Home";
import Menu from "./pages/Menu";
import ComingSoon from "./pages/ComingSoon";
import VisitManagement from "./pages/VisitManagement";
import VisitDetails from "./pages/VisitDetails";
import CreateVisit from "./pages/CreateVisit";
import AdHocVisit from "./pages/AdHocVisit";
import Settings from "./pages/Settings";
import Profile from "./pages/Profile";
import MyHierarchy from "./pages/MyHierarchy";
import Notifications from "./pages/Notifications";
import BillPayment from "./pages/BillPayment";
import CreditTransfer from "./pages/CreditTransfer";
import WalletRecharge from "./pages/WalletRecharge";
import CustomerComplaint from "./pages/CustomerComplaint";
import CustomerSearch from "./pages/CustomerSearch";
import SimStatusCheck from "./pages/SimStatusCheck";
import SearchSubscription from "./pages/SearchSubscription";
import SearchCustomer from "./pages/SearchCustomer";
import SearchCustomerForOwnership from "./pages/SearchCustomerForOwnership";
import SearchCustomerForCredit from "./pages/SearchCustomerForCredit";
import SimTermination from "./pages/SimTermination";
import CustomerTermination from "./pages/CustomerTermination";
import NewOwnerDetails from "./pages/NewOwnerDetails";
import ChangeOfOwnership from "./pages/ChangeOfOwnership";
import CreditLimitAdjustment from "./pages/CreditLimitAdjustment";
import SimReplacement from "./pages/SimReplacement";
import SearchBundleActivation from "./pages/SearchBundleActivation";
import BundlePlans from "./pages/BundlePlans";
import EWallet from "./pages/EWallet";
import PrepaidSearchCustomer from "./pages/PrepaidSearchCustomer";
import PrepaidActivation from "./pages/PrepaidActivation";
import ExistingCustomerFound from "./pages/ExistingCustomerFound";
import NewActivation from "./pages/NewActivation";
import NewActivationV2 from "./pages/NewActivationV2";
import NewActivation3 from "./pages/NewActivation3";
import NewActivation3AllPlans from "./pages/NewActivation3AllPlans";
import NewActivation4 from "./pages/NewActivation4";
import NewActivation4AllPlans from "./pages/NewActivation4AllPlans";
import NewActivation5 from "./pages/NewActivation5";
import NewActivation5AllPlans from "./pages/NewActivation5AllPlans";
import SubscriptionMigration from "./pages/SubscriptionMigration";
import SubscriptionMigrationAllPlans from "./pages/SubscriptionMigrationAllPlans";
import ChangePrepaidBundle from "./pages/ChangePrepaidBundle";
import ChangePrepaidBundleAllPlans from "./pages/ChangePrepaidBundleAllPlans";
import CancelPortInRequest from "./pages/CancelPortInRequest";
import ChangePostpaidPlan from "./pages/ChangePostpaidPlan";
import ChangePostpaidPlanAllPlans from "./pages/ChangePostpaidPlanAllPlans";
import UpdateCustomerId from "./pages/UpdateCustomerId";
import ChangeCustomerOwner from "./pages/ChangeCustomerOwner";
import OrdersHistory from "./pages/OrdersHistory";
import OrdersHistoryAchievements from "./pages/OrdersHistoryAchievements";
import OrdersHistoryCommissionHistory from "./pages/OrdersHistoryCommissionHistory";
import PurchaseOrders from "./pages/PurchaseOrders";
import PurchaseOrderForm from "./pages/PurchaseOrderForm";
import PurchaseOrderView from "./pages/PurchaseOrderView";
import PurchaseOrderScan from "./pages/PurchaseOrderScan";
import PhaseTwo from "./pages/PhaseTwo";
import ChannelOnboarding from "./pages/ChannelOnboarding";
import OnboardingRequests from "./pages/OnboardingRequests";
import MyShifts from "./pages/MyShifts";
import Tickets from "./pages/Tickets";
import NewTicket from "./pages/NewTicket";
import TicketDetails from "./pages/TicketDetails";
import TicketComments from "./pages/TicketComments";
import NotFound from "./pages/NotFound";


const queryClient = new QueryClient();

const RequireAuth = () => {
  const { isLoggedIn } = useAuth();
  return isLoggedIn ? <Outlet /> : <Navigate to="/login" replace />;
};

// Lives above the router so it survives the /login -> / navigation: login() flips
// isLoggedIn and loginTransition together, Home mounts immediately underneath, and
// this plays the loader on top of it until the transition finishes.
const LoginTransitionOverlay = () => {
  const { loginTransition, finishLoginTransition } = useAuth();
  return loginTransition ? <SplashScreen onFinish={finishLoginTransition} /> : null;
};

// Renders eWallet Recharge full-screen on top of whatever route is active, triggered by a
// "Top up now" prompt from an in-progress flow — that flow stays mounted underneath (no
// navigation), so its state is untouched when the dealer finishes topping up.
const WalletTopUpOverlayHost = () => {
  const { open, closeTopUp } = useWalletTopUpOverlay();
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[200] bg-background overflow-y-auto">
      <WalletRecharge onDone={closeTopUp} />
    </div>
  );
};

const App = () => {
  const [showSplash, setShowSplash] = useState(true);
  return (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
    <LanguageProvider>
    <BrandProvider>
    <WidgetsProvider>
    <WalletBalanceProvider>
    <WalletTopUpOverlayProvider>
    <AuthProvider>
      <TooltipProvider>
        {showSplash && <SplashScreen onFinish={() => setShowSplash(false)} />}
        <LoginTransitionOverlay />
        <BrandSwitchLoader />
        <Toaster />
        <Sonner />
        <BrowserRouter>
        <WalletTopUpOverlayHost />
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/device-registration" element={<DeviceRegistration />} />
          <Route element={<RequireAuth />}>
          <Route path="/" element={<Home />} />
          <Route path="/menu" element={<Menu />} />
          <Route path="/coming-soon" element={<ComingSoon />} />
          <Route path="/visit-management" element={<VisitManagement />} />
          <Route path="/visit-management/:id" element={<VisitDetails />} />
          <Route path="/create-visit" element={<CreateVisit />} />
          <Route path="/adhoc-visit" element={<AdHocVisit />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/profile/hierarchy" element={<MyHierarchy />} />
          <Route path="/notifications" element={<Notifications />} />
          <Route path="/bill-payment" element={<BillPayment />} />
          <Route path="/credit-transfer" element={<CreditTransfer />} />
          <Route path="/wallet-recharge" element={<WalletRecharge />} />
          <Route path="/customer-complaint" element={<CustomerComplaint />} />
          <Route path="/customer-search" element={<CustomerSearch />} />
          <Route path="/sim-status-check" element={<SimStatusCheck />} />
          <Route path="/search-subscription" element={<SearchSubscription />} />
          <Route path="/search-customer" element={<SearchCustomer />} />
          <Route path="/search-customer-ownership" element={<SearchCustomerForOwnership />} />
          <Route path="/search-customer-credit" element={<SearchCustomerForCredit />} />
          <Route path="/sim-termination" element={<SimTermination />} />
          <Route path="/customer-termination" element={<CustomerTermination />} />
          <Route path="/new-owner-details" element={<NewOwnerDetails />} />
          <Route path="/change-of-ownership" element={<ChangeOfOwnership />} />
          <Route path="/credit-limit-adjustment" element={<CreditLimitAdjustment />} />
          <Route path="/sim-replacement" element={<SimReplacement />} />
          <Route path="/search-bundle" element={<SearchBundleActivation />} />
          <Route path="/bundle-plans" element={<BundlePlans />} />
          <Route path="/ewallet" element={<EWallet />} />
          <Route path="/prepaid-search" element={<PrepaidSearchCustomer />} />
          <Route path="/prepaid-activation" element={<PrepaidActivation />} />
          <Route path="/prepaid-existing-customer" element={<ExistingCustomerFound />} />
          <Route path="/new-activation" element={<NewActivation />} />
          <Route path="/new-activation-v2" element={<NewActivationV2 />} />
          <Route path="/new-activation-3" element={<NewActivation3 />} />
          <Route path="/new-activation-3/plans" element={<NewActivation3AllPlans />} />
          <Route path="/new-activation-4" element={<NewActivation4 />} />
          <Route path="/new-activation-4/plans" element={<NewActivation4AllPlans />} />
          <Route path="/new-activation-5" element={<NewActivation5 />} />
          <Route path="/new-activation-5/plans" element={<NewActivation5AllPlans />} />
          <Route path="/subscription-migration" element={<SubscriptionMigration />} />
          <Route path="/subscription-migration/plans" element={<SubscriptionMigrationAllPlans />} />
          <Route path="/change-prepaid-bundle" element={<ChangePrepaidBundle />} />
          <Route path="/change-prepaid-bundle/plans" element={<ChangePrepaidBundleAllPlans />} />
          <Route path="/cancel-port-in" element={<CancelPortInRequest />} />
          <Route path="/change-postpaid-plan" element={<ChangePostpaidPlan />} />
          <Route path="/change-postpaid-plan/plans" element={<ChangePostpaidPlanAllPlans />} />
          <Route path="/update-id" element={<UpdateCustomerId />} />
          <Route path="/change-owner" element={<ChangeCustomerOwner />} />
          <Route path="/order-history" element={<OrdersHistory />} />
          <Route path="/order-history/achievements" element={<OrdersHistoryAchievements />} />
          <Route path="/order-history/commission-history" element={<OrdersHistoryCommissionHistory />} />
          <Route path="/purchase-orders" element={<PurchaseOrders />} />
          <Route path="/purchase-orders/new" element={<PurchaseOrderForm />} />
          <Route path="/purchase-orders/:id/edit" element={<PurchaseOrderForm />} />
          <Route path="/purchase-orders/:id/scan/:productId" element={<PurchaseOrderScan />} />
          <Route path="/purchase-orders/:id" element={<PurchaseOrderView />} />
          <Route path="/phase-2" element={<PhaseTwo />} />
          <Route path="/channel-onboarding" element={<ChannelOnboarding />} />
          <Route path="/onboarding-requests" element={<OnboardingRequests />} />
          <Route path="/my-shifts" element={<MyShifts />} />
          <Route path="/tickets" element={<Tickets />} />
          <Route path="/tickets/new" element={<NewTicket />} />
          <Route path="/tickets/:id" element={<TicketDetails />} />
          <Route path="/tickets/:id/comments" element={<TicketComments />} />
          </Route>
          <Route path="*" element={<NotFound />} />

        </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
    </WalletTopUpOverlayProvider>
    </WalletBalanceProvider>
    </WidgetsProvider>
    </BrandProvider>
    </LanguageProvider>
    </ThemeProvider>
  </QueryClientProvider>
  );
};

export default App;
