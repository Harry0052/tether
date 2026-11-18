import { cva, type VariantProps } from "class-variance-authority";
import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

const buttonVariants = cva(
  "inline-flex min-h-12 items-center justify-center gap-2 rounded-full px-5 text-base font-semibold transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-50",
  {
    variants: {
      variant: {
        primary: "bg-navy text-ivory hover:bg-navy-soft",
        secondary: "border border-navy/15 bg-mint text-navy hover:bg-mint-deep",
        ghost: "bg-transparent text-navy hover:bg-navy/5",
        danger: "bg-danger text-ivory hover:bg-[#741818]",
      },
    },
    defaultVariants: { variant: "primary" },
  },
);

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & VariantProps<typeof buttonVariants>;

export function buttonClass(
  variant: "primary" | "secondary" | "ghost" | "danger" = "primary",
  className?: string,
) {
  return cn(buttonVariants({ variant }), className);
}

export function Button({ className, variant = "primary", type = "button", ...props }: ButtonProps) {
  return <button type={type} className={buttonClass(variant ?? "primary", className)} {...props} />;
}
