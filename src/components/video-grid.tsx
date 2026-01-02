import { useState, useEffect, useCallback } from "react";
import { supabase } from "../lib/supabaseClient";
import { useAuth } from "../contexts/auth-context";
import { Spinner } from "../components/ui/spinner";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Input } from "../components/ui/input";

interface Video {
	id: string;
	owner_id: string;
	title: string;
	description?: string | null;
	drive_file_id: string;
	compressed_size: number | null;
	original_size?: number | null;
	compression_ratio?: number | null;
	created_at: string;
	is_public: boolean;
	status: string;
	views_count: number;
}

interface VideoGridProps {
	isPublic?: boolean;
	userId?: string;
	limit?: number;
	showActions?: boolean;
	videos?: Video[];
}

export default function VideoGrid({ isPublic = false, userId, limit, showActions = true, videos: preloadedVideos }: VideoGridProps) {
	const { user } = useAuth();
	const [videos, setVideos] = useState<Video[]>(preloadedVideos || []);
	const [loading, setLoading] = useState(preloadedVideos ? false : true);
	const [loadingMore, setLoadingMore] = useState(false);
	const [hasMore, setHasMore] = useState(true);
	const [page, setPage] = useState(0);
	const [filters, setFilters] = useState({
		dateFrom: "",
		dateTo: "",
		sizeMin: "",
		sizeMax: "",
		status: "",
	});
	const [sortBy, setSortBy] = useState<"created_at" | "compressed_size" | "duration">("created_at");
	const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

	useEffect(() => {
		if (!preloadedVideos) {
			fetchVideos(true);
		}
	}, [isPublic, userId, filters, sortBy, sortOrder]);

	const fetchVideos = async (reset = false) => {
		try {
			if (reset) {
				setPage(0);
				setVideos([]);
				setHasMore(true);
			}

			const currentPage = reset ? 0 : page;
			const pageSize = limit || 12;

			let query = supabase
				.from("videos")
				.select("*")
				.order(sortBy, { ascending: sortOrder === "asc" });

			if (isPublic && userId) {
				query = query.eq("owner_id", userId).eq("is_public", true);
			} else if (user) {
				query = query.eq("owner_id", user.id);

				// Apply filters
				if (filters.dateFrom) {
					query = query.gte("created_at", filters.dateFrom);
				}
				if (filters.dateTo) {
					query = query.lte("created_at", filters.dateTo);
				}
				if (filters.sizeMin) {
					query = query.gte("compressed_size", parseInt(filters.sizeMin) * 1024 * 1024);
				}
				if (filters.sizeMax) {
					query = query.lte("compressed_size", parseInt(filters.sizeMax) * 1024 * 1024);
				}
				if (filters.status) {
					query = query.eq("status", filters.status);
				}
			}

			// Pagination
			query = query.range(currentPage * pageSize, (currentPage + 1) * pageSize - 1);

			const { data, error } = await query;
			if (error) throw error;

			const newVideos = data || [];
			setVideos((prev) => (reset ? newVideos : [...prev, ...newVideos]));
			setHasMore(newVideos.length === pageSize);

			if (!reset) {
				setPage((prev) => prev + 1);
			}
		} catch (error) {
			console.error("Error fetching videos:", error);
		} finally {
			setLoading(false);
			setLoadingMore(false);
		}
	};

	const handleDownload = async (video: Video) => {
		try {
			// Only allow download for video owner
			if (!user || video.owner_id !== user.id) {
				alert("You can only download your own videos");
				return;
			}

			// Create download link for Google Drive file
			const downloadUrl = `https://drive.google.com/uc?export=download&id=${video.drive_file_id}`;
			const link = document.createElement("a");
			link.href = downloadUrl;
			link.download = `video_${video.id}.mp4`;
			document.body.appendChild(link);
			link.click();
			document.body.removeChild(link);
		} catch (error) {
			console.error("Error downloading video:", error);
			alert("Failed to download video");
		}
	};

	const handleShare = async (video: Video) => {
		try {
			// Make video public and generate share link
			const { error } = await supabase.from("videos").update({ is_public: true }).eq("id", video.id).eq("owner_id", user?.id);

			if (error) throw error;

			// Generate shareable link
			const shareUrl = `${window.location.origin}/v/${video.id}`;
			await navigator.clipboard.writeText(shareUrl);
			alert("Share link copied to clipboard! Video is now public.");

			// Update local state
			setVideos((prev) => prev.map((v) => (v.id === video.id ? { ...v, is_public: true } : v)));
		} catch (error) {
			console.error("Error sharing video:", error);
			alert("Failed to share video");
		}
	};

	const handleDelete = async (video: Video) => {
		if (!confirm("Are you sure you want to delete this video?")) return;

		try {
			const { error } = await supabase.from("videos").delete().eq("id", video.id).eq("owner_id", user?.id);

			if (error) throw error;

			// Update local state
			setVideos((prev) => prev.filter((v) => v.id !== video.id));
		} catch (error) {
			console.error("Error deleting video:", error);
			alert("Failed to delete video");
		}
	};

	const loadMore = useCallback(() => {
		if (!loadingMore && hasMore) {
			setLoadingMore(true);
			fetchVideos(false);
		}
	}, [loadingMore, hasMore, fetchVideos]);

	const getVideoUrl = (video: Video) => {
		// Use Google Drive view URL
		return `https://drive.google.com/file/d/${video.drive_file_id}/view`;
	};

	const formatDate = (dateString: string) => {
		const date = new Date(dateString);
		return date.toLocaleDateString("en-US", {
			year: "numeric",
			month: "long",
			day: "numeric",
			weekday: "long",
		});
	};

	const formatFileSize = (bytes: number) => {
		const mb = bytes / (1024 * 1024);
		return `${mb.toFixed(1)} MB`;
	};

	const getCompressionRatio = (originalSize?: number, compressedSize?: number) => {
		if (!originalSize || !compressedSize) return null;
		const ratio = ((originalSize - compressedSize) / originalSize) * 100;
		return ratio.toFixed(1);
	};

	const handleFilterChange = (key: string, value: string) => {
		setFilters((prev) => ({ ...prev, [key]: value }));
	};

	const handleSortChange = (newSortBy: typeof sortBy) => {
		if (sortBy === newSortBy) {
			setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
		} else {
			setSortBy(newSortBy);
			setSortOrder("desc");
		}
	};

	if (loading) {
		return <Spinner />;
	}

	return (
		<div className="space-y-6">
			{/* Filters */}
			{!isPublic && (
				<Card className="p-4">
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
						<div>
							<label className="block text-sm font-medium text-gray-700 mb-1">Date From</label>
							<Input type="date" value={filters.dateFrom} onChange={(e) => handleFilterChange("dateFrom", e.target.value)} />
						</div>
						<div>
							<label className="block text-sm font-medium text-gray-700 mb-1">Date To</label>
							<Input type="date" value={filters.dateTo} onChange={(e) => handleFilterChange("dateTo", e.target.value)} />
						</div>
						<div>
							<label className="block text-sm font-medium text-gray-700 mb-1">Min Size (MB)</label>
							<Input type="number" value={filters.sizeMin} onChange={(e) => handleFilterChange("sizeMin", e.target.value)} placeholder="0" />
						</div>
						<div>
							<label className="block text-sm font-medium text-gray-700 mb-1">Max Size (MB)</label>
							<Input type="number" value={filters.sizeMax} onChange={(e) => handleFilterChange("sizeMax", e.target.value)} placeholder="100" />
						</div>
					</div>
					<div className="mt-4 flex gap-2">
						<Button variant={sortBy === "created_at" ? "default" : "outline"} size="sm" onClick={() => handleSortChange("created_at")}>
							Date {sortBy === "created_at" && (sortOrder === "desc" ? "↓" : "↑")}
						</Button>
						<Button variant={sortBy === "compressed_size" ? "default" : "outline"} size="sm" onClick={() => handleSortChange("compressed_size")}>
							Size {sortBy === "compressed_size" && (sortOrder === "desc" ? "↓" : "↑")}
						</Button>
						<Button variant={sortBy === "duration" ? "default" : "outline"} size="sm" onClick={() => handleSortChange("duration")}>
							Duration {sortBy === "duration" && (sortOrder === "desc" ? "↓" : "↑")}
						</Button>
					</div>
				</Card>
			)}

			{/* Video Grid */}
			{videos.length === 0 ? (
				<div className="text-center py-12">
					<p className="text-gray-500 text-lg">{isPublic ? "No public videos found." : "No videos found matching your criteria."}</p>
				</div>
			) : (
				<>
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
						{videos.map((video) => (
							<Card key={video.id} className="overflow-hidden">
								<div className="aspect-video bg-gray-100">
									<video className="w-full h-full object-cover" controls preload="metadata" src={getVideoUrl(video)}>
										Your browser does not support the video tag.
									</video>
								</div>
								<div className="p-4">
									<div className="flex items-start justify-between mb-2">
										<h3 className="font-semibold text-gray-900 truncate">{video.title}</h3>
										{video.is_public && <Badge variant="secondary">Public</Badge>}
									</div>
									<p className="text-xs text-gray-400 mb-2">{formatDate(video.created_at)}</p>
									<div className="text-sm text-gray-500 space-y-1 mb-3">
										<p>Size: {formatFileSize(video.compressed_size || 0)}</p>
										{video.original_size && <p>Compression: {getCompressionRatio(video.original_size, video.compressed_size || 0)}% saved</p>}
									</div>
									{showActions && user && video.owner_id === user.id && (
										<div className="flex gap-2">
											<Button size="sm" variant="outline" onClick={() => handleDownload(video)}>
												Download
											</Button>
											<Button size="sm" variant="outline" onClick={() => handleShare(video)}>
												{video.is_public ? "Copy Link" : "Share"}
											</Button>
											<Button size="sm" variant="destructive" onClick={() => handleDelete(video)}>
												Delete
											</Button>
										</div>
									)}
								</div>
							</Card>
						))}
					</div>

					{/* Load More */}
					{hasMore && (
						<div className="text-center py-4">
							<Button onClick={loadMore} disabled={loadingMore} variant="outline">
								{loadingMore ? <Spinner /> : "Load More"}
							</Button>
						</div>
					)}
				</>
			)}
		</div>
	);
}
