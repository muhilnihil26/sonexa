import { Download, Monitor, Smartphone, X } from "lucide-react";
import { useState } from "react";

type AndroidDownloadChooserProps = {
  className?: string;
  label?: string;
};

export function AndroidDownloadChooser({
  className,
  label = "Android App",
}: AndroidDownloadChooserProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={className}>
        <Download className="h-4 w-4" />
        {label}
      </button>

      {open ? (
        <div className="fixed inset-0 z-[120] grid place-items-center bg-black/70 px-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-border bg-card p-5 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-foreground">Choose Android app</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Download the build that matches your device.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-border text-muted-foreground transition hover:bg-accent hover:text-foreground"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-5 grid gap-3">
              <a
                href="/sonexa-mobile.apk"
                download
                className="flex items-center gap-4 rounded-2xl border border-primary/30 bg-primary/10 p-4 transition hover:bg-primary/15"
              >
                <span className="grid h-12 w-12 place-items-center rounded-xl bg-primary text-primary-foreground">
                  <Smartphone className="h-6 w-6" />
                </span>
                <span className="min-w-0">
                  <span className="block font-semibold text-foreground">Mobile phone</span>
                  <span className="block text-sm text-muted-foreground">
                    Android mobile APK with Android Auto media support.
                  </span>
                </span>
              </a>

              <a
                href="/sonexa-tv.apk"
                download
                className="flex items-center gap-4 rounded-2xl border border-border bg-background/60 p-4 transition hover:bg-accent"
              >
                <span className="grid h-12 w-12 place-items-center rounded-xl bg-foreground text-background">
                  <Monitor className="h-6 w-6" />
                </span>
                <span className="min-w-0">
                  <span className="block font-semibold text-foreground">Android TV</span>
                  <span className="block text-sm text-muted-foreground">
                    TV APK with Leanback launcher support.
                  </span>
                </span>
              </a>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
