import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { attachFirebaseAuth } from "@/integrations/firebase/auth-attacher";
import { requireFirebaseAuth } from "@/integrations/firebase/auth-middleware";
import {
  getFirestoreDoc,
  setFirestoreDoc,
  listFirestoreDocs,
} from "@/integrations/firebase/firestore-rest";
import { adminStartBulkDownload } from "./youtube.functions";

type FirebaseServerContext = {
  firebaseToken?: string;
  userId: string;
  isAdmin?: boolean;
};

async function assertAdmin(ctx: FirebaseServerContext) {
  if (!ctx.isAdmin) throw new Error("Admin only");
}

type DownloadSchedule = {
  enabled: boolean;
  day: string; // "monday", "tuesday", etc.
  hour: number; // 0-23
  minute: number; // 0-59
  language?: string;
  limit: number;
  lastRunAt?: string;
  nextRunAt?: string;
  errorCount?: number;
  lastError?: string;
};

type DiscoverySchedule = {
  enabled: boolean;
  hour: number;
  minute: number;
  language?: string;
  queriesPerRun: number;
  lastRunAt?: string;
  nextRunAt?: string;
  errorCount?: number;
  lastError?: string;
};

type DailyPicksSchedule = {
  enabled: boolean;
  hour: number;
  minute: number;
  languages: string[];
  picksCount: number;
  lastRunAt?: string;
  nextRunAt?: string;
  errorCount?: number;
  lastError?: string;
};

type SyncHistory = {
  timestamp: string;
  type: 'download' | 'discovery' | 'daily_picks';
  status: 'success' | 'error';
  message: string;
  itemCount?: number;
  error?: string;
};

function nowIso() {
  return new Date().toISOString();
}

export const getDownloadSchedule = createServerFn({ method: "GET" })
  .middleware([requireFirebaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const rawSchedule = await getFirestoreDoc<Record<string, string | boolean | null>>(
      "sonexa_schedules/youtube_download",
      context.firebaseToken,
    );
    
    if (!rawSchedule) {
      return { schedule: null };
    }

    const schedule: DownloadSchedule = {
      enabled: rawSchedule.enabled === true,
      day: typeof rawSchedule.day === 'string' ? rawSchedule.day : "monday",
      hour: parseInt(String(rawSchedule.hour || "0")),
      minute: parseInt(String(rawSchedule.minute || "0")),
      language: typeof rawSchedule.language === 'string' ? rawSchedule.language : undefined,
      limit: parseInt(String(rawSchedule.limit || "50")),
      lastRunAt: typeof rawSchedule.lastRunAt === 'string' ? rawSchedule.lastRunAt : undefined,
      nextRunAt: typeof rawSchedule.nextRunAt === 'string' ? rawSchedule.nextRunAt : undefined,
    };
    
    return { schedule };
  });

export const setDownloadSchedule = createServerFn({ method: "POST" })
  .middleware([requireFirebaseAuth])
  .validator(
    z.object({
      enabled: z.boolean(),
      day: z.string().min(1),
      hour: z.number().int().min(0).max(23),
      minute: z.number().int().min(0).max(59),
      language: z.string().optional(),
      limit: z.number().int().min(1).max(500).default(50),
    }),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    
    // Convert to string-based format for Firestore
    const firestoreData: Record<string, string | boolean | null> = {
      enabled: data.enabled,
      day: data.day,
      hour: String(data.hour),
      minute: String(data.minute),
      language: data.language || null,
      limit: String(data.limit),
      lastRunAt: null,
      nextRunAt: null,
    };
    
    await setFirestoreDoc(
      "sonexa_schedules/youtube_download",
      firestoreData,
      context.firebaseToken,
    );
    
    const schedule: DownloadSchedule = {
      enabled: data.enabled,
      day: data.day,
      hour: data.hour,
      minute: data.minute,
      language: data.language,
      limit: data.limit,
      lastRunAt: undefined,
      nextRunAt: undefined,
    };
    
    return { schedule };
  });

export const getDiscoverySchedule = createServerFn({ method: "GET" })
  .middleware([requireFirebaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const rawSchedule = await getFirestoreDoc<Record<string, string | boolean | null>>(
      "sonexa_schedules/ai_discovery",
      context.firebaseToken,
    );
    
    if (!rawSchedule) {
      return { schedule: null };
    }

    const schedule: DiscoverySchedule = {
      enabled: rawSchedule.enabled === true,
      hour: parseInt(String(rawSchedule.hour || "0")),
      minute: parseInt(String(rawSchedule.minute || "0")),
      language: typeof rawSchedule.language === 'string' ? rawSchedule.language : undefined,
      queriesPerRun: parseInt(String(rawSchedule.queriesPerRun || "3")),
      lastRunAt: typeof rawSchedule.lastRunAt === 'string' ? rawSchedule.lastRunAt : undefined,
      nextRunAt: typeof rawSchedule.nextRunAt === 'string' ? rawSchedule.nextRunAt : undefined,
    };
    
    return { schedule };
  });

export const setDiscoverySchedule = createServerFn({ method: "POST" })
  .middleware([requireFirebaseAuth])
  .validator(
    z.object({
      enabled: z.boolean(),
      hour: z.number().int().min(0).max(23),
      minute: z.number().int().min(0).max(59),
      language: z.string().optional(),
      queriesPerRun: z.number().int().min(1).max(10).default(3),
    }),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    
    // Convert to string-based format for Firestore
    const firestoreData: Record<string, string | boolean | null> = {
      enabled: data.enabled,
      hour: String(data.hour),
      minute: String(data.minute),
      language: data.language || null,
      queriesPerRun: String(data.queriesPerRun),
      lastRunAt: null,
      nextRunAt: null,
    };
    
    await setFirestoreDoc(
      "sonexa_schedules/ai_discovery",
      firestoreData,
      context.firebaseToken,
    );
    
    const schedule: DiscoverySchedule = {
      enabled: data.enabled,
      hour: data.hour,
      minute: data.minute,
      language: data.language,
      queriesPerRun: data.queriesPerRun,
      lastRunAt: undefined,
      nextRunAt: undefined,
    };
    
    return { schedule };
  });

// Server function to execute scheduled downloads (called by cron job)
export const executeScheduledDownload = createServerFn({ method: "POST" })
  .handler(async () => {
    const rawSchedule = await getFirestoreDoc<Record<string, string | boolean | null>>(
      "sonexa_schedules/youtube_download",
    );
    
    if (!rawSchedule || rawSchedule.enabled !== true) {
      return { executed: false, message: "Download schedule not enabled" };
    }

    const hour = parseInt(String(rawSchedule.hour || "0"));
    const minute = parseInt(String(rawSchedule.minute || "0"));
    const day = typeof rawSchedule.day === 'string' ? rawSchedule.day : "monday";
    const language = typeof rawSchedule.language === 'string' ? rawSchedule.language : undefined;
    const limit = parseInt(String(rawSchedule.limit || "50"));
    const errorCount = parseInt(String(rawSchedule.errorCount || "0"));

    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const currentDay = now.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();

    // Check if current time matches scheduled time (within 1 minute window)
    const isScheduledTime = currentDay === day && currentHour === hour && Math.abs(currentMinute - minute) <= 1;

    if (!isScheduledTime) {
      return { executed: false, message: "Not scheduled time" };
    }

    try {
      const result = await adminStartBulkDownload({
        data: { language, limit },
      });

      // Update last run time and reset error count
      const firestoreData: Record<string, string | boolean | null> = {
        ...rawSchedule,
        lastRunAt: new Date().toISOString(),
        errorCount: "0",
        lastError: null,
      };
      
      await setFirestoreDoc(
        "sonexa_schedules/youtube_download",
        firestoreData,
      );

      // Log to sync history
      await logSyncHistory({
        type: 'download',
        status: 'success',
        message: result.message,
        itemCount: limit,
      });

      return { executed: true, message: result.message, job: result.job };
    } catch (error) {
      console.error("Scheduled download failed:", error);
      
      // Update error count and last error
      const firestoreData: Record<string, string | boolean | null> = {
        ...rawSchedule,
        errorCount: String(errorCount + 1),
        lastError: error instanceof Error ? error.message : "Unknown error",
      };
      
      await setFirestoreDoc(
        "sonexa_schedules/youtube_download",
        firestoreData,
      );

      // Log to sync history
      await logSyncHistory({
        type: 'download',
        status: 'error',
        message: 'Scheduled download failed',
        error: error instanceof Error ? error.message : "Unknown error",
      });

      return { executed: false, error: error instanceof Error ? error.message : "Unknown error" };
    }
  });

// Server function to execute scheduled discovery (called by cron job)
export const executeScheduledDiscovery = createServerFn({ method: "POST" })
  .handler(async () => {
    const rawSchedule = await getFirestoreDoc<Record<string, string | boolean | null>>(
      "sonexa_schedules/ai_discovery",
    );
    
    if (!rawSchedule || rawSchedule.enabled !== true) {
      return { executed: false, message: "Discovery schedule not enabled" };
    }

    const hour = parseInt(String(rawSchedule.hour || "0"));
    const minute = parseInt(String(rawSchedule.minute || "0"));
    const language = typeof rawSchedule.language === 'string' ? rawSchedule.language : undefined;
    const queriesPerRun = parseInt(String(rawSchedule.queriesPerRun || "3"));
    const errorCount = parseInt(String(rawSchedule.errorCount || "0"));

    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();

    // Check if current time matches scheduled time (within 1 minute window)
    const isScheduledTime = currentHour === hour && Math.abs(currentMinute - minute) <= 1;

    if (!isScheduledTime) {
      return { executed: false, message: "Not scheduled time" };
    }

    try {
      // Import and call the auto-discovery function
      const { adminAutoDiscoverTamilContent } = await import("./youtube.functions");
      const result = await adminAutoDiscoverTamilContent({
        data: { autoApprove: true, queriesPerRun },
      });

      // Update last run time and reset error count
      const firestoreData: Record<string, string | boolean | null> = {
        ...rawSchedule,
        lastRunAt: new Date().toISOString(),
        errorCount: "0",
        lastError: null,
      };
      
      await setFirestoreDoc(
        "sonexa_schedules/ai_discovery",
        firestoreData,
      );

      // Log to sync history
      await logSyncHistory({
        type: 'discovery',
        status: 'success',
        message: result.message,
      });

      return { executed: true, message: result.message };
    } catch (error) {
      console.error("Scheduled discovery failed:", error);
      
      // Update error count and last error
      const firestoreData: Record<string, string | boolean | null> = {
        ...rawSchedule,
        errorCount: String(errorCount + 1),
        lastError: error instanceof Error ? error.message : "Unknown error",
      };
      
      await setFirestoreDoc(
        "sonexa_schedules/ai_discovery",
        firestoreData,
      );

      // Log to sync history
      await logSyncHistory({
        type: 'discovery',
        status: 'error',
        message: 'Scheduled discovery failed',
        error: error instanceof Error ? error.message : "Unknown error",
      });

      return { executed: false, error: error instanceof Error ? error.message : "Unknown error" };
    }
  });

// Server function to get sync history
export const getSyncHistory = createServerFn({ method: "GET" })
  .middleware([requireFirebaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    
    const history = await listFirestoreDocs<SyncHistory>("sonexa_sync_history");
    // Sort by timestamp descending and limit to last 50 entries
    const sortedHistory = history
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 50);
    
    return { history: sortedHistory };
  });

// Helper function to log sync history
async function logSyncHistory(entry: Omit<SyncHistory, 'timestamp'>) {
  const historyEntry: SyncHistory = {
    ...entry,
    timestamp: new Date().toISOString(),
  };
  
  const docId = `sync_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  await setFirestoreDoc(
    `sonexa_sync_history/${docId}`,
    historyEntry,
  );
}

// Server function to get all schedules status
export const getAllSchedulesStatus = createServerFn({ method: "GET" })
  .middleware([requireFirebaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    
    const [downloadSchedule, discoverySchedule] = await Promise.all([
      getFirestoreDoc<Record<string, string | boolean | null>>(
        "sonexa_schedules/youtube_download",
        context.firebaseToken,
      ),
      getFirestoreDoc<Record<string, string | boolean | null>>(
        "sonexa_schedules/ai_discovery",
        context.firebaseToken,
      ),
    ]);
    
    return {
      download: downloadSchedule ? {
        enabled: downloadSchedule.enabled === true,
        lastRunAt: typeof downloadSchedule.lastRunAt === 'string' ? downloadSchedule.lastRunAt : undefined,
        errorCount: parseInt(String(downloadSchedule.errorCount || "0")),
        lastError: typeof downloadSchedule.lastError === 'string' ? downloadSchedule.lastError : undefined,
      } : null,
      discovery: discoverySchedule ? {
        enabled: discoverySchedule.enabled === true,
        lastRunAt: typeof discoverySchedule.lastRunAt === 'string' ? discoverySchedule.lastRunAt : undefined,
        errorCount: parseInt(String(discoverySchedule.errorCount || "0")),
        lastError: typeof discoverySchedule.lastError === 'string' ? discoverySchedule.lastError : undefined,
      } : null,
    };
  });

// Server function to get daily picks
export const getDailyPicks = createServerFn({ method: "GET" })
  .handler(async () => {
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const dailyPicks = await getFirestoreDoc<Record<string, any>>(
      `sonexa_daily_picks/${today}`,
    );
    
    if (!dailyPicks || !dailyPicks.tracks) {
      return { picks: [] };
    }
    
    return { picks: dailyPicks.tracks || [] };
  });

// Server function to set daily picks (admin only)
export const setDailyPicks = createServerFn({ method: "POST" })
  .middleware([requireFirebaseAuth])
  .validator(
    z.object({
      tracks: z.array(z.object({
        video_id: z.string(),
        title: z.string(),
        channel: z.string(),
        thumbnail: z.string(),
        language: z.string().optional(),
      })),
    }),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const firestoreData: Record<string, any> = {
      date: today,
      tracks: data.tracks,
      createdAt: new Date().toISOString(),
    };
    
    await setFirestoreDoc(
      `sonexa_daily_picks/${today}`,
      firestoreData,
      context.firebaseToken,
    );
    
    return { success: true, date: today };
  });
