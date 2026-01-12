import { LucideIcon } from "lucide-react";

interface ActivityIconProps {
  icon: LucideIcon;
  label: string;
  onClick?: () => void;
}

const ActivityIcon = ({ icon: Icon, label, onClick }: ActivityIconProps) => {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center gap-2 group"
    >
      <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center transition-all group-hover:bg-primary/20 group-active:scale-95">
        <Icon className="w-6 h-6 text-primary" />
      </div>
      <span className="text-xs text-foreground text-center leading-tight max-w-[70px]">
        {label}
      </span>
    </button>
  );
};

export default ActivityIcon;
