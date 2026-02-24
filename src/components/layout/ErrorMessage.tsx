export interface ErrorMessageProps {
  message: string;
  title?: string;
  onRetry?: () => void;
  className?: string;
}

export function ErrorMessage({
  message,
  title = "錯誤",
  onRetry,
  className = "",
}: ErrorMessageProps) {
  return (
    <div
      className={`rounded-lg border-2 border-error/50 bg-error-light p-5 shadow-sm ${className}`}
    >
      <div className="flex">
        <div className="flex-shrink-0">
          <svg
            className="h-5 w-5 text-error"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
              clipRule="evenodd"
            />
          </svg>
        </div>
        <div className="ml-3 flex-1">
          <h3 className="text-sm font-semibold text-error">{title}</h3>
          <div className="mt-2 text-sm text-error/90">
            <p>{message}</p>
          </div>
          {onRetry && (
            <div className="mt-4">
              <button
                type="button"
                onClick={onRetry}
                className="rounded-lg bg-error px-4 py-2 text-sm font-semibold text-white hover:bg-error-hover focus:outline-none focus:ring-2 focus:ring-error focus:ring-offset-2 focus:ring-offset-error-light transition-all duration-200 cursor-pointer"
              >
                重試
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
