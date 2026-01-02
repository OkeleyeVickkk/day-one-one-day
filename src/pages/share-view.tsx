import { useState, useEffect } from "react";
import { useParams } from "react-router";
import { supabase } from "../lib/supabaseClient";
import { useAuth } from "../contexts/auth-context";
import { Spinner } from "../components/ui/spinner";
import { Button } from "../components/ui/button";
import VideoGrid from "../components/video-grid";

interface Video {
	id: string;
	title: string;
	drive_file_id: string;
	compressed_size: number | null;
	created_at: string;
	is_public: boolean;
	owner_id: string;
	status: string;
	views_count: number;
}

export default function ShareView() {
	const { token, share_hash } = useParams<{ token?: string; share_hash?: string }>();
	const { user } = useAuth();
	const [videos, setVideos] = useState<Video[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const formatDate = (dateString: string) => {
		const date = new Date(dateString);
		return date.toLocaleDateString("en-US", {
			year: "numeric",
			month: "long",
			day: "numeric",
		});
	};

	const formatFileSize = (bytes: number) => {
		const mb = bytes / (1024 * 1024);
		return `${mb.toFixed(1)} MB`;
	};

	const getVideoUrl = (video: Video) => {
		return `https://drive.google.com/file/d/${video.drive_file_id}/view`;
	};

	const handleDownload = async (video: Video) => {
		// Only allow download for video owner
		if (!user || video.owner_id !== user.id) {
			alert("You can only download videos you own");
			return;
		}

		const downloadUrl = `https://drive.google.com/uc?export=download&id=${video.drive_file_id}`;
		const link = document.createElement("a");
		link.href = downloadUrl;
		link.download = `video_${video.id}.mp4`;
		link.click();
	};

	useEffect(() => {
		if (token) {
			fetchSharedVideosByToken(token);
		} else if (share_hash) {
			fetchSharedVideoByHash(share_hash);
		}
	}, [token, share_hash]);

	const fetchSharedVideosByToken = async (shareToken: string) => {
		try {
			// First, find the profile with this share token
			const { data: profile, error: profileError } = await supabase
				.from("profiles")
				.select("user_id")
				.eq("share_token", shareToken)
				.single();

			if (profileError || !profile) {
				setError("This journey is private or the link has expired.");
				return;
			}

			// Fetch all videos for this user
			const { data: videosData, error: videosError } = await supabase
				.from("videos")
				.select("*")
				.eq("user_id", profile.user_id)
				.order("created_at", { ascending: true });

			if (videosError) throw videosError;

			setVideos(videosData || []);
		} catch (error) {
			console.error("Error fetching shared videos:", error);
			setError("Failed to load the shared journey.");
		} finally {
			setLoading(false);
		}
	};

	const fetchSharedVideoByHash = async (shareHash: string) => {
		try {
			// Find the video by share_hash (assuming id is used as share_hash)
			const { data: video, error: videoError } = await supabase.from("videos").select("*").eq("id", shareHash).eq("is_public", true).single();

			if (videoError || !video) {
				setError("This video is private or doesn't exist.");
				return;
			}

			// Track view count
			await supabase.rpc("record_video_view", { video_id: video.id });

			setVideos([video]);
		} catch (error) {
			console.error("Error fetching shared video:", error);
			setError("Failed to load the shared video.");
		} finally {
			setLoading(false);
		}
	};

	if (loading) {
		return (
			<div className="min-h-screen flex items-center justify-center">
				<Spinner />
			</div>
		);
	}

	if (error) {
		return (
			<div className="min-h-screen flex items-center justify-center">
				<div className="text-center">
					<h1 className="text-2xl font-bold text-gray-900 mb-4">Video Not Found</h1>
					<p className="text-gray-600">{error}</p>
				</div>
			</div>
		);
	}

	// Single video view
	if (share_hash && videos.length === 1) {
		const video = videos[0];
		return (
			<div className="min-h-screen bg-gray-50">
				<div className="max-w-4xl mx-auto px-4 py-8">
					<div className="bg-white rounded-lg shadow-md overflow-hidden">
						<div className="p-4">
							<h1 className="text-2xl font-bold text-gray-900 mb-4">{formatDate(video.created_at)}</h1>
							<div className="aspect-video bg-gray-100 rounded mb-4">
								<video className="w-full h-full object-cover" controls preload="metadata" src={getVideoUrl(video)}>
									Your browser does not support the video tag.
								</video>
							</div>
							<div className="flex items-center justify-between">
								<div className="text-sm text-gray-500">
									Size: {formatFileSize(video.compressed_size || 0)}
								</div>
								{user && video.owner_id === user.id && (
									<Button onClick={() => handleDownload(video)} variant="outline">
										Download
									</Button>
								)}
							</div>
						</div>
					</div>
				</div>
			</div>
		);
	}

	const getJourneyTitle = () => {
		if (videos.length === 0) return "A Journey";

		const startDate = new Date(videos[0].created_at);
		const endDate = new Date(videos[videos.length - 1].created_at);
		const startYear = startDate.getFullYear();
		const endYear = endDate.getFullYear();

		if (startYear === endYear) {
			return `${startYear} Journey`;
		} else {
			return `${startYear} - ${endYear} Journey`;
		}
	};

	return (
		<div className="min-h-screen bg-gray-50">
			<div className="max-w-6xl mx-auto px-4 py-8">
				<header className="text-center mb-12">
					<h1 className="text-4xl font-bold text-gray-900 mb-4">{getJourneyTitle()}</h1>
					<p className="text-xl text-gray-600">{videos.length} days of memories</p>
				</header>

				{videos.length === 0 ? (
					<div className="text-center py-12">
						<p className="text-gray-500">No videos in this journey yet.</p>
					</div>
				) : (
					<VideoGrid videos={videos} isPublic={true} showActions={false} />
				)}
			</div>
		</div>
	);
}
