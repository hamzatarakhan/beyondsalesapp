import { Home, LayoutGrid, Settings, User } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";

const navItems = [
  { icon: Home, label: "Home", path: "/" },
  { icon: LayoutGrid, label: "Menu", path: "/menu" },
  { icon: Settings, label: "Settings", path: "/settings" },
  { icon: User, label: "Profile", path: "/profile" },
];

const BottomNav = () => {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card shadow-[0_-4px_20px_rgba(0,0,0,0.08)] rounded-t-3xl z-50">
      <div className="max-w-[390px] mx-auto flex items-center justify-around py-3 px-6">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;
          
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`flex items-center justify-center w-12 h-12 rounded-full transition-all ${
                isActive 
                  ? "bg-primary text-primary-foreground shadow-lg" 
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className="w-5 h-5" />
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;
