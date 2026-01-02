import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Validate environment variables
if (!supabaseUrl || !supabaseAnonKey) {
	console.error("Missing Supabase environment variables:");
	console.error("VITE_SUPABASE_URL:", supabaseUrl ? "✓" : "✗ MISSING");
	console.error("VITE_SUPABASE_ANON_KEY:", supabaseAnonKey ? "✓" : "✗ MISSING");
	throw new Error("Supabase credentials are not configured. Please check your .env file.");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
	auth: {
		autoRefreshToken: true,
		persistSession: true,
		detectSessionInUrl: true,
		flowType: "pkce",
	},
});

// Helper to connect Google Drive
export async function connectGoogleDrive() {
	const { data, error } = await supabase.auth.signInWithOAuth({
		provider: "google",
		options: {
			queryParams: {
				access_type: "offline",
				prompt: "consent",
			},
			scopes: "https://www.googleapis.com/auth/drive.file",
			redirectTo: `${window.location.origin}/auth/callback`,
		},
	});
	return { data, error };
}
