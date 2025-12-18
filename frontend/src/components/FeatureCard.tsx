import type { LucideIcon } from "lucide-react";

interface FeatureCardProps {
  icon: LucideIcon;
  iconColor: string;
  title: string;
  description: string;
}

function FeatureCard({
  icon: Icon,
  iconColor,
  title,
  description,
}: FeatureCardProps) {
  return (
    <div className="flex flex-col items-center text-center p-6 bg-zinc-900/40 border border-zinc-800 rounded-xl hover:border-zinc-700 transition-colors">
      {/* Icon */}
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-4 ${iconColor}`}>
        <Icon className="w-5 h-5" />
      </div>

      {/* Title */}
      <h4 className="text-white font-semibold mb-2">{title}</h4>

      {/* Description */}
      <p className="text-zinc-500 text-sm">{description}</p>
    </div>
  );
}

export default FeatureCard;
