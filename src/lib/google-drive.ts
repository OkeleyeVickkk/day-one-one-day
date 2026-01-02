import { supabase } from "./supabaseClient";

type UploadOptions = {
	name?: string;
	mimeType?: string;
	videoId?: string; // optional existing videos table id to update
};

/**
 * Utility function for delays in retry logic.
 */
function sleep(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Initiate Google sign-in with Drive scopes using Supabase OAuth.
 * This will redirect the user to Google's consent screen.
 */
export async function signInWithGoogleDrive(redirectTo?: string) {
	return supabase.auth.signInWithOAuth({
		provider: "google",
		options: {
			// request Drive file scope (file-level access) + basic profile
			scopes: "openid email profile https://www.googleapis.com/auth/drive.file",
			redirectTo,
		},
	});
}
export async function getDriveAccessToken(): Promise<string | null> {
	const { data: sessionData } = await supabase.auth.getSession();
	const providerToken = sessionData?.session?.provider_token;
	return providerToken || null;
}

/**
 * Upload a file to Google Drive with retry logic and store metadata in Supabase.
 */
export async function uploadToGoogleDrive(file: File, options: UploadOptions = {}): Promise<{ driveFileId: string }> {
	const access_token = await getDriveAccessToken();
	if (!access_token) {
		throw new Error("No Google Drive access token available. Please sign in with Google Drive first.");
	}
	const name = options.name || file.name;
	const mimeType = options.mimeType || file.type || "application/octet-stream";

	const boundary = "-------dood-boundary-" + Date.now();

	const metadata = {
		name,
		mimeType,
	};

	const pre = `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(
		metadata
	)}\r\n--${boundary}\r\nContent-Type: ${mimeType}\r\n\r\n`;
	const post = `\r\n--${boundary}--`;

	// Build multipart body as Blob to include binary file
	const body = new Blob([pre, file, post], { type: `multipart/related; boundary=${boundary}` });

	const uploadUrl = `https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart`;

	const maxAttempts = 3;
	let attempt = 0;
	let lastErr: any = null;

	while (attempt < maxAttempts) {
		try {
			const res = await fetch(uploadUrl, {
				method: "POST",
				headers: {
					Authorization: `Bearer ${access_token}`,
				},
				body,
			});

			if (res.status === 401 || res.status === 403) {
				throw new Error("Google Drive access denied (invalid/expired token). Please re-authenticate with Google and grant Drive access.");
			}

			if (!res.ok) {
				const text = await res.text();
				throw new Error(`Drive upload failed: ${res.status} ${res.statusText} - ${text}`);
			}

			const data = await res.json();
			const driveFileId = data.id as string;

			// Store Drive file ID in videos table if videoId provided, otherwise create a new record
			try {
				const { data: sessionData } = await supabase.auth.getSession();
				const userId = sessionData?.session?.user?.id || null;

				if (options.videoId) {
					await supabase.from("videos").update({ drive_file_id: driveFileId }).eq("id", options.videoId);
				} else {
					await supabase.from("videos").insert({
						user_id: userId,
						original_name: file.name,
						mime_type: mimeType,
						drive_file_id: driveFileId,
					});
				}
			} catch (dbErr) {
				console.error("Failed to store drive file id in videos table:", dbErr);
				// non-fatal: continue
			}

			return { driveFileId };
		} catch (err) {
			lastErr = err;
			attempt++;
			const backoff = 500 * attempt;
			console.warn(`uploadToGoogleDrive attempt ${attempt} failed, retrying in ${backoff}ms`, err);
			await sleep(backoff);
		}
	}

	throw lastErr || new Error("uploadToGoogleDrive failed");
}

export default {
	signInWithGoogleDrive,
	getDriveAccessToken,
	uploadToGoogleDrive,
};
