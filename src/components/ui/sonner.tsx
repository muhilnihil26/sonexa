import { Toaster as Sonner } from "sonner";
import { CheckCircle, XCircle, Info, AlertTriangle } from "lucide-react";

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      className="toaster group"
      position="top-center"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-card/90 group-[.toaster]:backdrop-blur-xl group-[.toaster]:text-foreground group-[.toaster]:border-border/50 group-[.toaster]:shadow-2xl group-[.toaster]:rounded-2xl group-[.toaster]:overflow-hidden",
          description: "group-[.toast]:text-muted-foreground group-[.toast]:text-sm",
          actionButton: 
            "group-[.toast]:bg-brand-gradient group-[.toast]:text-background group-[.toast]:font-semibold group-[.toast]:rounded-lg group-[.toast]:px-4 group-[.toast]:py-2 group-[.toast]:shadow-glow group-[.toast]:hover:scale-105 group-[.toast]:transition-transform",
          cancelButton: 
            "group-[.toast]:bg-muted/50 group-[.toast]:text-muted-foreground group-[.toast]:rounded-lg group-[.toast]:px-4 group-[.toast]:py-2 group-[.toast]:hover:bg-muted group-[.toast]:transition-colors",
          success: "group-[.toast]:border-green-500/30 group-[.toast]:bg-gradient-to-br group-[.toast]:from-green-500/10 group-[.toast]:to-transparent",
          error: "group-[.toast]:border-red-500/30 group-[.toast]:bg-gradient-to-br group-[.toast]:from-red-500/10 group-[.toast]:to-transparent",
          info: "group-[.toast]:border-blue-500/30 group-[.toast]:bg-gradient-to-br group-[.toast]:from-blue-500/10 group-[.toast]:to-transparent",
          warning: "group-[.toast]:border-yellow-500/30 group-[.toast]:bg-gradient-to-br group-[.toast]:from-yellow-500/10 group-[.toast]:to-transparent",
        },
      }}
      icons={{
        success: <CheckCircle className="h-5 w-5 text-green-500" />,
        error: <XCircle className="h-5 w-5 text-red-500" />,
        info: <Info className="h-5 w-5 text-blue-500" />,
        warning: <AlertTriangle className="h-5 w-5 text-yellow-500" />,
      }}
      {...props}
    />
  );
};

export { Toaster };
