import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { attachFirebaseAuth } from "@/integrations/firebase/auth-attacher";
import { requireFirebaseAuth } from "@/integrations/firebase/auth-middleware";
import {
  getFirestoreDoc,
  setFirestoreDoc,
} from "@/integrations/firebase/firestore-rest";

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
    const schedule = await getFirestoreDoc<DownloadSchedule>(
      "sonexa_schedules/youtube_download",
      context.firebaseToken,
    );
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
    await setFirestoreDoc(
      "sonexa_schedules/youtube_download",
      schedule,
      context.firebaseToken,
    );
    return { schedule };
  });

export const getDiscoverySchedule = createServerFn({ method: "GET" })
  .middleware([requireFirebaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const schedule = await getFirestoreDoc<DiscoverySchedule>(
      "sonexa_schedules/ai_discovery",
      context.firebaseToken,
    );
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
    const schedule: DiscoverySchedule = {
      enabled: data.enabled,
      hour: data.hour,
      minute: data.minute,
      language: data.language,
      queriesPerRun: data.queriesPerRun,
      lastRunAt: undefined,
      nextRunAt: undefined,
    };
    await setFirestoreDoc(
      "sonexa_schedules/ai_discovery",
      schedule,
      context.firebaseToken,
    );
    return { schedule };
  });
