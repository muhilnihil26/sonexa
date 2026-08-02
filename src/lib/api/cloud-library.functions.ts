import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { attachFirebaseAuth } from "@/integrations/firebase/auth-attacher";
import { requireFirebaseAuth } from "@/integrations/firebase/auth-middleware";
import {
  getFirestoreDoc,
  setFirestoreDoc,
  listFirestoreDocs,
  deleteFirestoreDoc,
} from "@/integrations/firebase/firestore-rest";
import { supabase } from "@/integrations/supabase/client";

type FirebaseServerContext = {
  firebaseToken?: string;
  userId: string;
  isAdmin?: boolean;
};

type CloudTrack = {
  id: string;
  userId: string;
  title: string;
  artist: string;
  album?: string;
  duration?: number;
  audioPath: string;
  coverPath?: string;
  uploadedAt: string;
  fileSize: number;
  mimeType: string;
};

type UserCloudLibrary = {
  userId: string;
  tracks: CloudTrack[];
  totalSize: number;
  storageUsed: number;
  storageLimit: number;
  createdAt: string;
  updatedAt: string;
};

const STORAGE_LIMIT_MB = 500; // 500MB per user
const STORAGE_LIMIT_BYTES = STORAGE_LIMIT_MB * 1024 * 1024;

// Get user's cloud library
export const getUserCloudLibrary = createServerFn({ method: "GET" })
  .middleware([requireFirebaseAuth])
  .handler(async ({ context }) => {
    const library = await getFirestoreDoc<Record<string, string | number | boolean | null>>(
      `sonexa_cloud_library/${context.userId}`,
      context.firebaseToken,
    );
    
    if (!library) {
      return { library: null, storageUsed: 0, storageLimit: STORAGE_LIMIT_MB };
    }
    
    // Deserialize tracks from JSON string
    const parsedLibrary: UserCloudLibrary = {
      userId: typeof library.userId === 'string' ? library.userId : context.userId,
      tracks: typeof library.tracks === 'string' ? JSON.parse(library.tracks) : [],
      totalSize: typeof library.totalSize === 'number' ? library.totalSize : 0,
      storageUsed: typeof library.storageUsed === 'number' ? library.storageUsed : 0,
      storageLimit: typeof library.storageLimit === 'number' ? library.storageLimit : STORAGE_LIMIT_BYTES,
      createdAt: typeof library.createdAt === 'string' ? library.createdAt : new Date().toISOString(),
      updatedAt: typeof library.updatedAt === 'string' ? library.updatedAt : new Date().toISOString(),
    };
    
    return {
      library: parsedLibrary,
      storageUsed: Math.round(parsedLibrary.storageUsed / 1024 / 1024), // Convert to MB
      storageLimit: STORAGE_LIMIT_MB,
    };
  });

// Create upload URLs for cloud tracks
export const createCloudUploadUrls = createServerFn({ method: "POST" })
  .middleware([requireFirebaseAuth])
  .validator(
    z.object({
      audioName: z.string(),
      audioSize: z.number(),
      audioMimeType: z.string(),
      coverName: z.string().optional(),
    }),
  )
  .handler(async ({ data, context }) => {
    // Check storage limit
    const existingLibrary = await getFirestoreDoc<Record<string, string | number | boolean | null>>(
      `sonexa_cloud_library/${context.userId}`,
      context.firebaseToken,
    );
    
    const currentStorage = typeof existingLibrary?.storageUsed === 'number' ? existingLibrary.storageUsed : 0;
    const newStorage = currentStorage + data.audioSize;
    
    if (newStorage > STORAGE_LIMIT_BYTES) {
      throw new Error(`Storage limit exceeded. You have ${Math.round(currentStorage / 1024 / 1024)}MB used out of ${STORAGE_LIMIT_MB}MB limit.`);
    }
    
    const audioPath = `${context.userId}/${Date.now()}_${data.audioName}`;
    const coverPath = data.coverName ? `${context.userId}/covers/${Date.now()}_${data.coverName}` : null;
    
    const { data: audioUrl, error: audioError } = await supabase.storage
      .from("cloud-audio")
      .createSignedUploadUrl(audioPath);
    
    if (audioError) throw audioError;
    
    let coverUrl = null;
    if (coverPath) {
      const { data: coverData, error: coverError } = await supabase.storage
        .from("cloud-covers")
        .createSignedUploadUrl(coverPath);
      
      if (coverError) throw coverError;
      coverUrl = coverData;
    }
    
    return {
      audio: { path: audioPath, signedUrl: audioUrl.signedUrl, token: audioUrl.token },
      cover: coverPath && coverUrl ? { path: coverPath, signedUrl: coverUrl.signedUrl, token: coverUrl.token } : null,
    };
  });

// Add track to cloud library
export const addCloudTrack = createServerFn({ method: "POST" })
  .middleware([requireFirebaseAuth])
  .validator(
    z.object({
      title: z.string(),
      artist: z.string(),
      album: z.string().optional(),
      duration: z.number().optional(),
      audioPath: z.string(),
      coverPath: z.string().optional(),
      fileSize: z.number(),
      mimeType: z.string(),
    }),
  )
  .handler(async ({ data, context }) => {
    const existingLibrary = await getFirestoreDoc<Record<string, string | number | boolean | null>>(
      `sonexa_cloud_library/${context.userId}`,
      context.firebaseToken,
    );
    
    const trackId = `cloud_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const newTrack: CloudTrack = {
      id: trackId,
      userId: context.userId,
      title: data.title,
      artist: data.artist,
      album: data.album,
      duration: data.duration,
      audioPath: data.audioPath,
      coverPath: data.coverPath,
      uploadedAt: new Date().toISOString(),
      fileSize: data.fileSize,
      mimeType: data.mimeType,
    };
    
    // Parse existing tracks or start with empty array
    const existingTracks: CloudTrack[] = (existingLibrary && typeof existingLibrary.tracks === 'string') 
      ? JSON.parse(existingLibrary.tracks) 
      : [];
    
    const library: Record<string, string | number | boolean | null> = {
      userId: context.userId,
      tracks: JSON.stringify([...existingTracks, newTrack]),
      totalSize: (typeof existingLibrary?.totalSize === 'number' ? existingLibrary.totalSize : 0) + data.fileSize,
      storageUsed: (typeof existingLibrary?.storageUsed === 'number' ? existingLibrary.storageUsed : 0) + data.fileSize,
      storageLimit: STORAGE_LIMIT_BYTES,
      createdAt: existingLibrary?.createdAt as string || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    await setFirestoreDoc(
      `sonexa_cloud_library/${context.userId}`,
      library,
      context.firebaseToken,
    );
    
    return { success: true, track: newTrack };
  });

// Delete track from cloud library
export const deleteCloudTrack = createServerFn({ method: "POST" })
  .middleware([requireFirebaseAuth])
  .validator(
    z.object({
      trackId: z.string(),
    }),
  )
  .handler(async ({ data, context }) => {
    const existingLibrary = await getFirestoreDoc<Record<string, string | number | boolean | null>>(
      `sonexa_cloud_library/${context.userId}`,
      context.firebaseToken,
    );
    
    if (!existingLibrary) {
      throw new Error("Library not found");
    }
    
    const tracks: CloudTrack[] = typeof existingLibrary.tracks === 'string' 
      ? JSON.parse(existingLibrary.tracks) 
      : [];
    
    const trackIndex = tracks.findIndex((t) => t.id === data.trackId);
    if (trackIndex === -1) {
      throw new Error("Track not found");
    }
    
    const track = tracks[trackIndex];
    
    // Delete files from Supabase
    await supabase.storage.from("cloud-audio").remove([track.audioPath]);
    if (track.coverPath) {
      await supabase.storage.from("cloud-covers").remove([track.coverPath]);
    }
    
    // Update library
    tracks.splice(trackIndex, 1);
    const library: Record<string, string | number | boolean | null> = {
      userId: context.userId,
      tracks: JSON.stringify(tracks),
      totalSize: (typeof existingLibrary.totalSize === 'number' ? existingLibrary.totalSize : 0) - track.fileSize,
      storageUsed: (typeof existingLibrary.storageUsed === 'number' ? existingLibrary.storageUsed : 0) - track.fileSize,
      storageLimit: STORAGE_LIMIT_BYTES,
      createdAt: existingLibrary.createdAt as string,
      updatedAt: new Date().toISOString(),
    };
    
    await setFirestoreDoc(
      `sonexa_cloud_library/${context.userId}`,
      library,
      context.firebaseToken,
    );
    
    return { success: true };
  });

// Get signed URL for playing cloud track
export const getCloudTrackUrl = createServerFn({ method: "POST" })
  .middleware([requireFirebaseAuth])
  .validator(
    z.object({
      trackId: z.string(),
    }),
  )
  .handler(async ({ data, context }) => {
    const library = await getFirestoreDoc<Record<string, string | number | boolean | null>>(
      `sonexa_cloud_library/${context.userId}`,
      context.firebaseToken,
    );
    
    if (!library) {
      throw new Error("Library not found");
    }
    
    const tracks: CloudTrack[] = typeof library.tracks === 'string' 
      ? JSON.parse(library.tracks) 
      : [];
    
    const track = tracks.find((t) => t.id === data.trackId);
    if (!track) {
      throw new Error("Track not found");
    }
    
    const { data: audioUrl, error } = await supabase.storage
      .from("cloud-audio")
      .createSignedUrl(track.audioPath, 3600); // 1 hour expiry
    
    if (error) throw error;
    
    let coverUrl = null;
    if (track.coverPath) {
      const { data: coverData } = await supabase.storage
        .from("cloud-covers")
        .createSignedUrl(track.coverPath, 3600);
      coverUrl = coverData?.signedUrl || null;
    }
    
    return {
      audioUrl: audioUrl.signedUrl,
      coverUrl,
      track,
    };
  });
