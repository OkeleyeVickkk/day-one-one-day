import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabaseClient";
import { useAuth } from "../../contexts/auth-context";
import { useNavigate } from "react-router";
import { _router } from "../../routes/_router";
import { ActionButton } from "../../components/base/action-button";
import { LoadingSpinner } from "../../components/loading-spinner";

interface Profile {
	share_enabled: boolean;
	share_token: string | null;
}

export default function Settings() {
	const { user } = useAuth();
	const navigate = useNavigate();
	const [profile, setProfile] = useState<Profile | null>(null);
	const [loading, setLoading] = useState(true);
	const [updating, setUpdating] = useState(false);

	useEffect(() => {
		if (!user) {
			navigate(_router.landing.index);
			return;
		}
		fetchProfile();
	}, [user, navigate]);

	const fetchProfile = async () => {
		try {
			if (!user) return;

			const { data, error } = await supabase.from("profiles").select("share_enabled, share_token").eq("id", user.id).single();

			if (error) throw error;
			setProfile(data);
		} catch (error) {
			console.error("Error fetching profile:", error);
		} finally {
			setLoading(false);
		}
	};

	const toggleSharing = async () => {
		if (!profile || !user) return;

		setUpdating(true);
		try {
			const newShareEnabled = !profile.share_enabled;
			let newShareToken = profile.share_token;

			if (newShareEnabled && !profile.share_token) {
				// Generate a new random token
				newShareToken = generateSecureToken();
			}

			const { error } = await supabase
				.from("profiles")
				.update({
					share_enabled: newShareEnabled,
					share_token: newShareToken,
				})
				.eq("id", user.id);

			if (error) throw error;

			setProfile({
				share_enabled: newShareEnabled,
				share_token: newShareToken,
			});
		} catch (error) {
			console.error("Error updating sharing settings:", error);
		} finally {
			setUpdating(false);
		}
	};

	const generateSecureToken = () => {
		const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
		let result = "";
		for (let i = 0; i < 20; i++) {
			result += chars.charAt(Math.floor(Math.random() * chars.length));
		}
		return result;
	};

	const copyShareLink = () => {
		if (!profile?.share_token) return;
		const shareUrl = `${window.location.origin}/share/${profile.share_token}`;
		navigator.clipboard.writeText(shareUrl);
		alert("Share link copied to clipboard!");
	};

	if (loading) {
		return <LoadingSpinner />;
	}

	const displayName = user?.full_name || user?.email?.split("@")[0] || "User";

	return (
		<div className="max-w-2xl mx-auto space-y-8">
			<div>
				<h1 className="text-3xl font-bold text-gray-900">Settings</h1>
				<p className="mt-2 text-gray-600">Hi {displayName}, manage your account and sharing preferences.</p>
			</div>

			<div className="bg-white p-6 rounded-lg shadow">
				<h2 className="text-xl font-semibold text-gray-900 mb-4">Share Your Journey</h2>
				<p className="text-gray-600 mb-4">When enabled, anyone with your unique share link can view all your daily videos in a beautiful timeline.</p>

				<div className="flex items-center justify-between">
					<div>
						<label className="text-sm font-medium text-gray-700">Public sharing</label>
						<p className="text-sm text-gray-500">{profile?.share_enabled ? "Enabled" : "Disabled"}</p>
					</div>
					<ActionButton onClick={toggleSharing} disabled={updating} variant={profile?.share_enabled ? "destructive" : "default"}>
						{updating ? "Updating..." : profile?.share_enabled ? "Disable" : "Enable"}
					</ActionButton>
				</div>

				{profile?.share_enabled && profile.share_token && (
					<div className="mt-4 p-4 bg-gray-50 rounded-lg">
						<label className="block text-sm font-medium text-gray-700 mb-2">Your share link:</label>
						<div className="flex items-center space-x-2">
							<code className="flex-1 p-2 bg-white border rounded text-sm">{`${window.location.origin}/share/${profile.share_token}`}</code>
							<ActionButton onClick={copyShareLink} variant="outline" size="sm">
								Copy
							</ActionButton>
						</div>
					</div>
				)}
			</div>
		</div>
	);
}
