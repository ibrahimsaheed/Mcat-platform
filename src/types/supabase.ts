/**
 * Placeholder Database type for Supabase.
 *
 * Replace with generated types from `supabase gen types typescript --linked`
 * once the Supabase project is connected.
 *
 * @see https://supabase.com/docs/guides/api/rest/generating-types
 */
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: Record<string, never>;
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
