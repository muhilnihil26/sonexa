import { Calendar, Clock, ToggleLeft, ToggleRight, Save, Zap } from "lucide-react";
import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import {
  getDownloadSchedule,
  setDownloadSchedule,
  getDiscoverySchedule,
  setDiscoverySchedule,
} from "@/lib/api/scheduler.functions";

const DAYS = [
  { code: "monday", label: "Monday" },
  { code: "tuesday", label: "Tuesday" },
  { code: "wednesday", label: "Wednesday" },
  { code: "thursday", label: "Thursday" },
  { code: "friday", label: "Friday" },
  { code: "saturday", label: "Saturday" },
  { code: "sunday", label: "Sunday" },
];

const LANGUAGES = ["tamil", "hindi", "telugu", "malayalam", "kannada", "english"];

export function DownloadScheduler() {
  const getSchedule = useServerFn(getDownloadSchedule);
  const saveSchedule = useServerFn(setDownloadSchedule);
  const qc = useQueryClient();
  
  const { data } = useQuery({
    queryKey: ["download-schedule"],
    queryFn: () => getSchedule(),
  });

  const [enabled, setEnabled] = useState(false);
  const [day, setDay] = useState("monday");
  const [hour, setHour] = useState(2);
  const [minute, setMinute] = useState(0);
  const [language, setLanguage] = useState("");
  const [limit, setLimit] = useState(50);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (data?.schedule) {
      setEnabled(data.schedule.enabled ?? false);
      setDay(data.schedule.day ?? "monday");
      setHour(data.schedule.hour ?? 2);
      setMinute(data.schedule.minute ?? 0);
      setLanguage(data.schedule.language ?? "");
      setLimit(data.schedule.limit ?? 50);
    }
  }, [data?.schedule]);

  async function handleSave() {
    setSaving(true);
    try {
      await saveSchedule({
        data: { enabled, day, hour, minute, language: language || undefined, limit },
      });
      toast.success("Download schedule saved");
      qc.invalidateQueries({ queryKey: ["download-schedule"] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to save schedule");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mt-8 p-5 rounded-xl border border-border bg-card/40">
      <div className="flex items-center gap-2 text-sm font-semibold mb-3">
        <Calendar className="h-4 w-4 text-primary" /> Weekly YouTube Backup Download
      </div>
      <p className="text-xs text-muted-foreground mb-4">
        Automatically download YouTube tracks as MP4 backups on a weekly schedule.
      </p>

      <div className="grid gap-4">
        {/* Enable toggle */}
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium">Enable automatic downloads</label>
          <button
            onClick={() => setEnabled(!enabled)}
            className="inline-flex shrink-0 items-center gap-2 rounded-lg border border-border bg-background/60 px-3 py-2 text-sm font-semibold hover:bg-background"
          >
            {enabled ? (
              <ToggleRight className="h-5 w-5 text-primary" />
            ) : (
              <ToggleLeft className="h-5 w-5" />
            )}
            {enabled ? "On" : "Off"}
          </button>
        </div>

        {enabled && (
          <>
            {/* Day selector */}
            <div>
              <label className="text-xs font-semibold text-muted-foreground">Day of Week</label>
              <select
                value={day}
                onChange={(e) => setDay(e.target.value)}
                className="mt-1 w-full px-3 py-2 rounded-lg bg-input border border-border text-sm"
              >
                {DAYS.map((d) => (
                  <option key={d.code} value={d.code}>
                    {d.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Time selector */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-muted-foreground">Hour (UTC)</label>
                <input
                  type="number"
                  min="0"
                  max="23"
                  value={hour}
                  onChange={(e) => setHour(Math.min(23, Math.max(0, parseInt(e.target.value) || 0)))}
                  className="mt-1 w-full px-3 py-2 rounded-lg bg-input border border-border text-sm"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground">Minute</label>
                <input
                  type="number"
                  min="0"
                  max="59"
                  value={minute}
                  onChange={(e) => setMinute(Math.min(59, Math.max(0, parseInt(e.target.value) || 0)))}
                  className="mt-1 w-full px-3 py-2 rounded-lg bg-input border border-border text-sm"
                />
              </div>
            </div>

            {/* Language and limit */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-muted-foreground">Language (optional)</label>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="mt-1 w-full px-3 py-2 rounded-lg bg-input border border-border text-sm"
                >
                  <option value="">All Languages</option>
                  {LANGUAGES.map((lang) => (
                    <option key={lang} value={lang}>
                      {lang}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground">Limit</label>
                <input
                  type="number"
                  min="1"
                  max="500"
                  value={limit}
                  onChange={(e) => setLimit(Math.min(500, Math.max(1, parseInt(e.target.value) || 1)))}
                  className="mt-1 w-full px-3 py-2 rounded-lg bg-input border border-border text-sm"
                />
              </div>
            </div>
          </>
        )}
      </div>

      <button
        onClick={handleSave}
        disabled={saving}
        className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-brand-gradient text-background font-semibold text-sm disabled:opacity-60"
      >
        <Save className="h-4 w-4" />
        {saving ? "Saving..." : "Save Schedule"}
      </button>

      {data?.schedule?.nextRunAt && (
        <div className="mt-3 p-3 rounded-lg bg-primary/10 border border-primary/30 text-xs text-primary">
          Next run: {new Date(data.schedule.nextRunAt).toLocaleString()}
        </div>
      )}
    </div>
  );
}

export function DiscoveryScheduler() {
  const getSchedule = useServerFn(getDiscoverySchedule);
  const saveSchedule = useServerFn(setDiscoverySchedule);
  const qc = useQueryClient();

  const { data } = useQuery({
    queryKey: ["discovery-schedule"],
    queryFn: () => getSchedule(),
  });

  const [enabled, setEnabled] = useState(false);
  const [hour, setHour] = useState(6);
  const [minute, setMinute] = useState(0);
  const [language, setLanguage] = useState("tamil");
  const [queriesPerRun, setQueriesPerRun] = useState(3);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (data?.schedule) {
      setEnabled(data.schedule.enabled ?? false);
      setHour(data.schedule.hour ?? 6);
      setMinute(data.schedule.minute ?? 0);
      setLanguage(data.schedule.language ?? "tamil");
      setQueriesPerRun(data.schedule.queriesPerRun ?? 3);
    }
  }, [data?.schedule]);

  async function handleSave() {
    setSaving(true);
    try {
      await saveSchedule({
        data: { enabled, hour, minute, language, queriesPerRun },
      });
      toast.success("Discovery schedule saved");
      qc.invalidateQueries({ queryKey: ["discovery-schedule"] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to save schedule");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mt-8 p-5 rounded-xl border border-border bg-card/40">
      <div className="flex items-center gap-2 text-sm font-semibold mb-3">
        <Zap className="h-4 w-4 text-primary" /> Daily AI Content Discovery
      </div>
      <p className="text-xs text-muted-foreground mb-4">
        Automatically discover new content using AI-powered search daily.
      </p>

      <div className="grid gap-4">
        {/* Enable toggle */}
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium">Enable daily discovery</label>
          <button
            onClick={() => setEnabled(!enabled)}
            className="inline-flex shrink-0 items-center gap-2 rounded-lg border border-border bg-background/60 px-3 py-2 text-sm font-semibold hover:bg-background"
          >
            {enabled ? (
              <ToggleRight className="h-5 w-5 text-primary" />
            ) : (
              <ToggleLeft className="h-5 w-5" />
            )}
            {enabled ? "On" : "Off"}
          </button>
        </div>

        {enabled && (
          <>
            {/* Time selector */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-muted-foreground">Hour (UTC)</label>
                <input
                  type="number"
                  min="0"
                  max="23"
                  value={hour}
                  onChange={(e) => setHour(Math.min(23, Math.max(0, parseInt(e.target.value) || 0)))}
                  className="mt-1 w-full px-3 py-2 rounded-lg bg-input border border-border text-sm"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground">Minute</label>
                <input
                  type="number"
                  min="0"
                  max="59"
                  value={minute}
                  onChange={(e) => setMinute(Math.min(59, Math.max(0, parseInt(e.target.value) || 0)))}
                  className="mt-1 w-full px-3 py-2 rounded-lg bg-input border border-border text-sm"
                />
              </div>
            </div>

            {/* Language and queries */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-muted-foreground">Language</label>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="mt-1 w-full px-3 py-2 rounded-lg bg-input border border-border text-sm"
                >
                  {LANGUAGES.map((lang) => (
                    <option key={lang} value={lang}>
                      {lang}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground">Queries per run</label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={queriesPerRun}
                  onChange={(e) => setQueriesPerRun(Math.min(10, Math.max(1, parseInt(e.target.value) || 1)))}
                  className="mt-1 w-full px-3 py-2 rounded-lg bg-input border border-border text-sm"
                />
              </div>
            </div>
          </>
        )}
      </div>

      <button
        onClick={handleSave}
        disabled={saving}
        className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-brand-gradient text-background font-semibold text-sm disabled:opacity-60"
      >
        <Save className="h-4 w-4" />
        {saving ? "Saving..." : "Save Schedule"}
      </button>

      {data?.schedule?.nextRunAt && (
        <div className="mt-3 p-3 rounded-lg bg-primary/10 border border-primary/30 text-xs text-primary">
          Next run: {new Date(data.schedule.nextRunAt).toLocaleString()}
        </div>
      )}
    </div>
  );
}
