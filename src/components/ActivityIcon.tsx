import { LucideIcon } from "lucide-react";

/** Where a service sits in its rollout: still being built, awaiting sign-off, or signed off. */
export type BadgeTone = "progress" | "confirm" | "approved";

interface ActivityIconProps {
  icon: LucideIcon;
  label: string;
  onClick?: () => void;
  color?: "teal" | "amber" | "primary";
  badge?: string;
  badgeTone?: BadgeTone;
}

const badgeToneMap: Record<BadgeTone, string> = {
  progress: "bg-sky-100 text-sky-700 border-sky-200 dark:bg-sky-500/20 dark:text-sky-300 dark:border-sky-500/30",
  confirm: "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-500/20 dark:text-amber-300 dark:border-amber-500/30",
  approved: "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-500/20 dark:text-emerald-300 dark:border-emerald-500/30",
};

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

const ActivityIcon = ({ icon: Icon, label, onClick, color = "teal", badge, badgeTone = "progress" }: ActivityIconProps) => {
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
          <span className={`absolute -top-1.5 -right-1.5 px-1.5 py-0.5 rounded-full text-[8px] font-semibold leading-none whitespace-nowrap border shadow-sm ${badgeToneMap[badgeTone]}`}>
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