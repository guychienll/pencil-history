"use client";

import React, { Component, ErrorInfo, ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error("Error caught by ErrorBoundary:", error, errorInfo);
  }

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex min-h-screen items-center justify-center p-4 bg-background">
          <div className="max-w-md rounded-lg border-2 border-error/50 bg-error-light p-6 shadow-lg">
            <h2 className="mb-2 text-xl font-semibold text-error">發生錯誤</h2>
            <p className="mb-4 text-error/90">
              {this.state.error?.message || "應用程式遇到未預期的錯誤"}
            </p>
            <button
              onClick={() => this.setState({ hasError: false, error: undefined })}
              className="rounded-lg bg-error px-4 py-2 text-white hover:bg-error-hover transition-all duration-200 cursor-pointer"
            >
              重試
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
