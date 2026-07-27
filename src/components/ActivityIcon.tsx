import { LucideIcon } from "lucide-react";

interface ActivityIconProps {
  icon: LucideIcon;
  label: string;
  onClick?: () => void;
  color?: "teal" | "amber" | "primary";
  badge?: string;
}

const colorMap = {
  teal: {
    bg: "bg-[#F8FAFC] dark:bg-muted",
    icon: "text-teal-600 dark:text-teal-300",
    hover: "group-hover:bg-slate-100 dark:group-hover:bg-muted/70",
  },
  amber: {
    bg: "bg-[#F8FAFC] dark:bg-muted",
    icon: "text-amber-600 dark:text-amber-300",
    hover: "group-hover:bg-slate-100 dark:group-hover:bg-muted/70",
  },
  primary: {
    bg: "bg-[#F8FAFC] dark:bg-muted",
    icon: "text-primary",
    hover: "group-hover:bg-slate-100 dark:group-hover:bg-muted/70",
  },
};

const ActivityIcon = ({ icon: Icon, label, onClick, color = "teal", badge }: ActivityIconProps) => {
  const c = colorMap[color];
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center gap-2 group"
    >
      <div className="relative">
        <div className={`w-14 h-14 rounded-2xl ${c.bg} flex items-center justify-center transition-all ${c.hover} group-active:scale-95`}>
          <Icon className={`w-6 h-6 ${c.icon}`} strokeWidth={1.75} />
        </div>
        {badge && (
          <span className="absolute -top-1.5 -right-1.5 px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300 text-[8px] font-semibold leading-none whitespace-nowrap border border-amber-200 dark:border-amber-500/30 shadow-sm">
            {badge}
          </span>
        )}
      </div>
      <span className="text-xs text-foreground text-center leading-tight max-w-[70px]">
        {label}
      </span>
    </button>
  );
};

export default ActivityIcon;