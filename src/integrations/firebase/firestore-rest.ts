import { FIREBASE_PROJECT_ID, firebaseConfig } from "./config";

type FirestoreValue =
  | { stringValue: string }
  | { timestampValue: string }
  | { booleanValue: boolean }
  | { nullValue: null };

type FirestoreDocument = {
  name: string;
  fields?: Record<string, FirestoreValue>;
  createTime?: string;
  updateTime?: string;
};

const baseUrl = `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents`;

function encodePath(path: string) {
  return path
    .split("/")
    .map((part) => encodeURIComponent(part))
    .join("/");
}

function docId(name: string) {
  return name.split("/").pop() ?? "";
}

function toFirestoreFields(data: Record<string, string | boolean | null | undefined>) {
  const fields: Record<string, FirestoreValue> = {};
  for (const [key, value] of Object.entries(data)) {
    if (value === undefined) continue;
    if (value === null) fields[key] = { nullValue: null };
    else if (typeof value === "boolean") fields[key] = { booleanValue: value };
    else if (key.endsWith("At")) fields[key] = { timestampValue: value };
    else fields[key] = { stringValue: value };
  }
  return fields;
}

function fromFirestoreFields(fields: FirestoreDocument["fields"] = {}) {
  const out: Record<string, string | boolean | null> = {};
  for (const [key, value] of Object.entries(fields)) {
    if ("stringValue" in value) out[key] = value.stringValue;
    else if ("timestampValue" in value) out[key] = value.timestampValue;
    else if ("booleanValue" in value) out[key] = value.booleanValue;
    else out[key] = null;
  }
  return out;
}

async function firestoreFetch(path: string, init: RequestInit & { token?: string } = {}) {
  const headers = new Headers(init.headers);
  headers.set("Content-Type", "application/json");
  if (init.token) headers.set("Authorization", `Bearer ${init.token}`);
  const joiner = path.includes("?") ? "&" : "?";
  const res = await fetch(`${baseUrl}/${path}${joiner}key=${firebaseConfig.apiKey}`, {
    ...init,
    headers,
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    if (
      body.includes('"reason": "SERVICE_DISABLED"') ||
      body.includes("firestore.googleapis.com")
    ) {
      throw new Error(
        "Firestore is not enabled for this Firebase project. Enable Cloud Firestore API and create a Firestore database in Firebase Console, then retry after a few minutes.",
      );
    }
    if (body.includes("Missing or insufficient permissions")) {
      throw new Error(
        "Firestore permissions denied. Publish the Firestore security rules from firebase.firestore.rules in Firebase Console, then retry.",
      );
    }
    throw new Error(`Firestore request failed (${res.status}): ${body || res.statusText}`);
  }
  if (res.status === 204) return null;
  return res.json();
}

export async function getFirestoreDoc<T extends Record<string, string | boolean | null>>(
  path: string,
  token?: string,
) {
  try {
    const json = (await firestoreFetch(encodePath(path), { token })) as FirestoreDocument;
    return { id: docId(json.name), ...(fromFirestoreFields(json.fields) as T) };
  } catch (error) {
    if (error instanceof Error && error.message.includes("(404)")) return null;
    throw error;
  }
}

export async function listFirestoreDocs<T extends Record<string, string | boolean | null>>(
  collection: string,
  token?: string,
) {
  const json = (await firestoreFetch(`${encodePath(collection)}?pageSize=100`, {
    token,
  })) as { documents?: FirestoreDocument[] };
  return (json.documents ?? []).map((doc) => ({
    id: docId(doc.name),
    ...(fromFirestoreFields(doc.fields) as T),
  }));
}

export async function setFirestoreDoc(
  path: string,
  data: Record<string, string | boolean | null | undefined>,
  token?: string,
) {
  const json = (await firestoreFetch(encodePath(path), {
    method: "PATCH",
    token,
    body: JSON.stringify({ fields: toFirestoreFields(data) }),
  })) as FirestoreDocument;
  return { id: docId(json.name), ...fromFirestoreFields(json.fields) };
}

export async function deleteFirestoreDoc(path: string, token?: string) {
  await firestoreFetch(encodePath(path), { method: "DELETE", token });
}
