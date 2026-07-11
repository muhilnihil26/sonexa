export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5";
  };
  public: {
    Tables: {
      admin_youtube_tracks: {
        Row: {
          added_by: string | null;
          channel: string;
          created_at: string;
          id: string;
          language: string | null;
          source_url: string | null;
          thumbnail: string;
          title: string;
          updated_at: string;
          video_id: string;
        };
        Insert: {
          added_by?: string | null;
          channel: string;
          created_at?: string;
          id?: string;
          language?: string | null;
          source_url?: string | null;
          thumbnail: string;
          title: string;
          updated_at?: string;
          video_id: string;
        };
        Update: {
          added_by?: string | null;
          channel?: string;
          created_at?: string;
          id?: string;
          language?: string | null;
          source_url?: string | null;
          thumbnail?: string;
          title?: string;
          updated_at?: string;
          video_id?: string;
        };
        Relationships: [];
      };
      albums: {
        Row: {
          artist_id: string;
          cover_url: string | null;
          created_at: string;
          description: string | null;
          id: string;
          language: string | null;
          release_date: string | null;
          title: string;
          updated_at: string;
        };
        Insert: {
          artist_id: string;
          cover_url?: string | null;
          created_at?: string;
          description?: string | null;
          id?: string;
          language?: string | null;
          release_date?: string | null;
          title: string;
          updated_at?: string;
        };
        Update: {
          artist_id?: string;
          cover_url?: string | null;
          created_at?: string;
          description?: string | null;
          id?: string;
          language?: string | null;
          release_date?: string | null;
          title?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "albums_artist_id_fkey";
            columns: ["artist_id"];
            isOneToOne: false;
            referencedRelation: "artists";
            referencedColumns: ["id"];
          },
        ];
      };
      artists: {
        Row: {
          bio: string | null;
          created_at: string;
          genres: string[] | null;
          id: string;
          image_url: string | null;
          language: string | null;
          monthly_listeners: number | null;
          name: string;
          slug: string;
          updated_at: string;
          verified: boolean | null;
        };
        Insert: {
          bio?: string | null;
          created_at?: string;
          genres?: string[] | null;
          id?: string;
          image_url?: string | null;
          language?: string | null;
          monthly_listeners?: number | null;
          name: string;
          slug: string;
          updated_at?: string;
          verified?: boolean | null;
        };
        Update: {
          bio?: string | null;
          created_at?: string;
          genres?: string[] | null;
          id?: string;
          image_url?: string | null;
          language?: string | null;
          monthly_listeners?: number | null;
          name?: string;
          slug?: string;
          updated_at?: string;
          verified?: boolean | null;
        };
        Relationships: [];
      };
      follows: {
        Row: {
          artist_id: string;
          created_at: string;
          user_id: string;
        };
        Insert: {
          artist_id: string;
          created_at?: string;
          user_id: string;
        };
        Update: {
          artist_id?: string;
          created_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "follows_artist_id_fkey";
            columns: ["artist_id"];
            isOneToOne: false;
            referencedRelation: "artists";
            referencedColumns: ["id"];
          },
        ];
      };
      likes: {
        Row: {
          created_at: string;
          song_id: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          song_id: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          song_id?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "likes_song_id_fkey";
            columns: ["song_id"];
            isOneToOne: false;
            referencedRelation: "songs";
            referencedColumns: ["id"];
          },
        ];
      };
      listening_history: {
        Row: {
          id: string;
          played_at: string;
          song_id: string;
          user_id: string;
        };
        Insert: {
          id?: string;
          played_at?: string;
          song_id: string;
          user_id: string;
        };
        Update: {
          id?: string;
          played_at?: string;
          song_id?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "listening_history_song_id_fkey";
            columns: ["song_id"];
            isOneToOne: false;
            referencedRelation: "songs";
            referencedColumns: ["id"];
          },
        ];
      };
      playlist_songs: {
        Row: {
          added_at: string;
          id: string;
          playlist_id: string;
          position: number;
          song_id: string;
        };
        Insert: {
          added_at?: string;
          id?: string;
          playlist_id: string;
          position?: number;
          song_id: string;
        };
        Update: {
          added_at?: string;
          id?: string;
          playlist_id?: string;
          position?: number;
          song_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "playlist_songs_playlist_id_fkey";
            columns: ["playlist_id"];
            isOneToOne: false;
            referencedRelation: "playlists";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "playlist_songs_song_id_fkey";
            columns: ["song_id"];
            isOneToOne: false;
            referencedRelation: "songs";
            referencedColumns: ["id"];
          },
        ];
      };
      playlists: {
        Row: {
          cover_url: string | null;
          created_at: string;
          description: string | null;
          id: string;
          is_public: boolean | null;
          owner_id: string;
          title: string;
          updated_at: string;
        };
        Insert: {
          cover_url?: string | null;
          created_at?: string;
          description?: string | null;
          id?: string;
          is_public?: boolean | null;
          owner_id: string;
          title: string;
          updated_at?: string;
        };
        Update: {
          cover_url?: string | null;
          created_at?: string;
          description?: string | null;
          id?: string;
          is_public?: boolean | null;
          owner_id?: string;
          title?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          avatar_url: string | null;
          bio: string | null;
          created_at: string;
          display_name: string | null;
          id: string;
          languages: string[];
          updated_at: string;
        };
        Insert: {
          avatar_url?: string | null;
          bio?: string | null;
          created_at?: string;
          display_name?: string | null;
          id: string;
          languages?: string[];
          updated_at?: string;
        };
        Update: {
          avatar_url?: string | null;
          bio?: string | null;
          created_at?: string;
          display_name?: string | null;
          id?: string;
          languages?: string[];
          updated_at?: string;
        };
        Relationships: [];
      };
      songs: {
        Row: {
          album_id: string | null;
          artist_id: string;
          audio_url: string;
          cover_url: string | null;
          created_at: string;
          description: string | null;
          duration_seconds: number | null;
          genre: string | null;
          id: string;
          language: string | null;
          lyrics: string | null;
          mood: string | null;
          play_count: number | null;
          release_date: string | null;
          tags: string[] | null;
          title: string;
          updated_at: string;
          uploaded_by: string | null;
        };
        Insert: {
          album_id?: string | null;
          artist_id: string;
          audio_url: string;
          cover_url?: string | null;
          created_at?: string;
          description?: string | null;
          duration_seconds?: number | null;
          genre?: string | null;
          id?: string;
          language?: string | null;
          lyrics?: string | null;
          mood?: string | null;
          play_count?: number | null;
          release_date?: string | null;
          tags?: string[] | null;
          title: string;
          updated_at?: string;
          uploaded_by?: string | null;
        };
        Update: {
          album_id?: string | null;
          artist_id?: string;
          audio_url?: string;
          cover_url?: string | null;
          created_at?: string;
          description?: string | null;
          duration_seconds?: number | null;
          genre?: string | null;
          id?: string;
          language?: string | null;
          lyrics?: string | null;
          mood?: string | null;
          play_count?: number | null;
          release_date?: string | null;
          tags?: string[] | null;
          title?: string;
          updated_at?: string;
          uploaded_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "songs_album_id_fkey";
            columns: ["album_id"];
            isOneToOne: false;
            referencedRelation: "albums";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "songs_artist_id_fkey";
            columns: ["artist_id"];
            isOneToOne: false;
            referencedRelation: "artists";
            referencedColumns: ["id"];
          },
        ];
      };
      user_roles: {
        Row: {
          created_at: string;
          id: string;
          role: Database["public"]["Enums"]["app_role"];
          user_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          role?: Database["public"]["Enums"]["app_role"];
          user_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          role?: Database["public"]["Enums"]["app_role"];
          user_id?: string;
        };
        Relationships: [];
      };
      youtube_song_requests: {
        Row: {
          channel: string;
          created_at: string;
          id: string;
          language: string | null;
          requested_by: string;
          reviewed_at: string | null;
          reviewed_by: string | null;
          source_url: string;
          status: string;
          thumbnail: string;
          title: string;
          updated_at: string;
          video_id: string;
        };
        Insert: {
          channel: string;
          created_at?: string;
          id?: string;
          language?: string | null;
          requested_by: string;
          reviewed_at?: string | null;
          reviewed_by?: string | null;
          source_url: string;
          status?: string;
          thumbnail: string;
          title: string;
          updated_at?: string;
          video_id: string;
        };
        Update: {
          channel?: string;
          created_at?: string;
          id?: string;
          language?: string | null;
          requested_by?: string;
          reviewed_at?: string | null;
          reviewed_by?: string | null;
          source_url?: string;
          status?: string;
          thumbnail?: string;
          title?: string;
          updated_at?: string;
          video_id?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"];
          _user_id: string;
        };
        Returns: boolean;
      };
    };
    Enums: {
      app_role: "admin" | "user";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "user"],
    },
  },
} as const;
