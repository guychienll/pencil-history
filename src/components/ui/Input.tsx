import React from "react";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  fullWidth?: boolean;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, fullWidth = false, className = "", ...props }, ref) => {
    const inputClasses = `
      flex h-11 rounded-lg border-2 border-border bg-surface px-4 py-2 text-sm
      text-foreground font-medium transition-all duration-200
      ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium
      placeholder:text-foreground-muted focus-visible:outline-none focus-visible:border-border-focus
      focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:ring-offset-0
      hover:border-border-secondary
      disabled:cursor-not-allowed disabled:opacity-50
      ${error ? "border-error focus-visible:border-error focus-visible:ring-error/20" : ""}
      ${fullWidth ? "w-full" : ""}
      ${className}
    `;

    return (
      <div className={fullWidth ? "w-full" : ""}>
        {label && (
          <label className="mb-2 block text-sm font-semibold text-foreground">{label}</label>
        )}
        <input ref={ref} className={inputClasses} {...props} />
        {error && <p className="mt-2 text-sm text-error font-medium">{error}</p>}
      </div>
    );
  }
);

Input.displayName = "Input";
