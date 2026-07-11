import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireFirebaseAuth } from "@/integrations/firebase/auth-middleware";
import {
  getFirestoreDoc,
  listFirestoreDocs,
  setFirestoreDoc,
} from "@/integrations/firebase/firestore-rest";

type FirebaseServerContext = {
  firebaseToken?: string;
  userId: string;
  isAdmin?: boolean;
};

export type ApiKeyRow = {
  id: string;
  name: string;
  key_hash: string;
  key_prefix: string;
  active: boolean;
  created_by: string;
  created_at: string;
  revoked_at?: string | null;
};

async function assertAdmin(ctx: FirebaseServerContext) {
  if (!ctx.isAdmin) throw new Error("Admin only");
}

function nowIso() {
  return new Date().toISOString();
}

function bytesToHex(bytes: Uint8Array) {
  return Array.from(bytes)
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

async function sha256(input: string) {
  const bytes = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return bytesToHex(new Uint8Array(digest));
}

function createPlainKey() {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return `sx_${bytesToHex(bytes)}`;
}

export async function hashSonexaApiKey(key: string) {
  return sha256(key.trim());
}

export const adminListApiKeys = createServerFn({ method: "GET" })
  .middleware([requireFirebaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const keys = await listFirestoreDocs<Omit<ApiKeyRow, "id">>(
      "sonexa_api_keys",
      context.firebaseToken,
    ).catch(() => []);
    return {
      keys: keys
        .sort((a, b) => String(b.created_at).localeCompare(String(a.created_at)))
        .map((key) => ({
          id: key.id,
          name: String(key.name ?? "API key"),
          keyPrefix: String(key.key_prefix ?? "sx_"),
          active: key.active === true,
          createdAt: String(key.created_at ?? ""),
          revokedAt: key.revoked_at ? String(key.revoked_at) : null,
        })),
    };
  });

export const adminCreateApiKey = createServerFn({ method: "POST" })
  .middleware([requireFirebaseAuth])
  .inputValidator(z.object({ name: z.string().min(1).max(80) }))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const key = createPlainKey();
    const id = crypto.randomUUID();
    const createdAt = nowIso();
    await setFirestoreDoc(
      `sonexa_api_keys/${id}`,
      {
        name: data.name,
        key_hash: await hashSonexaApiKey(key),
        key_prefix: key.slice(0, 10),
        active: true,
        created_by: context.userId,
        created_at: createdAt,
        revoked_at: null,
      },
      context.firebaseToken,
    );
    return { id, key, keyPrefix: key.slice(0, 10), createdAt };
  });

export const adminRevokeApiKey = createServerFn({ method: "POST" })
  .middleware([requireFirebaseAuth])
  .inputValidator(z.object({ id: z.string().min(8).max(120) }))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const existing = await getFirestoreDoc<Omit<ApiKeyRow, "id">>(
      `sonexa_api_keys/${data.id}`,
      context.firebaseToken,
    );
    if (!existing) throw new Error("API key not found");
    await setFirestoreDoc(
      `sonexa_api_keys/${data.id}`,
      {
        ...existing,
        active: false,
        revoked_at: nowIso(),
      },
      context.firebaseToken,
    );
    return { ok: true };
  });
