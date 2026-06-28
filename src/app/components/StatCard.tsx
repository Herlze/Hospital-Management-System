import { LucideIcon } from "lucide-react";
import { GlassCard } from "./GlassCard";
import { motion } from "motion/react";

interface StatCardProps {
  title: string;
  value: string | number;
  change?: string;
  changeType?: "increase" | "decrease" | "neutral";
  icon: LucideIcon;
  iconColor: string;
  onClick?: () => void;
}

export const StatCard = ({ title, value, change, changeType, icon: Icon, iconColor, onClick }: StatCardProps) => {
  return (
    <motion.div whileHover={{ scale: onClick ? 1.02 : 1 }} whileTap={{ scale: onClick ? 0.98 : 1 }}>
      <GlassCard hover={!!onClick} className="p-6" onClick={onClick}>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-[#94a3b8] text-sm mb-2">{title}</p>
            <h3 className="text-3xl font-bold text-white mb-2">{value}</h3>
            {change && (
              <p className={`text-sm ${
                changeType === "increase" ? "text-[#10b981]" :
                changeType === "decrease" ? "text-[#ef4444]" :
                "text-[#94a3b8]"
              }`}>
                {change}
              </p>
            )}
          </div>
          <div className={`p-3 rounded-lg bg-gradient-to-br ${iconColor}`}>
            <Icon className="w-6 h-6 text-white" />
          </div>
        </div>
      </GlassCard>
    </motion.div>
  );
};
