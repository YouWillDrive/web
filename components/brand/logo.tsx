import React from "react";
import { Car } from "lucide-react";
import { cn } from "@/lib/utils";

interface LogoProps {
  size?: "sm" | "md" | "lg" | "xl";
  showText?: boolean;
  className?: string;
  iconClassName?: string;
  textClassName?: string;
}

const sizeConfig = {
  sm: {
    container: "h-8 w-8",
    icon: "h-4 w-4",
    text: "text-sm",
  },
  md: {
    container: "h-12 w-12",
    icon: "h-6 w-6",
    text: "text-lg",
  },
  lg: {
    container: "h-16 w-16",
    icon: "h-8 w-8",
    text: "text-xl",
  },
  xl: {
    container: "h-20 w-20",
    icon: "h-10 w-10",
    text: "text-2xl",
  },
};

export function Logo({
  size = "md",
  showText = true,
  className,
  iconClassName,
  textClassName,
}: LogoProps) {
  const config = sizeConfig[size];

  return (
    <div className={cn("flex items-center gap-3", className)}>
      {/* Logo Icon Container */}
      <div
        className={cn(
          "bg-primary/10 rounded-2xl flex items-center justify-center",
          config.container
        )}
      >
        <Car
          className={cn(
            "text-primary",
            config.icon,
            iconClassName
          )}
        />
      </div>

      {/* Logo Text */}
      {showText && (
        <div className="flex flex-col">
          <h1
            className={cn(
              "font-bold tracking-tight text-foreground leading-none",
              config.text,
              textClassName
            )}
          >
            YouWillDrive
          </h1>
          {size === "lg" || size === "xl" ? (
            <p className="text-xs text-muted-foreground mt-1">
              Ваш надежный спутник
            </p>
          ) : null}
        </div>
      )}
    </div>
  );
}

export default Logo;
