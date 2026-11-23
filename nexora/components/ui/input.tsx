import * as React from "react";
import { cn } from "@/lib/utils";

export function Input({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "h-11 w-full rounded-xl border border-line bg-panel2 px-4 text-sm text-foreground placeholder:text-muted",
        "focus:border-accentdim focus:outline-none focus:ring-2 focus:ring-accent/20",
        "disabled:opacity-50",
        className
      )}
      {...props}
    />
  );
}

export function Textarea({
  className,
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        "min-h-[96px] w-full rounded-xl border border-line bg-panel2 px-4 py-3 text-sm text-foreground placeholder:text-muted",
        "focus:border-accentdim focus:outline-none focus:ring-2 focus:ring-accent/20",
        "disabled:opacity-50",
        className
      )}
      {...props}
    />
  );
}

export function Label({
  className,
  ...props
}: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label
      className={cn(
        "mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.14em] text-muted",
        className
      )}
      {...props}
    />
  );
}

export function Select({
  className,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        "h-11 w-full rounded-xl border border-line bg-panel2 px-4 text-sm text-foreground",
        "focus:border-accentdim focus:outline-none focus:ring-2 focus:ring-accent/20",
        className
      )}
      {...props}
    />
  );
}
