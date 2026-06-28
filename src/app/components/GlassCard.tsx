import { ReactNode } from "react";

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
}

export const GlassCard = ({ children, className = "", hover = false }: GlassCardProps) => {
  return (
    <div
      className={`backdrop-blur-xl bg-[rgba(15,23,42,0.6)] border border-[rgba(148,163,184,0.2)] rounded-xl shadow-lg ${
        hover ? "hover:bg-[rgba(15,23,42,0.7)] hover:border-[rgba(14,165,233,0.3)] transition-all cursor-pointer" : ""
      } ${className}`}
    >
      {children}
    </div>
  );
};
