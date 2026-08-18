"use client";

import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import { Slot } from "@radix-ui/react-slot";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "ghost" | "outline" | "danger" | "glow";
type Size = "sm" | "md" | "lg" | "xl" | "icon";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  asChild?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  isLoading?: boolean;
}

const VARIANTS: Record<Variant, string> = {
  primary:
    "bg-primary text-white hover:bg-primary-hover shadow-[0_4px_16px_-4px_rgba(99,102,241,0.5)] hover:shadow-[0_6px_24px_-4px_rgba(99,102,241,0.6)]",
  secondary:
    "bg-elevated text-primary hover:bg-overlay border border-border-strong",
  ghost: "bg-transparent text-secondary hover:text-primary hover:bg-hover",
  outline:
    "bg-transparent text-primary border border-border-strong hover:border-primary hover:bg-hover",
  danger:
    "bg-destructive text-white hover:bg-red-600 shadow-[0_4px_16px_-4px_rgba(239,68,68,0.5)]",
  glow: "bg-primary text-white hover:bg-primary-hover shadow-[0_0_0_1px_rgba(99,102,241,0.4),0_0_32px_rgba(99,102,241,0.45),0_0_64px_rgba(99,102,241,0.2)] hover:shadow-[0_0_0_1px_rgba(99,102,241,0.6),0_0_40px_rgba(99,102,241,0.6),0_0_80px_rgba(99,102,241,0.3)]",
};

const SIZES: Record<Size, string> = {
  sm: "h-8 px-3 text-xs gap-1.5",
  md: "h-10 px-4 text-sm gap-2",
  lg: "h-12 px-6 text-base gap-2",
  xl: "h-14 px-8 text-lg gap-2.5",
  icon: "h-10 w-10",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "primary",
      size = "md",
      asChild = false,
      leftIcon,
      rightIcon,
      isLoading,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    const Comp = asChild ? Slot : "button";

    const content = (
      <>
        {isLoading && (
          <svg
            className="animate-spin h-4 w-4 -ml-0.5"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
          >
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" opacity="0.25" />
            <path
              d="M4 12a8 8 0 018-8"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
            />
          </svg>
        )}
        {!isLoading && leftIcon}
        {children}
        {!isLoading && rightIcon}
      </>
    );

    return (
      <Comp
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center font-medium rounded-md transition-all duration-200 ease-out",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
          "disabled:opacity-50 disabled:pointer-events-none",
          "active:scale-[0.98]",
          VARIANTS[variant],
          SIZES[size],
          className
        )}
        disabled={disabled || isLoading}
        {...props}
      >
        {content}
      </Comp>
    );
  }
);

Button.displayName = "Button";
