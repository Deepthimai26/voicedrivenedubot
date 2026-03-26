import { createClient } from "@supabase/supabase-js";

// Pull from environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Create a single supabase client for the app
export const supabase = createClient(supabaseUrl, supabaseKey);
