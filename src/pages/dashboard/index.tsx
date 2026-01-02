import { useParams } from "react-router";
import { useState, useEffect } from "react";
import { _router } from "../../routes/_router";
import { supabase } from "../../lib/supabaseClient";
import { useAuth } from "../../contexts/auth-context";
import UploadSection from "../../components/upload-section";
import VideoGrid from "../../components/video-grid";
import { ActionButton } from "../../components/base/action-button";
import { Spinner } from "../../components/ui/spinner";
import { Card } from "../../components/ui/card";

interface DashboardStats {
	totalVideos: number;
	totalOriginalSize: number;
	totalCompressedSize: number;
	totalSavings: number;
	savingsPercentage: number;
}

export default function DashboardIndex() {
	const { username } = useParams<{ username?: string }>();
	const { user } = useAuth();
	const [isProfileView, setIsProfileView] = useState(false);
	const [profileUserId, setProfileUserId] = useState<string | null>(null);
	const [loading, setLoading] = useState(false);
	const [stats, setStats] = useState<DashboardStats>({
		totalVideos: 0,
		totalOriginalSize: 0,
		totalCompressedSize: 0,
		totalSavings: 0,
		savingsPercentage: 0,
	});

	useEffect(() => {
		if (username) {
			setIsProfileView(true);
			fetchUserProfile(username);
		} else {
			setIsProfileView(false);
			if (user) {
				fetchDashboardStats();
			}
		}
	}, [username, user]);

	const fetchDashboardStats = async () => {
		try {
			if (!user) return;

			const { data, error } = await supabase.from("videos").select("original_size, compressed_size").eq("owner_id", user.id);

			if (error) throw error;

			const videos = data || [];
			const totalOriginalSize = videos.reduce((sum, v) => sum + (v.original_size || 0), 0);
			const totalCompressedSize = videos.reduce((sum, v) => sum + v.compressed_size, 0);
			const totalSavings = totalOriginalSize - totalCompressedSize;
			const savingsPercentage = totalOriginalSize > 0 ? (totalSavings / totalOriginalSize) * 100 : 0;

			setStats({
				totalVideos: videos.length,
				totalOriginalSize,
				totalCompressedSize,
				totalSavings,
				savingsPercentage,
			});
		} catch (error) {
			console.error("Error fetching dashboard stats:", error);
		}
	};

	const fetchUserProfile = async (username: string) => {
		try {
			setLoading(true);
			const { data, error } = await supabase.from("profiles").select("user_id").eq("username", username).single();

			if (error || !data) {
				console.error("User not found");
				return;
			}

			setProfileUserId(data.user_id);
		} catch (error) {
			console.error("Error fetching profile:", error);
		} finally {
			setLoading(false);
		}
	};

	const handleUploadComplete = () => {
		fetchDashboardStats();
	};

	const formatBytes = (bytes: number) => {
		if (bytes === 0) return "0 B";
		const k = 1024;
		const sizes = ["B", "KB", "MB", "GB"];
		const i = Math.floor(Math.log(bytes) / Math.log(k));
		return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
	};

	if (loading) {
		return <Spinner />;
	}

	if (isProfileView) {
		return (
			<div className="space-y-8">
				<div className="text-center">
					<h1 className="text-3xl font-bold text-gray-900 mb-2">@{username}'s Videos</h1>
					<p className="text-gray-600">Public videos from this user</p>
				</div>

				{profileUserId && <VideoGrid isPublic={true} userId={profileUserId} showActions={false} />}
			</div>
		);
	}

	return (
		<div className="space-y-8">
			<div className="flex justify-end">
				<div className="flex space-x-4">
					<ActionButton href={_router.dashboard.settings} variant="outline">
						Settings
					</ActionButton>
				</div>
			</div>

			<UploadSection onUploadComplete={handleUploadComplete} />

			{/* Dashboard Statistics */}
			<div>
				<h2 className="text-2xl font-semibold text-gray-900 mb-4">Your Statistics</h2>
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
					<Card className="p-6">
						<div className="text-sm font-medium text-gray-500">Total Videos</div>
						<div className="text-3xl font-bold text-gray-900 mt-2">{stats.totalVideos}</div>
					</Card>
					<Card className="p-6">
						<div className="text-sm font-medium text-gray-500">Original Size</div>
						<div className="text-3xl font-bold text-gray-900 mt-2">{formatBytes(stats.totalOriginalSize)}</div>
					</Card>
					<Card className="p-6">
						<div className="text-sm font-medium text-gray-500">Compressed Size</div>
						<div className="text-3xl font-bold text-gray-900 mt-2">{formatBytes(stats.totalCompressedSize)}</div>
					</Card>
					<Card className="p-6">
						<div className="text-sm font-medium text-gray-500">Space Saved</div>
						<div className="text-3xl font-bold text-green-600 mt-2">{stats.savingsPercentage.toFixed(1)}%</div>
						<div className="text-sm text-gray-600 mt-1">{formatBytes(stats.totalSavings)}</div>
					</Card>
				</div>
			</div>

			<div>
				<h2 className="text-2xl font-semibold text-gray-900 mb-4">Your Videos</h2>
				<VideoGrid />
			</div>
		</div>
	);
}
