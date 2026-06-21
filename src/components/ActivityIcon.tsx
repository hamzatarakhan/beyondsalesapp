import { LucideIcon } from "lucide-react";

interface ActivityIconProps {
  icon: LucideIcon;
  label: string;
  onClick?: () => void;
  color?: "teal" | "amber" | "primary";
}

const colorMap = {
  teal: { bg: "bg-teal-50", icon: "text-teal-600", hover: "group-hover:bg-teal-100" },
  amber: { bg: "bg-amber-50", icon: "text-amber-600", hover: "group-hover:bg-amber-100" },
  primary: { bg: "bg-primary/10", icon: "text-primary", hover: "group-hover:bg-primary/20" },
};

const ActivityIcon = ({ icon: Icon, label, onClick, color = "teal" }: ActivityIconProps) => {
  const c = colorMap[color];
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center gap-2 group"
    >
      <div className={`w-14 h-14 rounded-2xl ${c.bg} flex items-center justify-center transition-all ${c.hover} group-active:scale-95`}>
        <Icon className={`w-6 h-6 ${c.icon}`} strokeWidth={1.75} />
      </div>
      <span className="text-xs text-foreground text-center leading-tight max-w-[70px]">
        {label}
      </span>
    </button>
  );
};

export default ActivityIcon;
