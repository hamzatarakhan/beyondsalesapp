import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import SearchSubscription from "./pages/SearchSubscription";
import SearchCustomer from "./pages/SearchCustomer";
import SearchCustomerForOwnership from "./pages/SearchCustomerForOwnership";
import SearchCustomerForCredit from "./pages/SearchCustomerForCredit";
import SimTermination from "./pages/SimTermination";
import CustomerTermination from "./pages/CustomerTermination";
import ChangeOfOwnership from "./pages/ChangeOfOwnership";
import CreditLimitAdjustment from "./pages/CreditLimitAdjustment";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/search-subscription" element={<SearchSubscription />} />
          <Route path="/search-customer" element={<SearchCustomer />} />
          <Route path="/search-customer-ownership" element={<SearchCustomerForOwnership />} />
          <Route path="/search-customer-credit" element={<SearchCustomerForCredit />} />
          <Route path="/sim-termination" element={<SimTermination />} />
          <Route path="/customer-termination" element={<CustomerTermination />} />
          <Route path="/change-of-ownership" element={<ChangeOfOwnership />} />
          <Route path="/credit-limit-adjustment" element={<CreditLimitAdjustment />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
