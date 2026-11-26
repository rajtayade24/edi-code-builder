import { Component } from "react";

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, errorMessage: "" };
  }

  static getDerivedStateFromError(error) {
    return {
      hasError: true,
      errorMessage: error?.message || "An unexpected rendering error occurred.",
    };
  }

  componentDidCatch(error, info) {
    console.error("Unhandled UI error:", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <main className="mx-auto flex min-h-screen max-w-xl flex-col items-center justify-center px-6 text-center">
          <div className="w-full rounded-2xl border border-border bg-card p-8 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wider text-destructive">Workspace error</p>
            <h1 className="mt-2 text-2xl font-semibold text-foreground">Something went wrong</h1>
            <p className="mt-3 text-sm text-muted-foreground">{this.state.errorMessage}</p>
            <div className="mt-6 flex justify-center gap-3">
              <button
                type="button"
                onClick={() => window.location.assign("/app")}
                className="rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground"
              >
                Reload workspace
              </button>
              <button
                type="button"
                onClick={() => this.setState({ hasError: false, errorMessage: "" })}
                className="rounded-xl border border-border px-4 py-2.5 text-sm font-medium text-foreground"
              >
                Try again
              </button>
            </div>
          </div>
        </main>
      );
    }

    return this.props.children;
  }
}
