import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface AppHeaderProps {
  title: string;
  showBack?: boolean;
}

const AppHeader = ({ title, showBack = false }: AppHeaderProps) => {
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-10 bg-background px-4 py-4 flex items-center">
      {showBack && (
        <button
          onClick={() => navigate(-1)}
          className="w-10 h-10 flex items-center justify-center -ml-2"
        >
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
      )}
      <h1 className="flex-1 text-center text-lg font-semibold text-foreground pr-10">
        {title}
      </h1>
    </header>
  );
};

export default AppHeader;
