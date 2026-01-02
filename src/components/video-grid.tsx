import { useState, useEffect } from "react";
import { supabase } from "../lib/supabaseClient";
import VideoCard from "./video-card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Globe, BarChart3, HardDrive, Eye } from "lucide-react";

interface VideoGridProps {
	userId?: string;
	showFilters?: boolean;
	viewMode?: "grid" | "list";
}

type SortOption = "newest" | "oldest" | "largest" | "smallest" | "most_views";
type FilterOption = "all" | "public" | "private" | "completed" | "processing";

export default function VideoGrid({ userId, showFilters = true, viewMode: initialViewMode = "grid" }: VideoGridProps) {
	const [videos, setVideos] = useState<any[]>([]);
	const [loading, setLoading] = useState(true);
	const [searchQuery, setSearchQuery] = useState("");
	const [sortBy, setSortBy] = useState<SortOption>("newest");
	const [filterBy, setFilterBy] = useState<FilterOption>("all");
	const [viewMode, setViewMode] = useState<"grid" | "list">(initialViewMode);

	useEffect(() => {
		fetchVideos();
	}, [userId, sortBy, filterBy]);

	async function fetchVideos() {
		try {
			setLoading(true);

			let query = supabase
				.from("videos")
				.select("*")
				.order("created_at", { ascending: sortBy === "oldest" });

			// Apply user filter
			if (userId) {
				query = query.eq("owner_id", userId);
			} else {
				query = query.eq("is_public", true);
			}

			// Apply status filter
			if (filterBy === "completed") {
				query = query.eq("status", "completed");
			} else if (filterBy === "processing") {
				query = query.eq("status", "processing");
			} else if (filterBy === "public") {
				query = query.eq("is_public", true);
			} else if (filterBy === "private") {
				query = query.eq("is_public", false);
			}

			// Apply sorting
			if (sortBy === "largest") {
				query = query.order("original_size", { ascending: false });
			} else if (sortBy === "smallest") {
				query = query.order("original_size", { ascending: true });
			} else if (sortBy === "most_views") {
				query = query.order("views_count", { ascending: false });
			}

			const { data, error } = await query;

			if (error) throw error;

			// Apply search filter client-side
			let filteredData = data || [];
			if (searchQuery) {
				filteredData = filteredData.filter(
					(video) =>
						video.title.toLowerCase().includes(searchQuery.toLowerCase()) || video.description?.toLowerCase().includes(searchQuery.toLowerCase())
				);
			}

			setVideos(filteredData);
		} catch (error) {
			console.error("Error fetching videos:", error);
			alert("Failed to load videos");
		} finally {
			setLoading(false);
		}
	}

	const handleVideoDeleted = (deletedVideoId: string) => {
		setVideos((prev) => prev.filter((video) => video.id !== deletedVideoId));
	};

	const handleVideoShared = () => {
		// Optional: Update UI or show confirmation
	};

	const handlePrivacyToggled = (videoId: string, isPublic: boolean) => {
		setVideos((prev) => prev.map((video) => (video.id === videoId ? { ...video, is_public: isPublic } : video)));
	};

	const getStats = () => {
		const totalVideos = videos.length;
		const totalSize = videos.reduce((sum, v) => sum + (v.original_size || 0), 0);
		const compressedSize = videos.reduce((sum, v) => sum + (v.compressed_size || 0), 0);
		const savedSpace = totalSize - compressedSize;
		const publicVideos = videos.filter((v) => v.is_public).length;

		return {
			totalVideos,
			totalSize,
			compressedSize,
			savedSpace,
			publicVideos,
		};
	};

	const stats = getStats();

	if (loading) {
		return (
			<div className={`${viewMode === "grid" ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3" : "space-y-4"} gap-6`}>
				{[...Array(6)].map((_, i) => (
					<div key={i} className="animate-pulse">
						<div className="aspect-video bg-gray-200 rounded-xl mb-4"></div>
						<div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
						<div className="h-3 bg-gray-200 rounded w-1/2"></div>
					</div>
				))}
			</div>
		);
	}

	return (
		<div className="space-y-6">
			{/* Header with Stats & Controls */}
			<div className="bg-white rounded-xl border border-gray-200 p-6">
				<div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
					<div>
						<h2 className="text-xl font-semibold text-gray-900">{userId ? "My Videos" : "Public Videos"}</h2>
						<p className="text-gray-600 mt-1">
							{videos.length} video{videos.length !== 1 ? "s" : ""} • Saved {Math.round(stats.savedSpace / 1024 / 1024)}MB of space
						</p>
					</div>

					<div className="flex items-center space-x-4">
						{/* View Toggle */}
						<div className="flex items-center bg-gray-100 rounded-lg p-1">
							<Button variant={viewMode === "grid" ? "default" : "ghost"} size="sm" onClick={() => setViewMode("grid")} title="Grid view">
								⊞
							</Button>
							<Button variant={viewMode === "list" ? "default" : "ghost"} size="sm" onClick={() => setViewMode("list")} title="List view">
								☰
							</Button>
						</div>
					</div>
				</div>

				{/* Filters */}
				{showFilters && (
					<div className="mt-6 flex flex-col md:flex-row gap-4">
						{/* Search */}
						<div className="flex-1 relative">
							<Input
								type="text"
								placeholder="Search videos..."
								value={searchQuery}
								onChange={(e) => setSearchQuery(e.target.value)}
								className="pl-10"
							/>
							<div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">🔍</div>
						</div>

						{/* Sort Dropdown */}
						<Select value={sortBy} onValueChange={(value) => setSortBy(value as SortOption)}>
							<SelectTrigger className="w-48">
								<SelectValue placeholder="Sort by" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="newest">Newest First</SelectItem>
								<SelectItem value="oldest">Oldest First</SelectItem>
								<SelectItem value="largest">Largest Size</SelectItem>
								<SelectItem value="smallest">Smallest Size</SelectItem>
								<SelectItem value="most_views">Most Views</SelectItem>
							</SelectContent>
						</Select>

						{/* Filter Dropdown */}
						<Select value={filterBy} onValueChange={(value) => setFilterBy(value as FilterOption)}>
							<SelectTrigger className="w-48">
								<SelectValue placeholder="Filter by" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="all">All Videos</SelectItem>
								{userId && <SelectItem value="public">Public Only</SelectItem>}
								{userId && <SelectItem value="private">Private Only</SelectItem>}
								<SelectItem value="completed">Completed</SelectItem>
								<SelectItem value="processing">Processing</SelectItem>
							</SelectContent>
						</Select>
					</div>
				)}

				{/* Stats Grid */}
				<div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
					<div className="bg-blue-50 rounded-lg p-4">
						<div className="flex items-center">
							<div className="p-2 bg-blue-100 rounded-lg mr-3">
								<HardDrive className="w-5 h-5 text-blue-600" />
							</div>
							<div>
								<p className="text-sm text-gray-600">Total Space Saved</p>
								<p className="text-xl font-semibold text-gray-900">{Math.round(stats.savedSpace / 1024 / 1024)}MB</p>
							</div>
						</div>
					</div>

					<div className="bg-green-50 rounded-lg p-4">
						<div className="flex items-center">
							<div className="p-2 bg-green-100 rounded-lg mr-3">
								<Eye className="w-5 h-5 text-green-600" />
							</div>
							<div>
								<p className="text-sm text-gray-600">Total Views</p>
								<p className="text-xl font-semibold text-gray-900">{videos.reduce((sum, v) => sum + v.views_count, 0).toLocaleString()}</p>
							</div>
						</div>
					</div>

					<div className="bg-purple-50 rounded-lg p-4">
						<div className="flex items-center">
							<div className="p-2 bg-purple-100 rounded-lg mr-3">
								<Globe className="w-5 h-5 text-purple-600" />
							</div>
							<div>
								<p className="text-sm text-gray-600">Public Videos</p>
								<p className="text-xl font-semibold text-gray-900">{stats.publicVideos}</p>
							</div>
						</div>
					</div>

					<div className="bg-orange-50 rounded-lg p-4">
						<div className="flex items-center">
							<div className="p-2 bg-orange-100 rounded-lg mr-3">
								<BarChart3 className="w-5 h-5 text-orange-600" />
							</div>
							<div>
								<p className="text-sm text-gray-600">Avg. Compression</p>
								<p className="text-xl font-semibold text-gray-900">
									{videos.length > 0
										? Math.round(
												videos.reduce((sum, v) => {
													if (v.original_size && v.compressed_size) {
														return sum + ((v.original_size - v.compressed_size) / v.original_size) * 100;
													}
													return sum;
												}, 0) / videos.length
										  )
										: 0}
									%
								</p>
							</div>
						</div>
					</div>
				</div>
			</div>

			{/* Videos Grid/List */}
			{videos.length === 0 ? (
				<div className="text-center py-12 bg-white rounded-xl border border-gray-200">
					<div className="max-w-md mx-auto">
						<div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">🔍</div>
						<h3 className="text-lg font-medium text-gray-900 mb-2">No videos found</h3>
						<p className="text-gray-600">
							{searchQuery || filterBy !== "all"
								? "Try changing your search or filters"
								: userId
								? "Upload your first video to get started"
								: "No public videos available yet"}
						</p>
					</div>
				</div>
			) : (
				<div className={viewMode === "grid" ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" : "space-y-4"}>
					{videos.map((video) => (
						<div key={video.id} className={viewMode === "list" ? "max-w-full" : ""}>
							<VideoCard
								video={video}
								isOwner={!!userId}
								onDelete={handleVideoDeleted}
								onShare={handleVideoShared}
								onTogglePrivacy={handlePrivacyToggled}
								onFolderChange={() => fetchVideos()}
								viewMode={viewMode}
							/>
						</div>
					))}
				</div>
			)}
		</div>
	);
}
