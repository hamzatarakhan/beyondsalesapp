import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { ReactNode } from "react";

interface AppHeaderProps {
  title: string;
  showBack?: boolean;
  rightElement?: ReactNode;
  onBackClick?: () => void;
}

const AppHeader = ({ title, showBack = false, rightElement, onBackClick }: AppHeaderProps) => {
  const navigate = useNavigate();

  return (
    <header dir="ltr" className="sticky top-0 z-10 bg-background px-4 py-4 grid grid-cols-[2.5rem_1fr_2.5rem] items-center">
      <div className="flex items-center justify-center">
        {showBack && (
          <button
            onClick={onBackClick ? onBackClick : () => navigate("/")}
            className="w-10 h-10 flex items-center justify-center"
          >
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
        )}
      </div>
      <h1 className="text-center text-lg font-semibold text-foreground truncate">
        {title}
      </h1>
      <div className="flex items-center justify-center">
        {rightElement}
      </div>
    </header>
  );
};

export default AppHeader;
