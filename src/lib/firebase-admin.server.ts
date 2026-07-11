import { cert, getApps, initializeApp, type ServiceAccount } from "firebase-admin/app";
import { getFirestore, type Firestore } from "firebase-admin/firestore";

let adminDb: Firestore | null = null;

function readServiceAccount(): ServiceAccount {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON?.trim();
  if (!raw) {
    throw new Error(
      "Missing FIREBASE_SERVICE_ACCOUNT_JSON. Add a Firebase service account JSON secret so daily sync can write tracks and playlists.",
    );
  }

  const parsed = JSON.parse(raw) as {
    project_id?: string;
    client_email?: string;
    private_key?: string;
    type?: string;
  };

  if (!parsed.client_email || !parsed.private_key) {
    throw new Error(
      "FIREBASE_SERVICE_ACCOUNT_JSON must include client_email and private_key.",
    );
  }

  return {
    projectId: parsed.project_id ?? process.env.FIREBASE_PROJECT_ID,
    clientEmail: parsed.client_email,
    privateKey: parsed.private_key.replace(/\\n/g, "\n"),
  };
}

export function getAdminDb() {
  if (!adminDb) {
    if (!getApps().length) {
      initializeApp({
        credential: cert(readServiceAccount()),
      });
    }
    adminDb = getFirestore();
  }

  return adminDb;
}
