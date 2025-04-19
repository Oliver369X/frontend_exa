import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        "flex h-10 w-full rounded-md border border-gray-300 bg-white dark:bg-neutral-900 px-3 py-2 text-sm ring-offset-white dark:ring-offset-neutral-950 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-200 disabled:opacity-50 disabled:pointer-events-none",
        className
      )}
      {...props}
    />
  )
);
Input.displayName = "Input";
