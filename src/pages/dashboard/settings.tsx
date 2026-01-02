import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabaseClient";
import { useAuth } from "../../contexts/auth-context";
import { useNavigate } from "react-router";
import { _router } from "../../routes/_router";
import { ActionButton } from "../../components/base/action-button";
import { Spinner } from "../../components/ui/spinner";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Card } from "../../components/ui/card";

interface Profile {
	username: string | null;
	default_compression_preset?: string;
	google_drive_connected: boolean;
}

export default function Settings() {
	const { user, signOut } = useAuth();
	const navigate = useNavigate();
	const [profile, setProfile] = useState<Profile | null>(null);
	const [loading, setLoading] = useState(true);
	const [username, setUsername] = useState("");
	const [updatingUsername, setUpdatingUsername] = useState(false);

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

			const { data, error } = await supabase
				.from("profiles")
				.select("username, default_compression_preset, google_drive_connected")
				.eq("id", user.id)
				.single();

			if (error) throw error;
			setProfile(data);
			setUsername(data.username || "");
		} catch (error) {
			console.error("Error fetching profile:", error);
		} finally {
			setLoading(false);
		}
	};

	const updateUsername = async () => {
		if (!user || !username.trim()) return;

		setUpdatingUsername(true);
		try {
			const { error } = await supabase.from("profiles").update({ username: username.trim() }).eq("id", user.id);

			if (error) throw error;

			setProfile((prev) => (prev ? { ...prev, username: username.trim() } : null));
			alert("Username updated successfully!");
		} catch (error) {
			console.error("Error updating username:", error);
			alert("Failed to update username");
		} finally {
			setUpdatingUsername(false);
		}
	};

	const updateCompressionPreset = async (preset: string) => {
		if (!user) return;

		try {
			const { error } = await supabase.from("profiles").update({ default_compression_preset: preset }).eq("id", user.id);

			if (error) throw error;

			setProfile((prev) => (prev ? { ...prev, default_compression_preset: preset } : null));
			alert("Compression preset updated!");
		} catch (error) {
			console.error("Error updating preset:", error);
		}
	};

	const handleLogout = async () => {
		try {
			await signOut();
			navigate(_router.landing.index);
		} catch (error) {
			console.error("Error logging out:", error);
		}
	};

	if (loading) {
		return <Spinner />;
	}

	const displayName = user?.full_name || "User";

	return (
		<div className="max-w-2xl mx-auto space-y-8">
			<div>
				<h1 className="text-3xl font-bold text-gray-900">Settings</h1>
				<p className="mt-2 text-gray-600">Hi {displayName}, manage your account and sharing preferences.</p>
			</div>

			{/* Profile Section */}
			<Card className="p-6">
				<h2 className="text-xl font-semibold text-gray-900 mb-4">Profile</h2>
				<div className="space-y-4">
					<div>
						<label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
						<Input type="email" value={user?.email} disabled />
						<p className="text-xs text-gray-500 mt-1">Your email address cannot be changed</p>
					</div>
					<div>
						<label className="block text-sm font-medium text-gray-700 mb-2">Username</label>
						<div className="flex items-center space-x-2">
							<Input type="text" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Enter your username" />
							<ActionButton onClick={updateUsername} disabled={updatingUsername} variant="outline" size="sm">
								{updatingUsername ? "Updating..." : "Update"}
							</ActionButton>
						</div>
						<p className="text-xs text-gray-500 mt-1">Your profile will be available at @{username || "username"}</p>
					</div>
				</div>
			</Card>

			{/* Compression Settings */}
			<Card className="p-6">
				<h2 className="text-xl font-semibold text-gray-900 mb-4">Compression Settings</h2>
				<p className="text-gray-600 mb-4">Choose your default video compression preset</p>
				<div className="space-y-3">
					{["ultrafast", "veryfast", "medium", "slow"].map((preset) => (
						<label key={preset} className="flex items-center space-x-2">
							<input
								type="radio"
								name="preset"
								value={preset}
								checked={profile?.default_compression_preset === preset}
								onChange={() => updateCompressionPreset(preset)}
								className="w-4 h-4"
							/>
							<span className="text-sm text-gray-700 capitalize">{preset}</span>
							<span className="text-xs text-gray-500">
								{preset === "ultrafast" && "Fast (larger file)"}
								{preset === "veryfast" && "Balanced (good quality)"}
								{preset === "medium" && "Balanced quality"}
								{preset === "slow" && "Best quality (slower)"}
							</span>
						</label>
					))}
				</div>
			</Card>

			{/* Sharing Section */}
			<Card className="p-6">
				<h2 className="text-xl font-semibold text-gray-900 mb-4">Share Your Videos</h2>
				<p className="text-gray-600">
					Make individual videos public from your video dashboard to allow anyone with the share link to view them. Each video gets its own unique
					share link.
				</p>
			</Card>

			{/* Google Drive Section */}
			<Card className="p-6">
				<h2 className="text-xl font-semibold text-gray-900 mb-4">Google Drive</h2>
				<div className="flex items-center justify-between">
					<div>
						<label className="text-sm font-medium text-gray-700">Connection Status</label>
						<p className="text-sm text-gray-500">{profile?.google_drive_connected ? "Connected" : "Not connected"}</p>
					</div>
					{!profile?.google_drive_connected && <Button variant="outline">Connect Google Drive</Button>}
				</div>
			</Card>

			{/* Account Section */}
			<Card className="p-6 border-red-200">
				<h2 className="text-xl font-semibold text-gray-900 mb-4">Account</h2>
				<Button onClick={handleLogout} variant="destructive" className="w-full">
					Log Out
				</Button>
			</Card>
		</div>
	);
}
