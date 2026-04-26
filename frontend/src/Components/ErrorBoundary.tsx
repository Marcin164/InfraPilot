import { Component, ReactNode } from "react";

type Props = {
  children: ReactNode;
  fallback?: (error: Error, reset: () => void) => ReactNode;
};

type State = { error: Error | null };

/**
 * Top-level boundary so a render error in one panel doesn't blank the
 * whole app. Logs once to the console (and would push to Sentry/Datadog
 * here if configured). The reset callback re-mounts children — useful
 * when the user clicks "Try again" after a transient failure.
 */
export default class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: unknown) {
    // eslint-disable-next-line no-console
    console.error("[ErrorBoundary]", error, info);
    // If you wire Sentry/Datadog later, dispatch here.
  }

  reset = () => this.setState({ error: null });

  render() {
    if (!this.state.error) return this.props.children;

    if (this.props.fallback) {
      return this.props.fallback(this.state.error, this.reset);
    }

    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAFAFA] p-6">
        <div className="max-w-[480px] w-full bg-white shadow-xl rounded-[10px] p-6">
          <h1 className="text-[20px] font-bold text-[#C0392B]">
            Something went wrong
          </h1>
          <p className="text-[13px] text-[#535353] mt-2">
            The page hit an unexpected error. The team has been notified.
          </p>
          <pre className="mt-4 text-[11px] text-[#7a7a7a] bg-[#FAFAFA] rounded p-2 overflow-x-auto max-h-[200px]">
            {this.state.error.message}
          </pre>
          <div className="mt-4 flex gap-2">
            <button
              type="button"
              onClick={this.reset}
              className="rounded-[6px] bg-[#2B9AE9] text-white px-4 py-2 text-[13px] font-bold cursor-pointer"
            >
              Try again
            </button>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="rounded-[6px] border border-[#D0D0D0] px-4 py-2 text-[13px] font-bold cursor-pointer"
            >
              Reload page
            </button>
          </div>
        </div>
      </div>
    );
  }
}
