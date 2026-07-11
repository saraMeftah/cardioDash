import React from 'react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

export const Button = React.forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive' | 'teal', size?: 'sm' | 'md' | 'lg' | 'icon' }>(
  ({ className, variant = 'primary', size = 'md', ...props }, ref) => {
    const variants = {
      primary: "bg-primary text-primary-foreground shadow-md shadow-primary/20 hover:shadow-lg hover:shadow-primary/30 hover:brightness-110 hover:-translate-y-0.5",
      teal: "bg-accent text-accent-foreground shadow-md shadow-accent/20 hover:shadow-lg hover:shadow-accent/30 hover:brightness-110 hover:-translate-y-0.5",
      secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
      outline: "border-2 border-border bg-transparent hover:bg-secondary text-foreground",
      ghost: "bg-transparent hover:bg-secondary text-foreground",
      destructive: "bg-destructive text-destructive-foreground shadow-md shadow-destructive/20 hover:bg-destructive/90 hover:-translate-y-0.5"
    };
    const sizes = {
      sm: "h-8 px-3 text-xs rounded-lg",
      md: "h-10 px-5 text-sm font-medium rounded-xl",
      lg: "h-12 px-7 text-sm font-semibold rounded-xl",
      icon: "h-10 w-10 flex items-center justify-center p-0 rounded-xl"
    };
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:pointer-events-none",
          variants[variant],
          sizes[size],
          className
        )}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        "flex h-10 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground transition-all duration-200",
        "file:border-0 file:bg-transparent file:text-sm file:font-medium",
        "placeholder:text-muted-foreground",
        "focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    />
  )
);
Input.displayName = "Input";

export const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...props }, ref) => (
    <textarea
      ref={ref}
      className={cn(
        "flex min-h-[90px] w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground transition-all duration-200",
        "placeholder:text-muted-foreground",
        "focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20",
        "disabled:cursor-not-allowed disabled:opacity-50 resize-none",
        className
      )}
      {...props}
    />
  )
);
Textarea.displayName = "Textarea";

export const Label = React.forwardRef<HTMLLabelElement, React.LabelHTMLAttributes<HTMLLabelElement>>(
  ({ className, ...props }, ref) => (
    <label
      ref={ref}
      className={cn("text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1.5 block", className)}
      {...props}
    />
  )
);
Label.displayName = "Label";

export const Card = ({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("rounded-2xl border border-border/60 bg-card text-card-foreground shadow-sm hover:shadow-md transition-shadow duration-300", className)} {...props}>
    {children}
  </div>
);

export const Badge = ({
  className,
  variant = 'default',
  children,
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & {
  variant?: 'default' | 'success' | 'warning' | 'destructive' | 'teal' | 'navy' | 'purple';
}) => {
  const variants = {
    default: "bg-secondary text-secondary-foreground",
    success: "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300",
    warning: "bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-300",
    destructive: "bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400",
    teal: "bg-teal-100 text-teal-800 dark:bg-[hsl(176,57%,44%)]/20 dark:text-[hsl(176,57%,60%)]",
    navy: "bg-blue-100 text-blue-900 dark:bg-blue-500/20 dark:text-blue-300",
    purple: "bg-purple-100 text-purple-800 dark:bg-purple-500/20 dark:text-purple-300",
  };
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold", variants[variant], className)} {...props}>
      {children}
    </span>
  );
};

export const Skeleton = ({ className }: { className?: string }) => (
  <div className={cn("shimmer rounded-xl", className)} />
);

export const Modal = ({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  className,
}: {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  className?: string;
}) => {
  const widths = { sm: 'max-w-sm', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-5xl', full: 'max-w-[95vw]' };
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 16 }}
            transition={{ duration: 0.2 }}
            className={cn("relative w-full rounded-2xl border border-border bg-card p-6 shadow-2xl shadow-black/20 z-10 max-h-[90vh] flex flex-col", widths[size], className)}
          >
            <div className="flex items-center justify-between mb-5 shrink-0">
              <h2 className="text-lg font-display font-bold">{title}</h2>
              <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8 rounded-full">
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="overflow-y-auto flex-1 pr-1">
              {children}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export const Select = React.forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement>>(
  ({ className, ...props }, ref) => (
    <select
      ref={ref}
      className={cn(
        "flex h-10 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground transition-all duration-200",
        "focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20",
        "disabled:cursor-not-allowed disabled:opacity-50 appearance-none",
        className
      )}
      {...props}
    />
  )
);
Select.displayName = "Select";
