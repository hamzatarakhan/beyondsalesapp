import { ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import AppHeader from "@/components/AppHeader";
import SimIcon from "@/components/SimIcon";

const Home = () => {
  const navigate = useNavigate();

  return (
    <div className="mobile-container">
      <AppHeader title="Home" />
      
      <div className="px-4 pt-8">
        <div
          onClick={() => navigate("/search-subscription")}
          className="app-card-interactive flex items-center gap-4"
        >
          <SimIcon />
          
          <div className="flex-1">
            <h3 className="font-semibold text-foreground">SIM Termination</h3>
            <p className="text-sm text-muted-foreground mt-0.5">
              Terminate an existing SIM subscription
            </p>
          </div>
          
          <ChevronRight className="w-5 h-5 text-muted-foreground" />
        </div>
      </div>
    </div>
  );
};

export default Home;
