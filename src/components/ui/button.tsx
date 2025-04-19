import * as React from "react";
import { cn } from "@/lib/utils";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean;
  variant?: "default" | "outline" | "secondary" | "destructive" | "ghost";
  size?: "default" | "icon";
}

const variantClasses: Record<string, string> = {
  default: "bg-gray-900 text-white dark:bg-gray-100 dark:text-gray-900 hover:bg-gray-700 dark:hover:bg-gray-200",
  outline: "border border-gray-300 dark:border-neutral-700 bg-transparent text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-neutral-900",
  secondary: "bg-gray-100 dark:bg-neutral-900 text-gray-900 dark:text-gray-100 hover:bg-gray-200 dark:hover:bg-neutral-800",
  destructive: "bg-red-600 text-white hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-800",
  ghost: "bg-transparent hover:bg-gray-100 dark:hover:bg-neutral-900 text-gray-900 dark:text-gray-100",
};

const sizeClasses: Record<string, string> = {
  default: "px-4 py-2 text-sm",
  icon: "p-2 w-9 h-9 flex items-center justify-center",
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, asChild = false, variant = "default", size = "default", ...props }, ref) => {
    const Comp = asChild ? ("a" as any) : "button";
    return (
      <Comp
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center whitespace-nowrap rounded-md font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-gray-400 dark:focus:ring-gray-800 disabled:opacity-50 disabled:pointer-events-none",
          variantClasses[variant],
          sizeClasses[size],
          className
        )}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";
