/**
 * Button Component
 *
 * Reusable button with variants based on shadcn/ui patterns
 * Updated with ID8Labs design language:
 * - NO 90° angles (rounded-lg minimum)
 * - Glass morphism variant
 * - Lexicon brand variant with glow
 */

import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  // Base styles - NO 90° angles (rounded-lg minimum)
  'inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-medium ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground hover:bg-primary/90',
        destructive:
          'bg-destructive text-destructive-foreground hover:bg-destructive/90',
        outline:
          'border border-input bg-background hover:bg-accent hover:text-accent-foreground',
        secondary:
          'bg-secondary text-secondary-foreground hover:bg-secondary/80',
        ghost: 'hover:bg-accent hover:text-accent-foreground',
        link: 'text-primary underline-offset-4 hover:underline',
        // Lexicon brand button with glow on hover
        lexicon:
          'bg-lexicon-500 text-white hover:bg-lexicon-400 hover:shadow-glow-sm hover:-translate-y-0.5',
        // Lexicon outline variant
        'lexicon-outline':
          'border border-lexicon-500/30 text-lexicon-400 hover:bg-lexicon-500/10 hover:border-lexicon-500/50',
        // Glass morphism variant
        glass:
          'glass-surface text-white hover:bg-white/[0.08] border border-white/[0.08] hover:border-white/[0.15] hover:-translate-y-0.5',
        // Glass with lexicon accent
        'glass-lexicon':
          'glass-surface text-lexicon-400 border border-lexicon-500/20 hover:border-lexicon-500/40 hover:shadow-glow-sm hover:-translate-y-0.5',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-9 rounded-lg px-3',
        lg: 'h-11 rounded-xl px-8',
        xl: 'h-12 rounded-xl px-10 text-base',
        icon: 'h-10 w-10',
        'icon-sm': 'h-8 w-8',
        'icon-lg': 'h-12 w-12',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants };
