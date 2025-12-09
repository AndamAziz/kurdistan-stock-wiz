import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2.5 whitespace-nowrap rounded-xl text-sm font-semibold ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 active:scale-[0.97]",
  {
    variants: {
      variant: {
        default: "bg-gradient-to-br from-primary to-primary/80 text-primary-foreground hover:from-primary/90 hover:to-primary/70 shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 border border-primary/20",
        destructive: "bg-gradient-to-br from-destructive to-destructive/80 text-destructive-foreground hover:from-destructive/90 hover:to-destructive/70 shadow-lg shadow-destructive/25 hover:shadow-xl hover:shadow-destructive/30 border border-destructive/20",
        outline: "border-2 border-input bg-background/80 backdrop-blur-sm hover:bg-accent/40 hover:text-accent-foreground hover:border-primary/40 shadow-sm hover:shadow-md",
        secondary: "bg-gradient-to-br from-secondary to-secondary/80 text-secondary-foreground hover:from-secondary/90 hover:to-secondary/70 shadow-md border border-secondary-foreground/10",
        ghost: "hover:bg-accent/40 hover:text-accent-foreground hover:shadow-sm",
        link: "text-primary underline-offset-4 hover:underline font-medium",
        success: "bg-gradient-to-br from-success to-success/80 text-success-foreground hover:from-success/90 hover:to-success/70 shadow-lg shadow-success/25 hover:shadow-xl hover:shadow-success/30 border border-success/20",
      },
      size: {
        default: "h-11 px-6 py-2.5 [&_svg]:size-4",
        sm: "h-9 rounded-lg px-4 text-xs [&_svg]:size-3.5",
        lg: "h-13 rounded-xl px-8 text-base [&_svg]:size-5",
        icon: "h-11 w-11 rounded-xl [&_svg]:size-5",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };