import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex select-none items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold transition-all duration-150 focus-visible:outline-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        gold: "bg-gold text-[#241b06] shadow-[0_2px_0_0_#a8843a] hover:bg-[#f4cd72] active:translate-y-[1px] active:shadow-none",
        accent:
          "bg-accent text-[#062630] shadow-[0_2px_0_0_var(--color-accentdim)] hover:brightness-110 active:translate-y-[1px] active:shadow-none",
        outline:
          "border border-line bg-panel2 text-foreground hover:bg-panel3 hover:border-[#34436a]",
        ghost: "text-foreground hover:bg-white/5",
        danger: "border border-[#5a2b28] bg-[#2a1616] text-[#ff9d92] hover:bg-[#3a1d1b]",
      },
      size: {
        sm: "h-8 px-3 text-xs",
        md: "h-10 px-4",
        lg: "h-12 px-6 text-base",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: { variant: "accent", size: "md" },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export function Button({ className, variant, size, type, ...props }: ButtonProps) {
  return (
    <button
      type={type ?? "button"}
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  );
}

export { buttonVariants };
