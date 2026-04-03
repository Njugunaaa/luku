import { cn } from "@/lib/utils";
import { AlertTriangle, Home, RotateCcw } from "lucide-react";
import { Component, ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      const isProduction = import.meta.env.PROD;

      return (
        <div className="flex min-h-screen items-center justify-center bg-background px-6 py-12">
          <div
            className="w-full max-w-2xl rounded-3xl border border-border bg-card p-8 shadow-sm md:p-10"
            role="alert"
            aria-live="assertive"
          >
            <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-destructive/10">
              <AlertTriangle
                size={28}
                className="text-destructive flex-shrink-0"
              />
            </div>

            <p className="mb-2 text-sm font-semibold uppercase tracking-[0.22em] text-muted-foreground">
              Something went wrong
            </p>
            <h2 className="mb-3 text-2xl font-semibold text-foreground">
              We hit a problem loading this page.
            </h2>
            <p className="mb-6 max-w-xl text-sm leading-6 text-muted-foreground md:text-base">
              {isProduction
                ? "Please refresh the page. If the problem continues after deployment, check the Vercel build settings and environment variables."
                : "A runtime error stopped the page from rendering. The details are below to help with debugging locally."}
            </p>

            {!isProduction && this.state.error?.stack ? (
              <div className="mb-6 overflow-auto rounded-2xl bg-muted p-4">
                <pre className="text-sm text-muted-foreground whitespace-break-spaces">
                  {this.state.error.stack}
                </pre>
              </div>
            ) : null}

            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                onClick={() => window.location.reload()}
                className={cn(
                  "inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 font-medium",
                  "bg-primary text-primary-foreground transition-opacity hover:opacity-90"
                )}
              >
                <RotateCcw size={16} />
                Reload Page
              </button>

              <a
                href="/"
                className={cn(
                  "inline-flex items-center justify-center gap-2 rounded-xl border border-border px-4 py-2.5 font-medium",
                  "bg-background text-foreground transition-colors hover:bg-muted"
                )}
              >
                <Home size={16} />
                Go Home
              </a>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
