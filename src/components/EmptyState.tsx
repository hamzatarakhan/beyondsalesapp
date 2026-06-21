import { LucideIcon } from "lucide-react";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
}

const EmptyState = ({ icon: Icon, title, description }: EmptyStateProps) => {
  return (
    <div className="flex flex-col items-center justify-center px-6 pt-24 text-center">
      <div className="flex items-center justify-center w-20 h-20 rounded-2xl bg-muted mb-6">
        <Icon className="w-10 h-10 text-primary" strokeWidth={1.75} />
      </div>
      <h2 className="text-xl font-semibold text-foreground mb-2">{title}</h2>
      <p className="text-sm text-muted-foreground max-w-xs leading-relaxed">
        {description}
      </p>
    </div>
  );
};

export default EmptyState;
