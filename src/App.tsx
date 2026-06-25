import { useState } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "./contexts/ThemeContext";
import SplashScreen from "./components/SplashScreen";
import Home from "./pages/Home";
import Menu from "./pages/Menu";
import Settings from "./pages/Settings";
import Profile from "./pages/Profile";
import SearchSubscription from "./pages/SearchSubscription";
import SearchCustomer from "./pages/SearchCustomer";
import SearchCustomerForOwnership from "./pages/SearchCustomerForOwnership";
import SearchCustomerForCredit from "./pages/SearchCustomerForCredit";
import SimTermination from "./pages/SimTermination";
import CustomerTermination from "./pages/CustomerTermination";
import NewOwnerDetails from "./pages/NewOwnerDetails";
import ChangeOfOwnership from "./pages/ChangeOfOwnership";
import CreditLimitAdjustment from "./pages/CreditLimitAdjustment";
import SearchBundleActivation from "./pages/SearchBundleActivation";
import BundlePlans from "./pages/BundlePlans";
import EWallet from "./pages/EWallet";
import PrepaidSearchCustomer from "./pages/PrepaidSearchCustomer";
import PrepaidActivation from "./pages/PrepaidActivation";
import ExistingCustomerFound from "./pages/ExistingCustomerFound";
import NewActivation from "./pages/NewActivation";
import PhaseTwo from "./pages/PhaseTwo";
import NotFound from "./pages/NotFound";


const queryClient = new QueryClient();

const App = () => {
  const [showSplash, setShowSplash] = useState(false);
  return (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <TooltipProvider>
        {showSplash && <SplashScreen onFinish={() => setShowSplash(false)} />}
        <Toaster />
        <Sonner />
        <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/menu" element={<Menu />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/search-subscription" element={<SearchSubscription />} />
          <Route path="/search-customer" element={<SearchCustomer />} />
          <Route path="/search-customer-ownership" element={<SearchCustomerForOwnership />} />
          <Route path="/search-customer-credit" element={<SearchCustomerForCredit />} />
          <Route path="/sim-termination" element={<SimTermination />} />
          <Route path="/customer-termination" element={<CustomerTermination />} />
          <Route path="/new-owner-details" element={<NewOwnerDetails />} />
          <Route path="/change-of-ownership" element={<ChangeOfOwnership />} />
          <Route path="/credit-limit-adjustment" element={<CreditLimitAdjustment />} />
          <Route path="/search-bundle" element={<SearchBundleActivation />} />
          <Route path="/bundle-plans" element={<BundlePlans />} />
          <Route path="/ewallet" element={<EWallet />} />
          <Route path="/prepaid-search" element={<PrepaidSearchCustomer />} />
          <Route path="/prepaid-activation" element={<PrepaidActivation />} />
          <Route path="/prepaid-existing-customer" element={<ExistingCustomerFound />} />
          <Route path="/new-activation" element={<NewActivation />} />
          <Route path="/phase-2" element={<PhaseTwo />} />
          <Route path="*" element={<NotFound />} />

        </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
  );
};

export default App;
