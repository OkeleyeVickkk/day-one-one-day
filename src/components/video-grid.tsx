import { useState, useEffect } from "react";
import { supabase } from "../lib/supabaseClient";
import { LoadingSpinner } from "./loading-spinner";

interface Video {
	id: string;
	date: string;
	video_path: string;
	duration: number;
	compressed_size: number;
	created_at: string;
}

interface VideoGridProps {
	isPublic?: boolean;
	userId?: string;
}

export default function VideoGrid({ isPublic = false, userId }: VideoGridProps) {
	const [videos, setVideos] = useState<Video[]>([]);
	const [loading, setLoading] = useState(true);
	const [signedUrls, setSignedUrls] = useState<Record<string, string>>({});

	useEffect(() => {
		fetchVideos();
	}, [isPublic, userId]);

	const fetchVideos = async () => {
		try {
			let query = supabase.from("daily_videos").select("*").order("date", { ascending: false });

			if (isPublic && userId) {
				query = query.eq("user_id", userId);
			} else {
				// For authenticated user, get their own videos
				const {
					data: { user },
				} = await supabase.auth.getUser();
				if (user) {
					query = query.eq("user_id", user.id);
				}
			}

			const { data, error } = await query;
			if (error) throw error;

			setVideos(data || []);

			// For public view, generate signed URLs
			if (isPublic && data) {
				const urls: Record<string, string> = {};
				for (const video of data) {
					const { data: signedUrlData } = await supabase.storage.from("daily-videos").createSignedUrl(video.video_path, 86400); // 24 hours

					if (signedUrlData?.signedUrl) {
						urls[video.id] = signedUrlData.signedUrl;
					}
				}
				setSignedUrls(urls);
			}
		} catch (error) {
			console.error("Error fetching videos:", error);
		} finally {
			setLoading(false);
		}
	};

	const getVideoUrl = (video: Video) => {
		if (isPublic) {
			return signedUrls[video.id] || "";
		} else {
			// For authenticated users, use the regular public URL
			const { data } = supabase.storage.from("daily-videos").getPublicUrl(video.video_path);
			return data.publicUrl;
		}
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

	const formatDuration = (seconds: number) => {
		const mins = Math.floor(seconds / 60);
		const secs = seconds % 60;
		return `${mins}:${secs.toString().padStart(2, "0")}`;
	};

	const formatFileSize = (bytes: number) => {
		const mb = bytes / (1024 * 1024);
		return `${mb.toFixed(1)} MB`;
	};

	if (loading) {
		return <LoadingSpinner />;
	}

	if (videos.length === 0) {
		return (
			<div className="text-center py-12">
				<p className="text-gray-500 text-lg">
					{isPublic ? "No videos in this journey yet." : "No videos uploaded yet. Start recording your daily moments!"}
				</p>
			</div>
		);
	}

	return (
		<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
			{videos.map((video) => (
				<div key={video.id} className="bg-white rounded-lg shadow-md overflow-hidden">
					<div className="aspect-video bg-gray-100">
						<video className="w-full h-full object-cover" controls preload="metadata" src={getVideoUrl(video)}>
							Your browser does not support the video tag.
						</video>
					</div>
					<div className="p-4">
						<h3 className="font-semibold text-gray-900 mb-1">{formatDate(video.date)}</h3>
						<div className="text-sm text-gray-500 space-y-1">
							<p>Duration: {formatDuration(video.duration)}</p>
							<p>Size: {formatFileSize(video.compressed_size)}</p>
						</div>
					</div>
				</div>
			))}
		</div>
	);
}
