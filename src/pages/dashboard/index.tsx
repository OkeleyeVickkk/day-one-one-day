import { useState, useEffect } from "react";
import { Film, HardDrive, Eye, Globe, Upload, Clapperboard } from "lucide-react";
import { supabase } from "../../lib/supabaseClient";
import { useAuth } from "../../contexts/auth-context";
import UploadSection from "../../components/upload-section";
import VideoGrid from "../../components/video-grid";
import { formatFileSize } from "../../lib/utils";

interface DashboardStats {
	totalVideos: number;
	totalSpaceSaved: number;
	totalViews: number;
	publicVideos: number;
}

export default function DashboardIndex() {
	const { user } = useAuth();
	const [showUpload, setShowUpload] = useState(false);
	const [stats, setStats] = useState<DashboardStats>({
		totalVideos: 0,
		totalSpaceSaved: 0,
		totalViews: 0,
		publicVideos: 0,
	});

	useEffect(() => {
		if (user) {
			fetchStats();
		}
	}, [user]);

	async function fetchStats() {
		try {
			if (!user) return;

			const { data: videos } = await supabase.from("videos").select("*").eq("owner_id", user.id);

			if (videos) {
				const totalSpaceSaved = videos.reduce((sum, v) => {
					if (v.original_size && v.compressed_size) {
						return sum + (v.original_size - v.compressed_size);
					}
					return sum;
				}, 0);

				const publicVideos = videos.filter((v) => v.is_public).length;
				const totalViews = videos.reduce((sum, v) => sum + (v.views_count || 0), 0);

				setStats({
					totalVideos: videos.length,
					totalSpaceSaved,
					totalViews,
					publicVideos,
				});
			}
		} catch (error) {
			console.error("Error fetching stats:", error);
		}
	}

	return (
		<div className="min-h-screen">
			{/* Header */}
			<div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
				<div>
					<h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
						<Film className="w-8 h-8" /> Video Dashboard
					</h1>
					<p className="text-gray-600 mt-2">Manage your compressed videos and track your savings</p>
				</div>

				<button
					onClick={() => setShowUpload(true)}
					className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors">
					<Upload className="w-4 h-4 mr-2" /> Upload Video
				</button>
			</div>

			{/* Stats Cards */}
			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
				<div className="bg-white p-6 rounded-xl border border-gray-200">
					<div className="flex items-center">
						<div className="p-3 bg-blue-100 rounded-lg mr-4">
							<Film className="w-6 h-6 text-blue-600" />
						</div>
						<div>
							<p className="text-sm text-gray-600">Total Videos</p>
							<p className="text-2xl font-semibold text-gray-900">{stats.totalVideos}</p>
						</div>
					</div>
				</div>

				<div className="bg-white p-6 rounded-xl border border-gray-200">
					<div className="flex items-center">
						<div className="p-3 bg-green-100 rounded-lg mr-4">
							<HardDrive className="w-6 h-6 text-green-600" />
						</div>
						<div>
							<p className="text-sm text-gray-600">Space Saved</p>
							<p className="text-2xl font-semibold text-gray-900">{formatFileSize(stats.totalSpaceSaved)}</p>
						</div>
					</div>
				</div>

				<div className="bg-white p-6 rounded-xl border border-gray-200">
					<div className="flex items-center">
						<div className="p-3 bg-purple-100 rounded-lg mr-4">
							<Eye className="w-6 h-6 text-purple-600" />
						</div>
						<div>
							<p className="text-sm text-gray-600">Total Views</p>
							<p className="text-2xl font-semibold text-gray-900">{stats.totalViews.toLocaleString()}</p>
						</div>
					</div>
				</div>

				<div className="bg-white p-6 rounded-xl border border-gray-200">
					<div className="flex items-center">
						<div className="p-3 bg-orange-100 rounded-lg mr-4">
							<Globe className="w-6 h-6 text-orange-600" />
						</div>
						<div>
							<p className="text-sm text-gray-600">Public Videos</p>
							<p className="text-2xl font-semibold text-gray-900">{stats.publicVideos}</p>
						</div>
					</div>
				</div>
			</div>

			{/* Upload Modal */}
			<UploadSection
				isOpen={showUpload}
				onOpenChange={setShowUpload}
				onComplete={() => {
					setShowUpload(false);
					fetchStats();
				}}
			/>

			{/* Videos Grid */}
			<div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
				<div className="p-6 border-b border-gray-200">
					<h2 className="text-xl font-semibold flex items-center gap-2">
						<Clapperboard className="w-5 h-5" /> Your Videos
					</h2>
					<p className="text-gray-600 mt-1">All your compressed videos in one place</p>
				</div>
				<div className="p-6">
					<VideoGrid userId={user?.id} showFilters={true} />
				</div>
			</div>
		</div>
	);
}
