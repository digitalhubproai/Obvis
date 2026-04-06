"use client";

import { motion } from "framer-motion";
import { Activity } from "lucide-react";
import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  iconClassName?: string;
  textClassName?: string;
  showText?: boolean;
  href?: string;
  size?: "sm" | "md" | "lg";
}

export function Logo({
  className,
  iconClassName,
  textClassName,
  showText = true,
  href = "/",
  size = "md",
}: LogoProps) {
  const sizeMap = {
    sm: { icon: "w-6 h-6", container: "w-8 h-8", text: "text-lg" },
    md: { icon: "w-6 h-6 md:w-7 md:h-7", container: "w-10 h-10", text: "text-xl md:text-2xl" },
    lg: { icon: "w-8 h-8 md:w-10 md:h-10", container: "w-12 h-12 md:w-16 md:h-16", text: "text-3xl md:text-4xl" },
  };

  const currentSize = sizeMap[size];

  const content = (
    <div className={cn("flex items-center gap-2 group", className)}>
      <div className={cn(
        "relative flex items-center justify-center rounded-full bg-sky-500/10 border border-sky-500/20 group-hover:bg-sky-500/20 transition-colors",
        currentSize.container,
        iconClassName
      )}>
        <Activity className={cn("text-sky-400", currentSize.icon)} />
        <motion.div
          className="absolute inset-0 rounded-full bg-sky-400/20 blur-md -z-10"
          animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 4, repeat: Infinity }}
        />
      </div>
      {showText && (
        <span className={cn(
          "font-bold tracking-tight text-white",
          currentSize.text,
          textClassName
        )}>
          Obvis<span className="text-sky-400">.</span>
        </span>
      )}
    </div>
  );

  if (href) {
    return <a href={href}>{content}</a>;
  }

  return content;
}
