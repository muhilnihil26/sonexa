import { AlertCircle, RefreshCw, Home } from "lucide-react";

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  onHome?: () => void;
  className?: string;
}

export function ErrorState({ 
  title = "Something went wrong", 
  message = "An error occurred while loading this content",
  onRetry,
  onHome,
  className = ""
}: ErrorStateProps) {
  return (
    <div className={`flex flex-col items-center justify-center p-8 text-center ${className}`}>
      <div className="h-16 w-16 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
        <AlertCircle className="h-8 w-8 text-destructive" />
      </div>
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground mb-6 max-w-md">{message}</p>
      <div className="flex gap-3">
        {onRetry && (
          <button
            onClick={onRetry}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition"
          >
            <RefreshCw className="h-4 w-4" />
            Try Again
          </button>
        )}
        {onHome && (
          <button
            onClick={onHome}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-border bg-background hover:bg-accent font-medium transition"
          >
            <Home className="h-4 w-4" />
            Go Home
          </button>
        )}
      </div>
    </div>
  );
}

interface ErrorCardProps {
  title?: string;
  message?: string;
  onDismiss?: () => void;
}

export function ErrorCard({ title, message, onDismiss }: ErrorCardProps) {
  return (
    <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-6">
      <div className="flex items-start gap-4">
        <div className="h-10 w-10 rounded-full bg-destructive/10 flex items-center justify-center shrink-0">
          <AlertCircle className="h-5 w-5 text-destructive" />
        </div>
        <div className="flex-1 min-w-0">
          {title && <h4 className="font-semibold mb-1">{title}</h4>}
          {message && <p className="text-sm text-muted-foreground">{message}</p>}
        </div>
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="p-1 rounded-lg hover:bg-destructive/10 transition"
          >
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </button>
        )}
      </div>
    </div>
  );
}
