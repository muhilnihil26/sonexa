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
};

type DiscoverySchedule = {
  enabled: boolean;
  hour: number;
  minute: number;
  language?: string;
  queriesPerRun: number;
  lastRunAt?: string;
  nextRunAt?: string;
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
  .inputValidator(
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
  .inputValidator(
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

      // Update last run time
      const firestoreData: Record<string, string | boolean | null> = {
        ...rawSchedule,
        lastRunAt: new Date().toISOString(),
      };
      
      await setFirestoreDoc(
        "sonexa_schedules/youtube_download",
        firestoreData,
      );

      return { executed: true, message: result.message, job: result.job };
    } catch (error) {
      console.error("Scheduled download failed:", error);
      return { executed: false, error: error instanceof Error ? error.message : "Unknown error" };
    }
  });
