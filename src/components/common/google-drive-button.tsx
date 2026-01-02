import { useState } from "react";
import { signInWithGoogleDrive } from "@/lib/google-drive";
import { ActionButton } from "../base/action-button";

export default function GoogleDriveButton() {
	const [loading, setLoading] = useState(false);

	const handleClick = async () => {
		try {
			setLoading(true);
			// Redirect back to app after OAuth flow
			const redirectTo = `${window.location.origin}/dashboard`;
			await signInWithGoogleDrive(redirectTo);
			// Supabase will redirect the browser; nothing else to do here
		} catch (err) {
			console.error("Google Drive sign-in failed:", err);
			setLoading(false);
		}
	};

	return (
		<ActionButton onClick={handleClick} variant="outline" className="w-full" disabled={loading}>
			{loading ? "Connecting to Google Drive..." : "Sign in with Google (Drive)"}
		</ActionButton>
	);
}
