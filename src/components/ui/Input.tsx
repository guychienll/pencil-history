import React from "react";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  fullWidth?: boolean;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, fullWidth = false, className = "", ...props }, ref) => {
    const inputClasses = `
      flex h-10 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm
      ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium
      placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-2
      focus-visible:ring-blue-500 focus-visible:ring-offset-2
      disabled:cursor-not-allowed disabled:opacity-50
      ${error ? "border-red-500 focus-visible:ring-red-500" : ""}
      ${fullWidth ? "w-full" : ""}
      ${className}
    `;

    return (
      <div className={fullWidth ? "w-full" : ""}>
        {label && (
          <label className="mb-2 block text-sm font-medium text-gray-700">
            {label}
          </label>
        )}
        <input ref={ref} className={inputClasses} {...props} />
        {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
      </div>
    );
  }
);

Input.displayName = "Input";
