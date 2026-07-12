import { Loader2 } from "lucide-react";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  text?: string;
  className?: string;
}

export function LoadingSpinner({ size = "md", text, className = "" }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-8 w-8",
    lg: "h-12 w-12",
  };

  return (
    <div className={`flex flex-col items-center justify-center gap-3 ${className}`}>
      <Loader2 className={`animate-spinner text-primary ${sizeClasses[size]}`} />
      {text && <p className="text-sm text-muted-foreground">{text}</p>}
    </div>
  );
}

interface LoadingScreenProps {
  text?: string;
}

export function LoadingScreen({ text = "Loading..." }: LoadingScreenProps) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-12 w-12 animate-spinner text-primary" />
        <p className="text-lg font-medium text-foreground">{text}</p>
      </div>
    </div>
  );
}

interface LoadingCardProps {
  title?: string;
  description?: string;
}

export function LoadingCard({ title, description }: LoadingCardProps) {
  return (
    <div className="rounded-2xl border border-border bg-card/40 p-8 text-center">
      <Loader2 className="mx-auto h-8 w-8 animate-spinner text-primary mb-4" />
      {title && <h3 className="text-lg font-semibold mb-2">{title}</h3>}
      {description && <p className="text-sm text-muted-foreground">{description}</p>}
    </div>
  );
}
